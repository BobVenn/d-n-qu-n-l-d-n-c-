// Import Firebase SDK (Modular ESM qua CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Cấu hình Firebase project của bạn
const firebaseConfig = {
  apiKey: "AIzaSyC4iyGuVM18VfjC51hmyc_Ravyqf3W0H6I",
  authDomain: "quanlytodanpho.firebaseapp.com",
  projectId: "quanlytodanpho",
  storageBucket: "quanlytodanpho.firebasestorage.app",
  messagingSenderId: "927286882414",
  appId: "1:927286882414:web:8a8f57587e10e3a7da767f",
  measurementId: "G-ZEBMDJQ8Y8"
};

// Khởi tạo Firebase App
const app = initializeApp(firebaseConfig);

// Khởi tạo và export các service dùng chung
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();