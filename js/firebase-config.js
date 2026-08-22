// Import Firebase SDK (Modular ESM qua CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Thông tin cấu hình từ Project Settings trên Firebase Console của bạn
const firebaseConfig = {
  apiKey: "AIzaSyDPsDoUeMsm5Es3vMWAxw7PLQ4yrfkJ8pQ",
  authDomain: "quan-ly-to-dan.firebaseapp.com",
  projectId: "quan-ly-to-dan",
  storageBucket: "quan-ly-to-dan.firebasestorage.app",
  messagingSenderId: "396470269098",
  appId: "1:396470269098:web:b70dbe8a9337157bc3ccd3",
  measurementId: "G-RYHRJDES7C"
};

// Khởi tạo Firebase App
const app = initializeApp(firebaseConfig);

// Khởi tạo và export các service dùng chung cho toàn bộ web
export const auth = getAuth(app);
export const db = getFirestore(app);