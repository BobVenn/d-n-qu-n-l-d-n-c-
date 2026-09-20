import { auth, googleProvider, db } from './firebase-config.js';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  const btnGoogleLogin = document.getElementById('btnGoogleLogin');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authMessage = document.getElementById('authMessage');

  // Hàm tiện ích hiển thị thông báo
  const showMessage = (msg, isError = false) => {
    if (!authMessage) return;
    authMessage.textContent = msg;
    authMessage.className = `auth-message ${isError ? 'error' : 'success'}`;
  };

  // Hàm lưu thông tin User vào Firestore
  const saveUserToFirestore = async (user, additionalData = {}) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Nếu là user mới -> Tạo mới thông tin
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || additionalData.fullName || 'Người dùng Tổ dân phố',
        photoURL: user.photoURL || '',
        role: 'Citizen', // Mặc định là Cư dân (admin/manager thay đổi sau)
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        ...additionalData
      });
    } else {
      // Nếu đã tồn tại -> Cập nhật thời gian đăng nhập gần nhất
      await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
    }
  };

  // ----------------------------------------------------
  // 1. ĐĂNG NHẬP BẰNG GOOGLE
  // ----------------------------------------------------
  if (btnGoogleLogin) {
    btnGoogleLogin.addEventListener('click', async () => {
      showMessage('Đang mở cửa sổ đăng nhập Google...');

      try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Lưu thông tin người dùng vào Firestore
        await saveUserToFirestore(user);

        showMessage(`Đăng nhập thành công! Xin chào ${user.displayName || user.email}`);

        setTimeout(() => {
          window.location.href = '../index.html';
        }, 1200);

      } catch (error) {
        console.error('Lỗi đăng nhập Google:', error);
        showMessage(`Lỗi: ${error.message}`, true);
      }
    });
  }

  // ----------------------------------------------------
  // 2. ĐĂNG NHẬP BẰNG EMAIL / MẬT KHẨU
  // ----------------------------------------------------
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email')?.value.trim();
      const password = document.getElementById('password')?.value;

      if (!email || !password) {
        showMessage('Vui lòng nhập đầy đủ Email và Mật khẩu!', true);
        return;
      }

      showMessage('Đang xác thực...');

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await saveUserToFirestore(userCredential.user);

        showMessage('Đăng nhập thành công!');
        setTimeout(() => {
          window.location.href = '../index.html';
        }, 1200);

      } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        let errorText = 'Đăng nhập thất bại!';
        if (error.code === 'auth/invalid-credential') errorText = 'Email hoặc mật khẩu không chính xác!';
        if (error.code === 'auth/user-not-found') errorText = 'Tài khoản không tồn tại!';
        if (error.code === 'auth/wrong-password') errorText = 'Mật khẩu không đúng!';
        showMessage(errorText, true);
      }
    });
  }

  // ----------------------------------------------------
  // 3. ĐĂNG KÝ TÀI KHOẢN NẾU CÓ FORM ĐĂNG KÝ
  // ----------------------------------------------------
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('fullName')?.value.trim();
      const email = document.getElementById('regEmail')?.value.trim();
      const password = document.getElementById('regPassword')?.value;

      showMessage('Đang tạo tài khoản...');

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserToFirestore(userCredential.user, { fullName });

        showMessage('Tạo tài khoản thành công! Đang chuyển hướng...');
        setTimeout(() => {
          window.location.href = '../index.html';
        }, 1200);

      } catch (error) {
        console.error('Lỗi đăng ký chi tiết:', error);
        
        let errorText = `Đăng ký thất bại [${error.code}]: ${error.message}`;
        if (error.code === 'auth/email-already-in-use') errorText = 'Email này đã được sử dụng!';
        if (error.code === 'auth/weak-password') errorText = 'Mật khẩu phải từ 6 ký tự trở lên!';
        if (error.code === 'auth/operation-not-allowed') errorText = 'Chưa bật Email/Password trên Firebase Console!';
        
        showMessage(errorText, true);
      }
    });
  }
});