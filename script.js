document.addEventListener("DOMContentLoaded", function () {
    let data = [];
    const totalCount = document.getElementById("totalCount");
    const tableBody = document.getElementById("memberTable");
    const searchInput = document.getElementById("searchInput");
    const roleFilter = document.getElementById("roleFilter");

    // Modal ảnh
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
                    if (cells.length < 4 || cells[3] === "") {
                        cells[3] = "default.jpg";
                    }
                    return cells;
                });

            renderTable(data);
        } catch (error) {
            console.error("Lỗi khi tải file CSV:", error);
        }
    }

    // Chuẩn hóa chuỗi: bỏ dấu, đổi đ/Đ -> d, gộp space, lowercase
    function normalize(str) {
        if (!str) return "";
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // bỏ dấu kết hợp
            .replace(/[đĐ]/g, "d")          // Đ/đ -> d (rất quan trọng cho "Đẳng")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }

    function renderTable(filteredData) {
        tableBody.innerHTML = "";

        filteredData.forEach(row => {
            const tr = document.createElement("tr");

            const role = row[2];                 // lấy đúng như CSV
            const normRole = normalize(role);    // bản chuẩn hóa để quyết định màu

            let bgColor = "#cccccc";
            let textColor = "#000000";

            switch (normRole) {
                case "cap 10": bgColor = "#eeeeee"; break; // tùy chọn
                case "cap 9":  bgColor = "#ffff66"; break; // tùy chọn
                case "cap 8":  bgColor = "#ff9d0aff";  break;
                case "cap 7":  bgColor = "#66cc66";  break;
                case "cap 6":  bgColor = "#3399ff";  break;
                case "cap 5":  bgColor = "#0400ffff";  break;
                case "cap 4":  bgColor = "#c800ffff";  break;
                case "cap 3":  bgColor = "#ff3333";  break;
                case "cap 2":  bgColor = "#d22626ff";  break;
                case "cap 1":  bgColor = "#ce0e0eff";  break;

                // "1 Đẳng" -> normalize thành "1 dang"
                case "1 dang": bgColor = "#b087d8ff"; break;
                case "2 dang": bgColor = "#62358fff"; break;
                case "3 dang": bgColor = "#402060";   break;

                case "gv":     bgColor = "#000000"; textColor = "#EEEEEE"; break;
                default:       bgColor = "#cccccc"; break;
            }

            // Họ và Tên
            const nameCell = document.createElement("td");
            nameCell.textContent = row[0];
            nameCell.style.backgroundColor = bgColor;
            nameCell.style.color = textColor;
            nameCell.style.cursor = "pointer";
            nameCell.addEventListener("click", function () {
                modalImg.src = row[3] && row[3].trim() !== "" ? row[3] : "default.jpg";
                imageModal.style.display = "flex";
            });
            tr.appendChild(nameCell);

            // Mã Hội Viên
            const memberCodeCell = document.createElement("td");
            memberCodeCell.textContent = row[1];
            memberCodeCell.style.backgroundColor = bgColor;
            memberCodeCell.style.color = textColor;
            tr.appendChild(memberCodeCell);

            // Quyền (hiển thị y như CSV)
            const roleCell = document.createElement("td");
            roleCell.textContent = role;
            roleCell.style.backgroundColor = bgColor;
            roleCell.style.color = textColor;
            tr.appendChild(roleCell);

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

        const filtered = data.filter(row => {
            const matchKeyword = row.some(cell => normalize(cell).includes(keyword));
            const matchRole = selectedRole === "" || normalize(row[2]) === selectedRole;
            return matchKeyword && matchRole;
        });

        renderTable(filtered);
    }

    searchInput.addEventListener("input", filterAndRender);
    roleFilter.addEventListener("change", filterAndRender);

    loadCSV();
});
