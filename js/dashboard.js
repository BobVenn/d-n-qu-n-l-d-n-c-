import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, collection, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 1. Kiểm tra trạng thái đăng nhập
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Nếu chưa đăng nhập -> chuyển hướng ngay về trang login
    window.location.href = "./login.html";
    return;
  }

  // Đã đăng nhập -> hiển thị tên & quyền hạn
  const nameEl = document.getElementById("userDisplayName");
  const roleBadge = document.getElementById("userRoleBadge");
  nameEl.innerText = user.displayName || user.email;

  // Lấy quyền từ Firestore
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists() && userDoc.data().role === "admin") {
      roleBadge.innerText = "Tổ trưởng";
      roleBadge.style.background = "#fee2e2";
      roleBadge.style.color = "#b91c1c";
    }
  } catch (err) {
    console.error("Lỗi lấy thông tin user:", err);
  }

  // 2. Tải số liệu thống kê cơ bản
  loadDashboardCounts();
});

// Hàm thống kê tổng số lượng từ Firestore
async function loadDashboardCounts() {
  try {
    // Đếm số hộ khẩu
    const houseSnap = await getCountFromServer(collection(db, "households"));
    document.getElementById("countHouseholds").innerText = houseSnap.data().count;

    // Đếm số nhân khẩu
    const residentSnap = await getCountFromServer(collection(db, "residents"));
    document.getElementById("countResidents").innerText = residentSnap.data().count;
  } catch (error) {
    console.log("Chưa có collections dữ liệu:", error.message);
  }
}

// 3. Xử lý Đăng xuất
document.getElementById("btnLogout").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "./login.html";
});