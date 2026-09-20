// js/services/phanAnhService.js
import { auth, db } from '../firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
    collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentUser = null;
let currentUserRole = 'Citizen';
let currentUserData = null;
let allFeedbacks = []; // Cache dữ liệu để tìm kiếm/lọc
let phanAnhModalInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo Bootstrap Modal Instance
    const modalEl = document.getElementById('phanAnhModal');
    if (modalEl) {
        phanAnhModalInstance = new bootstrap.Modal(modalEl);
    }

    // Sự kiện khi bấm nút "Gửi Phản Ánh Mới"
    const openAddModalBtn = document.getElementById('openAddModalBtn');
    if (openAddModalBtn) {
        openAddModalBtn.addEventListener('click', openCreateModal);
    }

    // Sự kiện Lọc & Tìm kiếm
    document.getElementById('searchInput')?.addEventListener('input', applyFilters);
    document.getElementById('statusFilter')?.addEventListener('change', applyFilters);
    document.getElementById('btnResetFilter')?.addEventListener('click', resetFilters);

    // Sự kiện Submit Form
    document.getElementById('phanAnhForm')?.addEventListener('submit', handleFormSubmit);
});

// 1. KIỂM TRA TRẠNG THÁI XÁC THỰC VÀ TẢI DỮ LIỆU
onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    currentUser = user;

    try {
        // Lấy thông tin chi tiết người dùng từ Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            currentUserData = userDoc.data();
            currentUserRole = currentUserData.role || 'Citizen';
        }

        // Tải danh sách phản ánh
        await loadPhanAnhData();

    } catch (error) {
        console.error("Lỗi khởi tạo dữ liệu Phản ánh:", error);
    }
});

// 2. TẢI DANH SÁCH PHẢN ÁNH THEO PHÂN QUYỀN
async function loadPhanAnhData() {
    const tableBody = document.getElementById('phanAnhTableBody');
    if (!tableBody) return;

    try {
        let q;
        const isAdmin = currentUserRole === 'Admin' || currentUserRole === 'Manager';

        if (isAdmin) {
            // Admin/Manager: Xem tất cả phản ánh
            q = query(collection(db, 'feedbacks'));
        } else {
            // Cư dân: CHỈ xem phản ánh do chính UID này tạo ra
            q = query(collection(db, 'feedbacks'), where('userId', '==', currentUser.uid));
        }

        const snapshot = await getDocs(q);
        allFeedbacks = [];

        snapshot.forEach(docSnap => {
            allFeedbacks.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        renderTable(allFeedbacks);

    } catch (error) {
        console.error("Lỗi tải danh sách phản ánh:", error);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-danger py-4">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
    }
}

// 3. HIỂN THỊ DỮ LIỆU BẢNG
function renderTable(dataList) {
    const tableBody = document.getElementById('phanAnhTableBody');
    if (!tableBody) return;

    if (dataList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="py-4 text-muted">Không tìm thấy phản ánh nào.</td></tr>`;
        return;
    }

    const isAdmin = currentUserRole === 'Admin' || currentUserRole === 'Manager';

    tableBody.innerHTML = dataList.map(item => {
        const createdDate = item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('vi-VN') : (item.createdDate || 'Mới gửi');
        const statusBadge = getStatusBadge(item.trangThai || 'Đang chờ');

        // Thao tác: Cư dân xem chi tiết/xóa bài chờ, Admin có quyền Cập nhật trạng thái
        let actionButtons = '';
        if (isAdmin) {
            actionButtons = `<button class="btn btn-sm btn-outline-primary" onclick="openEditModal('${item.id}')"><i class="fa-solid fa-pen-to-square"></i> Xử lý</button>`;
        } else {
            actionButtons = `<button class="btn btn-sm btn-outline-info me-1" onclick="openViewModal('${item.id}')"><i class="fa-solid fa-eye"></i> Xem</button>`;
            if (item.trangThai === 'Đang chờ') {
                actionButtons += `<button class="btn btn-sm btn-outline-danger" onclick="deletePhanAnh('${item.id}')"><i class="fa-solid fa-trash"></i></button>`;
            }
        }

        return `
            <tr>
                <td class="text-start">
                    <strong class="text-dark">${escapeHtml(item.tieuDe)}</strong>
                </td>
                <td><span class="badge bg-light text-dark border">${escapeHtml(item.linhVuc || 'Khác')}</span></td>
                <td>
                    <div class="fw-semibold">${escapeHtml(item.nguoiGui)}</div>
                    <small class="text-muted">${escapeHtml(item.lienHe)}</small>
                </td>
                <td><small>${createdDate}</small></td>
                <td>${statusBadge}</td>
                <td>${actionButtons}</td>
            </tr>
        `;
    }).join('');
}

// 4. MỞ MODAL GỬI PHẢN ÁNH (DÀNH CHO CƯ DÂN)
function openCreateModal() {
    const form = document.getElementById('phanAnhForm');
    form.reset();
    document.getElementById('docId').value = '';
    document.getElementById('modalTitle').textContent = 'Gửi Phản Ánh Mới';

    // Tự động điền thông tin người gửi & Khóa chỉnh sửa (Readonly)
    const nguoiGuiInput = document.getElementById('nguoiGui');
    const lienHeInput = document.getElementById('lienHe');

    const displayName = currentUserData?.displayName || currentUser?.displayName || 'Cư dân';
    const contactInfo = currentUserData?.phone || currentUser?.email || '';

    nguoiGuiInput.value = displayName;
    nguoiGuiInput.readOnly = true;
    nguoiGuiInput.classList.add('bg-light');

    lienHeInput.value = contactInfo;
    lienHeInput.readOnly = true;
    lienHeInput.classList.add('bg-light');

    // Mở lại các ô nội dung cho cư dân gõ
    document.getElementById('tieuDe').readOnly = false;
    document.getElementById('linhVuc').disabled = false;
    document.getElementById('noiDung').readOnly = false;

    // Ẩn phần cập nhật trạng thái của Cán bộ
    const trangThaiWrapper = document.getElementById('trangThaiWrapper');
    if (trangThaiWrapper) trangThaiWrapper.style.display = 'none';

    phanAnhModalInstance.show();
}

// 5. MỞ MODAL XỬ LÝ PHẢN ÁNH (DÀNH CHO ADMIN)
window.openEditModal = (id) => {
    const item = allFeedbacks.find(f => f.id === id);
    if (!item) return;

    document.getElementById('docId').value = item.id;
    document.getElementById('modalTitle').textContent = 'Cập Nhật Trạng Thái Phản Ánh';

    // Đổ dữ liệu vào form
    document.getElementById('tieuDe').value = item.tieuDe;
    document.getElementById('tieuDe').readOnly = true;

    document.getElementById('linhVuc').value = item.linhVuc || 'Khác';
    document.getElementById('linhVuc').disabled = true;

    document.getElementById('nguoiGui').value = item.nguoiGui;
    document.getElementById('nguoiGui').readOnly = true;

    document.getElementById('lienHe').value = item.lienHe;
    document.getElementById('lienHe').readOnly = true;

    document.getElementById('noiDung').value = item.noiDung;
    document.getElementById('noiDung').readOnly = true;

    // Hiển thị phần chọn trạng thái
    const trangThaiWrapper = document.getElementById('trangThaiWrapper');
    if (trangThaiWrapper) {
        trangThaiWrapper.style.display = 'block';
        document.getElementById('trangThai').value = item.trangThai || 'Đang chờ';
    }

    phanAnhModalInstance.show();
};

// 6. MỞ MODAL XEM CHI TIẾT (CƯ DÂN)
window.openViewModal = (id) => {
    window.openEditModal(id);
    document.getElementById('modalTitle').textContent = 'Chi Tiết Phản Ánh';
    document.getElementById('trangThaiWrapper').style.display = 'none';
};

// 7. XỬ LÝ SUBMIT FORM (TẠO MỚI / CẬP NHẬT)
async function handleFormSubmit(e) {
    e.preventDefault();

    const docId = document.getElementById('docId').value;
    const isAdmin = currentUserRole === 'Admin' || currentUserRole === 'Manager';

    try {
        if (docId) {
            // ADMIN CẬP NHẬT TRẠNG THÁI
            if (!isAdmin) {
                alert("Cư dân không có quyền sửa trạng thái phản ánh!");
                return;
            }

            const newStatus = document.getElementById('trangThai').value;
            await updateDoc(doc(db, 'feedbacks', docId), {
                trangThai: newStatus,
                updatedAt: serverTimestamp()
            });

            alert("Đã cập nhật trạng thái thành công!");
        } else {
            // CƯ DÂN TẠO PHẢN ÁNH MỚI
            const tieuDe = document.getElementById('tieuDe').value.trim();
            const linhVuc = document.getElementById('linhVuc').value;
            const nguoiGui = document.getElementById('nguoiGui').value;
            const lienHe = document.getElementById('lienHe').value;
            const noiDung = document.getElementById('noiDung').value.trim();

            await addDoc(collection(db, 'feedbacks'), {
                userId: currentUser.uid, // Gán cứng UID người tạo
                tieuDe,
                linhVuc,
                nguoiGui,
                lienHe,
                noiDung,
                trangThai: 'Đang chờ', // Trạng thái mặc định
                createdAt: serverTimestamp()
            });

            alert("Gửi phản ánh thành công!");
        }

        phanAnhModalInstance.hide();
        await loadPhanAnhData(); // Tải lại danh sách

    } catch (error) {
        console.error("Lỗi khi lưu phản ánh:", error);
        alert("Có lỗi xảy ra: " + error.message);
    }
}

// 8. XÓA PHẢN ÁNH (Chỉ dành cho Cư dân khi đơn còn "Đang chờ")
window.deletePhanAnh = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phản ánh này?")) return;

    try {
        await deleteDoc(doc(db, 'feedbacks', id));
        alert("Đã xóa phản ánh!");
        await loadPhanAnhData();
    } catch (error) {
        console.error("Lỗi xóa phản ánh:", error);
        alert("Không thể xóa phản ánh: " + error.message);
    }
};

// 9. LỌC & TÌM KIẾM
function applyFilters() {
    const keyword = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    const statusVal = document.getElementById('statusFilter')?.value || '';

    const filtered = allFeedbacks.filter(item => {
        const matchesKeyword = (
            (item.tieuDe && item.tieuDe.toLowerCase().includes(keyword)) ||
            (item.nguoiGui && item.nguoiGui.toLowerCase().includes(keyword)) ||
            (item.noiDung && item.noiDung.toLowerCase().includes(keyword))
        );
        const matchesStatus = statusVal === '' || item.trangThai === statusVal;

        return matchesKeyword && matchesStatus;
    });

    renderTable(filtered);
}

function resetFilters() {
    if (document.getElementById('searchInput')) document.getElementById('searchInput').value = '';
    if (document.getElementById('statusFilter')) document.getElementById('statusFilter').value = '';
    renderTable(allFeedbacks);
}

// BỔ TRỢ: BADGE TRẠNG THÁI & ESCAPE HTML
function getStatusBadge(status) {
    switch (status) {
        case 'Đã giải quyết':
            return `<span class="badge bg-success"><i class="fa-solid fa-circle-check me-1"></i>Đã giải quyết</span>`;
        case 'Đang xử lý':
            return `<span class="badge bg-warning text-dark"><i class="fa-solid fa-spinner fa-spin me-1"></i>Đang xử lý</span>`;
        default:
            return `<span class="badge bg-secondary"><i class="fa-solid fa-clock me-1"></i>Đang chờ</span>`;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}