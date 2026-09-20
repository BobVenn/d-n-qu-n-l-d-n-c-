import { auth, db } from '../firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
    collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let allFees = [];
let thuPhiModalInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('thuPhiModal');
    if (modalEl) thuPhiModalInstance = new bootstrap.Modal(modalEl);

    document.getElementById('openAddModalBtn')?.addEventListener('click', openCreateModal);
    document.getElementById('thuPhiForm')?.addEventListener('submit', handleFormSubmit);

    document.getElementById('searchInput')?.addEventListener('input', applyFilters);
    document.getElementById('statusFilter')?.addEventListener('change', applyFilters);
    document.getElementById('btnResetFilter')?.addEventListener('click', resetFilters);
});

onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    await loadFeesAdmin();
});

// 1. TẢI DANH SÁCH CÁC KHOẢN THU (ADMIN)
async function loadFeesAdmin() {
    const tbody = document.getElementById('thuPhiTableBody');
    if (!tbody) return;

    try {
        const snapshot = await getDocs(collection(db, 'fees'));
        allFees = [];

        snapshot.forEach(docSnap => {
            allFees.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        renderAdminTable(allFees);
    } catch (error) {
        console.error("Lỗi tải danh sách khoản thu:", error);
        tbody.innerHTML = `<tr><td colspan="6" class="text-danger py-4">Lỗi: ${error.message}</td></tr>`;
    }
}

// 2. RENDER BẢNG QUẢN LÝ DÀNH CHO ADMIN
function renderAdminTable(dataList) {
    const tbody = document.getElementById('thuPhiTableBody');
    if (!tbody) return;

    if (dataList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-muted">Chưa có khoản thu nào. Hãy bấm "Tạo Khoản Thu Mới".</td></tr>`;
        return;
    }

    tbody.innerHTML = dataList.map(fee => {
        const title = fee.title || fee.tenKhoanThu || 'N/A';
        const amount = Number(fee.amount || fee.soTien || 0).toLocaleString('vi-VN');
        const dueDate = fee.dueDate || fee.hanNop || 'N/A';
        const type = fee.type || fee.loaiKhoanThu || 'Bắt buộc';

        return `
            <tr>
                <td class="text-start">
                    <strong class="text-dark">${escapeHtml(title)}</strong>
                    <div><small class="text-muted">Loại: ${escapeHtml(type)}</small></div>
                </td>
                <td><span class="badge bg-light text-dark border">${escapeHtml(fee.maHoKhau || 'Tất cả')}</span></td>
                <td class="text-danger fw-bold">${amount} VNĐ</td>
                <td><small>${dueDate}</small></td>
                <td><span class="badge bg-info text-dark"><i class="fa-solid fa-bullhorn me-1"></i>Đang thu</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="viewPaymentReport('${fee.id}', '${escapeHtml(title)}')">
                        <i class="fa-solid fa-list-check"></i> Chi tiết
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteFee('${fee.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// 3. MỞ MODAL TẠO KHOẢN THU MỚI
function openCreateModal() {
    document.getElementById('thuPhiForm').reset();
    document.getElementById('docId').value = '';
    document.getElementById('modalTitle').textContent = 'Tạo Khoản Thu Mới';
    thuPhiModalInstance.show();
}

// 4. SUBMIT TẠO KHOẢN THU
async function handleFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('tenKhoanThu').value.trim();
    const maHoKhau = document.getElementById('maHoKhau').value.trim();
    const amount = Number(document.getElementById('soTien').value);
    const dueDate = document.getElementById('hanNop').value;
    const type = document.getElementById('loaiKhoanThu').value;
    const ghiChu = document.getElementById('ghiChu').value.trim();

    try {
        await addDoc(collection(db, 'fees'), {
            title,
            tenKhoanThu: title,
            maHoKhau,
            amount,
            soTien: amount,
            dueDate,
            hanNop: dueDate,
            type,
            loaiKhoanThu: type,
            ghiChu,
            createdAt: serverTimestamp()
        });

        alert("Tạo khoản thu mới thành công!");
        thuPhiModalInstance.hide();
        await loadFeesAdmin();

    } catch (error) {
        console.error("Lỗi khi tạo khoản thu:", error);
        alert("Lỗi: " + error.message);
    }
}

// 5. XEM BÁO CÁO CHI TIẾT HỘ ĐÃ ĐÓNG / CHƯA ĐÓNG
window.viewPaymentReport = async (feeId, feeTitle) => {
    try {
        // Lấy tất cả Hộ gia đình
        const householdSnap = await getDocs(collection(db, 'households'));
        const allHouseholds = householdSnap.docs.map(d => d.data());

        // Lấy danh sách đã thanh toán
        const payQuery = query(collection(db, 'payments'), where('feeId', '==', feeId));
        const paySnap = await getDocs(payQuery);
        const paidHouseholdCodes = new Set(paySnap.docs.map(d => d.data().householdCode));

        let reportMsg = `BÁO CÁO NỘP TIỀN KHOẢN THU: ${feeTitle}\n`;
        reportMsg += `----------------------------------------\n`;
        reportMsg += `TỔNG SỐ HỘ ĐÃ NỘP: ${paidHouseholdCodes.size}\n\n`;

        allHouseholds.forEach(h => {
            const status = paidHouseholdCodes.has(h.code || h.maHoKhau) ? "[✓ ĐÃ NỘP]" : "[X CHƯA NỘP]";
            reportMsg += `Hộ: ${h.code || h.maHoKhau || 'N/A'} - Chủ hộ: ${h.ownerName || h.tenChuHo || 'N/A'} ${status}\n`;
        });

        alert(reportMsg);

    } catch (error) {
        console.error("Lỗi lấy báo cáo:", error);
        alert("Không thể lấy dữ liệu báo cáo: " + error.message);
    }
};

// 6. XÓA KHOẢN THU
window.deleteFee = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa khoản thu này không?")) return;

    try {
        await deleteDoc(doc(db, 'fees', id));
        alert("Đã xóa khoản thu!");
        await loadFeesAdmin();
    } catch (error) {
        console.error("Lỗi xóa khoản thu:", error);
        alert("Lỗi khi xóa: " + error.message);
    }
};

// LỌC & TÌM KIẾM
function applyFilters() {
    const keyword = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    const filtered = allFees.filter(fee => {
        const title = (fee.title || fee.tenKhoanThu || '').toLowerCase();
        const code = (fee.maHoKhau || '').toLowerCase();
        return title.includes(keyword) || code.includes(keyword);
    });
    renderAdminTable(filtered);
}

function resetFilters() {
    if (document.getElementById('searchInput')) document.getElementById('searchInput').value = '';
    if (document.getElementById('statusFilter')) document.getElementById('statusFilter').value = '';
    renderAdminTable(allFees);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}