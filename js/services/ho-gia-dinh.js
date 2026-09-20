// js/ho-gia-dinh.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    try {
        // 1. Tìm thông tin nhân khẩu của user đăng nhập dựa vào Email
        const residentQuery = query(collection(db, 'residents'), where('email', '==', user.email));
        const residentSnapshot = await getDocs(residentQuery);

        if (residentSnapshot.empty) {
            document.getElementById('householdInfo').innerHTML = `<p class="text-danger mb-0">Tài khoản chưa được liên kết với thông tin hộ khẩu nào trong hệ thống.</p>`;
            document.getElementById('familyMembersList').innerHTML = `<tr><td colspan="6" class="text-center text-muted">Không có dữ liệu</td></tr>`;
            return;
        }

        let myResidentData = null;
        residentSnapshot.forEach(doc => {
            myResidentData = doc.data();
        });

        const myHouseholdCode = myResidentData.householdCode;

        if (!myHouseholdCode) {
            document.getElementById('householdInfo').innerHTML = `<p class="text-warning mb-0">Tài khoản chưa gán mã hộ khẩu.</p>`;
            return;
        }

        // 2. Lấy thông tin Sổ hộ khẩu
        const householdQuery = query(collection(db, 'households'), where('code', '==', myHouseholdCode));
        const householdSnapshot = await getDocs(householdQuery);

        if (!householdSnapshot.empty) {
            householdSnapshot.forEach(doc => {
                const data = doc.data();
                document.getElementById('householdCode').textContent = data.code || '---';
                document.getElementById('ownerName').textContent = data.ownerName || '---';
                document.getElementById('address').textContent = data.address || '---';
            });
        }

        // 3. Lấy tất cả thành viên trong hộ gia đình đó
        const familyQuery = query(collection(db, 'residents'), where('householdCode', '==', myHouseholdCode));
        const familySnapshot = await getDocs(familyQuery);

        const tbody = document.getElementById('familyMembersList');
        tbody.innerHTML = '';

        let index = 1;
        familySnapshot.forEach(doc => {
            const member = doc.data();
            tbody.innerHTML += `
                <tr>
                    <td>${index++}</td>
                    <td><strong>${member.fullName || '---'}</strong></td>
                    <td><span class="badge bg-info text-dark">${member.relation || 'Thành viên'}</span></td>
                    <td>${member.dob || '---'}</td>
                    <td>${member.gender || '---'}</td>
                    <td>${member.idCard || '---'}</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Lỗi lấy dữ liệu gia đình:", error);
    }
});