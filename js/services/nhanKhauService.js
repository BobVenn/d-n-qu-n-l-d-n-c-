// Dữ liệu mẫu nhân khẩu
let nhanKhauList = [
    { docId: "1", maHoKhau: "HK001", hoTen: "Nguyễn Văn B", cccd: "031202001234", ngaySinh: "2002-05-15", gioiTinh: "Nam", quanHeVoiChuHo: "Con trai" },
    { docId: "2", maHoKhau: "HK001", hoTen: "Trần Thị C", cccd: "031202005678", ngaySinh: "1980-08-20", gioiTinh: "Nữ", quanHeVoiChuHo: "Vợ" },
    { docId: "3", maHoKhau: "HK002", hoTen: "Lê Văn D", cccd: "031202009999", ngaySinh: "1975-01-10", gioiTinh: "Nam", quanHeVoiChuHo: "Chủ hộ" },
    { docId: "4", maHoKhau: "HK003", hoTen: "Pham Thị E", cccd: "031202008888", ngaySinh: "1995-11-03", gioiTinh: "Nữ", quanHeVoiChuHo: "Chủ hộ" }
];

const tableBody = document.getElementById('nhanKhauTableBody');
const formNhanKhau = document.getElementById('formNhanKhau');
const searchInput = document.getElementById('searchInput');
const hoKhauFilter = document.getElementById('hoKhauFilter');
const genderFilter = document.getElementById('genderFilter');
const btnResetFilter = document.getElementById('btnResetFilter');

document.addEventListener('DOMContentLoaded', () => {
    loadHoKhauOptions();
    renderTable(nhanKhauList);
    setupEventListeners();
});

// Load danh sách Mã Hộ Khẩu duy nhất vào ô Filter Lọc
function loadHoKhauOptions() {
    const uniqueHoKhau = [...new Set(nhanKhauList.map(item => item.maHoKhau))];
    hoKhauFilter.innerHTML = '<option value="">-- Tất cả Hộ khẩu --</option>';
    uniqueHoKhau.forEach(maHo => {
        const option = document.createElement('option');
        option.value = maHo;
        option.textContent = `Hộ khẩu: ${maHo}`;
        hoKhauFilter.appendChild(option);
    });
}

// Render Bảng Nhân Khẩu
function renderTable(data) {
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">Không tìm thấy nhân khẩu phù hợp!</td></tr>`;
        return;
    }

    data.forEach((item) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="badge bg-secondary">${item.maHoKhau}</span></td>
            <td class="fw-bold">${item.hoTen}</td>
            <td>${item.cccd}</td>
            <td>${item.ngaySinh}</td>
            <td>
                <span class="badge ${item.gioiTinh === 'Nam' ? 'bg-primary' : 'bg-danger'}">${item.gioiTinh}</span>
            </td>
            <td>${item.quanHeVoiChuHo}</td>
            <td>
                <button class="btn btn-sm btn-outline-warning me-1" onclick="editNhanKhau('${item.docId}')"><i class="fa-solid fa-pen-to-square"></i> Sửa</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteNhanKhau('${item.docId}')"><i class="fa-solid fa-trash"></i> Xóa</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Xử lý Lọc & Tìm kiếm đa điều kiện (Từ khóa + Hộ khẩu + Giới tính)
function filterData() {
    const keyword = searchInput.value.toLowerCase().trim();
    const selectedHoKhau = hoKhauFilter.value;
    const selectedGender = genderFilter.value;

    const filtered = nhanKhauList.filter(item => {
        const matchKeyword = item.hoTen.toLowerCase().includes(keyword) || 
                             item.cccd.includes(keyword) || 
                             item.maHoKhau.toLowerCase().includes(keyword);
        const matchHoKhau = selectedHoKhau === '' || item.maHoKhau === selectedHoKhau;
        const matchGender = selectedGender === '' || item.gioiTinh === selectedGender;
        
        return matchKeyword && matchHoKhau && matchGender;
    });

    renderTable(filtered);
}

// CRUD: Thêm / Cập nhật Nhân khẩu
formNhanKhau.addEventListener('submit', (e) => {
    e.preventDefault();

    const docId = document.getElementById('docId').value;
    const maHoKhau = document.getElementById('maHoKhau').value.trim();
    const hoTen = document.getElementById('hoTen').value.trim();
    const cccd = document.getElementById('cccd').value.trim();
    const ngaySinh = document.getElementById('ngaySinh').value;
    const gioiTinh = document.getElementById('gioiTinh').value;
    const quanHeVoiChuHo = document.getElementById('quanHeVoiChuHo').value.trim();

    if (docId) {
        const index = nhanKhauList.findIndex(item => item.docId === docId);
        if (index !== -1) {
            nhanKhauList[index] = { docId, maHoKhau, hoTen, cccd, ngaySinh, gioiTinh, quanHeVoiChuHo };
        }
    } else {
        const newItem = {
            docId: Date.now().toString(),
            maHoKhau, hoTen, cccd, ngaySinh, gioiTinh, quanHeVoiChuHo
        };
        nhanKhauList.push(newItem);
    }

    loadHoKhauOptions();

    const modalElement = document.getElementById('modalNhanKhau');
    const modal = bootstrap.Modal.getInstance(modalElement);
    modal.hide();

    filterData();
});

// Gắn dữ liệu khi bấm Sửa
window.editNhanKhau = function(docId) {
    const item = nhanKhauList.find(nk => nk.docId === docId);
    if (!item) return;

    document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-user-pen me-2"></i>Sửa Thông Tin Nhân Khẩu';
    document.getElementById('docId').value = item.docId;
    document.getElementById('maHoKhau').value = item.maHoKhau;
    document.getElementById('hoTen').value = item.hoTen;
    document.getElementById('cccd').value = item.cccd;
    document.getElementById('ngaySinh').value = item.ngaySinh;
    document.getElementById('gioiTinh').value = item.gioiTinh;
    document.getElementById('quanHeVoiChuHo').value = item.quanHeVoiChuHo;

    const modal = new bootstrap.Modal(document.getElementById('modalNhanKhau'));
    modal.show();
};

// Xóa Nhân khẩu
window.deleteNhanKhau = function(docId) {
    if (confirm('Bạn có chắc chắn muốn xóa nhân khẩu này?')) {
        nhanKhauList = nhanKhauList.filter(item => item.docId !== docId);
        loadHoKhauOptions();
        filterData();
    }
};

// Reset Form khi bấm Thêm mới
window.resetForm = function() {
    document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-user-plus me-2"></i>Thêm Nhân Khẩu Mới';
    document.getElementById('docId').value = '';
    formNhanKhau.reset();
};

function setupEventListeners() {
    searchInput.addEventListener('input', filterData);
    hoKhauFilter.addEventListener('change', filterData);
    genderFilter.addEventListener('change', filterData);
    
    btnResetFilter.addEventListener('click', () => {
        searchInput.value = '';
        hoKhauFilter.value = '';
        genderFilter.value = '';
        renderTable(nhanKhauList);
    });
}