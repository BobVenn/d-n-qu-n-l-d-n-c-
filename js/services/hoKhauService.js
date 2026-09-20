// js/services/hoKhauService.js
import { db } from "../firebase-config.js";
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Tham chiếu đến collection 'households' trong Firestore
const hoKhauRef = collection(db, "households");

/**
 * 1. Lấy toàn bộ danh sách Hộ khẩu
 */
export const getAllHoKhau = async () => {
  try {
    const snapshot = await getDocs(hoKhauRef);
    const list = [];
    snapshot.forEach((docSnap) => {
      list.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    return list;
  } catch (error) {
    console.error("Lỗi lấy danh sách hộ khẩu:", error);
    throw error;
  }
};

/**
 * 2. Thêm Hộ khẩu mới
 */
export const addHoKhau = async (data) => {
  try {
    const docRef = await addDoc(hoKhauRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Lỗi thêm hộ khẩu:", error);
    throw error;
  }
};

/**
 * 3. Cập nhật Hộ khẩu theo ID
 */
export const updateHoKhau = async (id, data) => {
  try {
    const docToUpdate = doc(db, "households", id);
    await updateDoc(docToUpdate, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Lỗi cập nhật hộ khẩu:", error);
    throw error;
  }
};

/**
 * 4. Xóa Hộ khẩu theo ID
 */
export const deleteHoKhau = async (id) => {
  try {
    const docToDelete = doc(db, "households", id);
    await deleteDoc(docToDelete);
  } catch (error) {
    console.error("Lỗi xóa hộ khẩu:", error);
    throw error;
  }
};