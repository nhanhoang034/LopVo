document.addEventListener("DOMContentLoaded", function () {
    let data = [];
    const totalCount = document.getElementById("totalCount");
    const tableBody = document.getElementById("memberTable");
    const searchInput = document.getElementById("searchInput");
    const roleFilter = document.getElementById("roleFilter");
    const genderFilter = document.getElementById("genderFilter");
    const yearFilter = document.getElementById("yearFilter");

    // Tạo Modal ảnh (Giữ nguyên tính năng cũ)
    const imageModal = document.createElement("div");
    imageModal.id = "imageModal";
    const closeBtn = document.createElement("span");
    closeBtn.id = "closeBtn";
    closeBtn.textContent = "×";
    imageModal.appendChild(closeBtn);
    const modalImg = document.createElement("img");
    imageModal.appendChild(modalImg);
    document.body.appendChild(imageModal);

    modalImg.onerror = function () {
        this.src = "default.jpg";
    };

    closeBtn.addEventListener("click", function () {
        imageModal.style.display = "none";
    });

    // Tải CSV
    async function loadCSV() {
        try {
            const response = await fetch('data.csv');
            const csvData = await response.text();

            if (!csvData) {
                console.error("File CSV rỗng!");
                return;
            }

            data = csvData
                .split(/\r?\n/)
                .filter(line => line.trim() !== "")
                .map(line => {
                    const cells = line.split(',').map(cell => cell.trim());
                    // Cấu trúc mong đợi: [Tên, Mã, NgàySinh, GiớiTính, Quyền, LinkẢnh]
                    // Link ảnh ở index 5
                    if (cells.length < 6 || cells[5] === "") {
                        cells[5] = "default.jpg";
                    }
                    return cells;
                });

            renderTable(data);
        } catch (error) {
            console.error("Lỗi khi tải file CSV:", error);
        }
    }

    function normalize(str) {
        if (!str) return "";
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[đĐ]/g, "d")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }

    function renderTable(filteredData) {
        tableBody.innerHTML = "";

        filteredData.forEach(row => {
            const tr = document.createElement("tr");

            // Mapping dữ liệu từ row
            const name = row[0];
            const memberCode = row[1];
            const dob = row[2];
            const gender = row[3];
            const role = row[4];
            const imageLink = row[5];

            const normRole = normalize(role);
            let bgColor = "#cccccc";
            let textColor = "#000000";

            // Logic đổ màu cấp bậc (Giữ nguyên)
            switch (normRole) {
                case "cap 10": bgColor = "#eeeeee"; break;
                case "cap 9":  bgColor = "#FFFF00"; break;
                case "cap 8":  bgColor = "#ff9d0aff";break;
                case "cap 7":  bgColor = "#66cc66";  break;
                case "cap 6":  bgColor = "#3399ff";  break;
                case "cap 5":  bgColor = "#c800ffff";break;
                case "cap 4":  bgColor = "#FF0000";  break;
                case "cap 3":  bgColor = "#DD0000";  break;
                case "cap 2":  bgColor = "#AA0000";  break;
                case "cap 1":  bgColor = "#550000";  break;
                case "1 dang": bgColor = "#b087d8ff"; break;
                case "2 dang": bgColor = "#62358fff"; break;
                case "3 dang": bgColor = "#402060";   break;
                case "gv":     bgColor = "#000000"; textColor = "#EEEEEE"; break;
                default:       bgColor = "#cccccc"; break;
            }

            // Tạo các ô dữ liệu
            const createCell = (content, isName = false) => {
                const td = document.createElement("td");
                td.textContent = content;
                td.style.backgroundColor = bgColor;
                td.style.color = textColor;
                if (isName) {
                    td.style.cursor = "pointer";
                    td.addEventListener("click", function () {
                        modalImg.src = imageLink;
                        imageModal.style.display = "flex";
                    });
                }
                return td;
            };

            tr.appendChild(createCell(name, true));     // Cột Tên (Click xem ảnh)
            tr.appendChild(createCell(memberCode));    // Cột Mã
            tr.appendChild(createCell(dob));           // Cột Ngày Sinh
            tr.appendChild(createCell(gender));        // Cột Giới Tính
            tr.appendChild(createCell(role));          // Cột Quyền

            tableBody.appendChild(tr);
        });

        updateTotalCount(filteredData.length);
    }

    function updateTotalCount(count) {
        if (totalCount) {
            totalCount.textContent = `Hiện có: ${count} học viên`;
        }
    }

    function filterAndRender() {
        const keyword = normalize(searchInput.value);
        const selectedRole = normalize(roleFilter.value);
        const selectedGender = normalize(genderFilter.value);
        const selectedYear = yearFilter.value;

        const filtered = data.filter(row => {
            // Chuẩn hóa dữ liệu trong hàng để lọc
            const normName = normalize(row[0]);
            const normCode = normalize(row[1]);
            const dobStr = row[2]; // dd-mm-yyyy
            const normGender = normalize(row[3]);
            const normRowRole = normalize(row[4]);

            // Lấy năm sinh từ chuỗi dd-mm-yyyy
            const yearOfBirth = dobStr.includes('-') ? dobStr.split('-')[2] : "";

            const matchKeyword = normName.includes(keyword) || normCode.includes(keyword);
            const matchRole = selectedRole === "" || normRowRole === selectedRole;
            const matchGender = selectedGender === "" || normGender === selectedGender;
            const matchYear = selectedYear === "" || yearOfBirth === selectedYear;

            return matchKeyword && matchRole && matchGender && matchYear;
        });

        renderTable(filtered);
    }

    // Sự kiện lắng nghe
    searchInput.addEventListener("input", filterAndRender);
    roleFilter.addEventListener("change", filterAndRender);
    genderFilter.addEventListener("change", filterAndRender);
    yearFilter.addEventListener("input", filterAndRender);

    loadCSV();
});