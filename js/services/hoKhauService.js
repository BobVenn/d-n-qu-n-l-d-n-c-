import { db } from "../firebase-config.js";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const hoKhauRef = collection(db, "hoKhau");

// 1. Lấy danh sách hộ khẩu
export async function getAllHoKhau() {
  const q = query(hoKhauRef, orderBy("maHoKhau", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 2. Thêm hộ khẩu mới
export async function addHoKhau(data) {
  return await addDoc(hoKhauRef, {
    ...data,
    createdAt: serverTimestamp()
  });
}

// 3. Cập nhật hộ khẩu
export async function updateHoKhau(id, data) {
  const docRef = doc(db, "hoKhau", id);
  return await updateDoc(docRef, data);
}

// 4. Xóa hộ khẩu
export async function deleteHoKhau(id) {
  const docRef = doc(db, "hoKhau", id);
  return await deleteDoc(docRef);
}