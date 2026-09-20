import { auth, db } from '../firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
    collection, getDocs, getDoc, doc, addDoc, query, where, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentUser = null;
let currentHouseholdCode = '';
let selectedFee = null;
let paymentModalInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('paymentModal');
    if (modalEl) paymentModalInstance = new bootstrap.Modal(modalEl);

    document.getElementById('btnConfirmPay')?.addEventListener('click', handlePaymentSubmit);
});

onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    currentUser = user;

    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            currentHouseholdCode = userDoc.data().householdCode || userDoc.data().maHoKhau || 'HK_MAC_DINH';
        }
        await loadCitizenFees();
    } catch (error) {
        console.error("Lỗi khởi tạo dữ liệu nộp phí:", error);
    }
});

async function loadCitizenFees() {
    const tbody = document.getElementById('citizenFeeTableBody');
    if (!tbody) return;

    try {
        // 1. Lấy danh sách các khoản phí do Admin tạo
        const feeSnap = await getDocs(collection(db, 'fees'));

        // 2. Lấy danh sách các khoản phí mà Hộ này ĐÃ nộp
        const payQuery = query(collection(db, 'payments'), where('householdCode', '==', currentHouseholdCode));
        const paySnap = await getDocs(payQuery);
        
        const paidFeeIds = new Set();
        paySnap.forEach(docSnap => {
            paidFeeIds.add(docSnap.data().feeId);
        });

        if (feeSnap.empty) {
            tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-muted">Hiện tại chưa có khoản thu nào.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        feeSnap.forEach(docSnap => {
            const fee = { id: docSnap.id, ...docSnap.data() };
            const isPaid = paidFeeIds.has(fee.id);

            const statusBadge = isPaid 
                ? `<span class="badge bg-success"><i class="fa-solid fa-circle-check me-1"></i>Đã đóng</span>`
                : `<span class="badge bg-warning text-dark"><i class="fa-solid fa-clock me-1"></i>Chưa đóng</span>`;

            const actionBtn = isPaid
                ? `<button class="btn btn-sm btn-secondary" disabled><i class="fa-solid fa-check"></i> Hoàn tất</button>`
                : `<button class="btn btn-sm btn-primary" onclick="openPaymentModal('${fee.id}', '${escapeHtml(fee.title || fee.tenKhoanThu)}', ${fee.amount || fee.soTien || 0})"><i class="fa-solid fa-credit-card me-1"></i>Thanh toán</button>`;

            tbody.innerHTML += `
                <tr>
                    <td class="text-start fw-bold text-dark">${escapeHtml(fee.title || fee.tenKhoanThu)}</td>
                    <td><span class="badge bg-light text-dark border">${fee.type || fee.loaiKhoanThu || 'Bắt buộc'}</span></td>
                    <td class="text-danger fw-bold">${Number(fee.amount || fee.soTien || 0).toLocaleString('vi-VN')} VNĐ</td>
                    <td><small>${fee.dueDate || fee.hanNop || 'Không giới hạn'}</small></td>
                    <td>${statusBadge}</td>
                    <td>${actionBtn}</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Lỗi tải danh sách khoản phí:", error);
        tbody.innerHTML = `<tr><td colspan="6" class="text-danger py-4">Lỗi: ${error.message}</td></tr>`;
    }
}

window.openPaymentModal = (feeId, title, amount) => {
    selectedFee = { feeId, title, amount };

    document.getElementById('payFeeTitle').textContent = title;
    document.getElementById('payFeeAmount').textContent = Number(amount).toLocaleString('vi-VN') + ' VNĐ';

    // Tạo QR VietQR tự động
    const qrUrl = `https://img.vietqr.io/image/MB-0331000123456-compact2.png?amount=${amount}&addInfo=NOP PHI ${currentHouseholdCode}&accountName=QUY TO DAN PHO`;
    document.getElementById('qrCodeImg').src = qrUrl;

    paymentModalInstance.show();
};

async function handlePaymentSubmit() {
    if (!selectedFee) return;

    try {
        await addDoc(collection(db, 'payments'), {
            feeId: selectedFee.feeId,
            feeTitle: selectedFee.title,
            householdCode: currentHouseholdCode,
            userId: currentUser.uid,
            payerName: currentUser.displayName || 'Cư dân',
            amount: selectedFee.amount,
            status: 'Đã nộp',
            paidAt: serverTimestamp()
        });

        alert("Thanh toán khoản phí thành công!");
        paymentModalInstance.hide();
        await loadCitizenFees(); // Refresh bảng

    } catch (error) {
        console.error("Lỗi nộp tiền:", error);
        alert("Có lỗi xảy ra khi nộp tiền: " + error.message);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}