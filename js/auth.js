import { auth, db } from "./firebase-config.js";
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const form = document.getElementById("loginForm");
const msg = document.getElementById("authMessage");
const btnGoogle = document.getElementById("btnGoogleLogin");

// 1. Đăng nhập bằng Email & Mật khẩu
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    msg.className = "auth-message";
    msg.innerText = "Đang xác thực...";

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      msg.className = "auth-message success";
      msg.innerText = "Đăng nhập thành công! Đang chuyển hướng...";
      setTimeout(() => {
        window.location.href = "./index.html";
      }, 1000);
    } catch (error) {
      msg.className = "auth-message error";
      msg.innerText = "Lỗi: " + error.message;
    }
  });
}

// 2. Đăng nhập nhanh bằng Google
if (btnGoogle) {
  btnGoogle.addEventListener("click", async () => {
    msg.className = "auth-message";
    msg.innerText = "Đang mở cửa sổ đăng nhập Google...";

    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Tự động lưu/kiểm tra thông tin user trong Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          role: "cu_dan", // Quyền mặc định
          createdAt: new Date().toISOString()
        });
      }

      msg.className = "auth-message success";
      msg.innerText = "Đăng nhập Google thành công!";
      setTimeout(() => {
        window.location.href = "./index.html";
      }, 1000);
    } catch (error) {
      msg.className = "auth-message error";
      msg.innerText = "Lỗi đăng nhập Google: " + error.message;
    }
  });
}