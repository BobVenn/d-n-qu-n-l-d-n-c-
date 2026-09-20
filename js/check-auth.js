// js/check-auth.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath.includes('login.html') || currentPath.includes('register.html');

  if (!user) {
    if (!isLoginPage) {
      window.location.href = currentPath.includes('/pages/') ? 'login.html' : 'pages/login.html';
    }
  } else {
    if (isLoginPage) {
      window.location.href = '../index.html';
      return;
    }

    const userNameEl = document.getElementById('userDisplayName');
    const userRoleBadge = document.getElementById('userRoleBadge');

    if (userNameEl) userNameEl.textContent = user.displayName || user.email;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userRole = 'Citizen'; // Mặc định là Cư dân

      if (userDoc.exists()) {
        const userData = userDoc.data();
        userRole = userData.role || 'Citizen';

        if (userNameEl && userData.displayName) {
          userNameEl.textContent = userData.displayName;
        }
      }

      // 1. Cập nhật Badge hiển thị vai trò
      if (userRoleBadge) {
        const roleNames = {
          'Admin': 'Quản trị viên',
          'Manager': 'Cán bộ tổ dân phố',
          'Citizen': 'Cư dân'
        };
        userRoleBadge.textContent = roleNames[userRole] || 'Cư dân';
        
        if (userRole === 'Admin' || userRole === 'Manager') {
          userRoleBadge.className = 'user-badge bg-primary text-white';
        } else {
          userRoleBadge.className = 'user-badge bg-secondary text-white';
        }
      }

      // 2. PHÂN QUYỀN GIAO DIỆN & ĐIỀU HƯỚNG TRUY CẬP
      applyRolePermissions(userRole, currentPath);

    } catch (err) {
      console.error("Lỗi xác thực vai trò:", err);
    }
  }
});

// Hàm ẩn menu & chặn truy cập các trang Admin
const applyRolePermissions = (role, currentPath) => {
  const isAdmin = role === 'Admin' || role === 'Manager';

  // 1. Chặn Cư dân gõ URL trực tiếp vào các trang Quản lý
  const adminOnlyPages = ['ho-khau.html', 'nhan-khau.html', 'thu-phi.html'];
  const isAccessingAdminPage = adminOnlyPages.some(page => currentPath.includes(page));

  if (!isAdmin && isAccessingAdminPage) {
    alert("Tài khoản Cư dân không có quyền truy cập trang quản lý này!");
    // Điều hướng an toàn theo đường dẫn tương đối
    const redirectTarget = currentPath.includes('/pages/') ? 'phan-anh.html' : 'pages/phan-anh.html';
    window.location.href = redirectTarget;
    return;
  }

  // 2. Ẩn/Hiện các phần tử class `admin-only` (Giữ nguyên display gốc thay vì dùng 'block')
  const adminElements = document.querySelectorAll('.admin-only');
  adminElements.forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
};

// Hàm Đăng xuất
export const logoutUser = async () => {
  try {
    await signOut(auth);
    const currentPath = window.location.pathname;
    window.location.href = currentPath.includes('/pages/') ? 'login.html' : 'pages/login.html';
  } catch (error) {
    console.error("Lỗi đăng xuất:", error);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      logoutUser();
    });
  }
});