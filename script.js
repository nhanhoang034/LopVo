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
            let response = await fetch('data.csv');
            let csvData = await response.text();

            if (!csvData) {
                console.error("File CSV rỗng!");
                return;
            }

            data = csvData
                .split(/\r?\n/)
                .filter(line => line.trim() !== "") 
                .map(line => {
                    let cells = line.split(',').map(cell => cell.trim());
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

    // Hàm chuẩn hóa chuỗi (bỏ dấu, bỏ space thừa, lowercase)
    function normalize(str) {
        return str
            .normalize("NFD")                 // tách dấu
            .replace(/[\u0300-\u036f]/g, "")  // bỏ dấu
            .replace(/\s+/g, " ")             // gộp nhiều space thành 1
            .trim()
            .toLowerCase();
    }

    function renderTable(filteredData) {
        tableBody.innerHTML = "";

        filteredData.forEach(row => {
            const tr = document.createElement("tr");

            const role = row[2]; // lấy trực tiếp từ CSV
            const normRole = normalize(role);

            let bgColor = "#cccccc";  
            let textColor = "#000000";

            switch (normRole) {
                case "cap 8": bgColor = "#FFFFFF"; break; 
                case "cap 7": bgColor = "#ffff66"; break; 
                case "cap 6": bgColor = "#66cc66"; break; 
                case "cap 5": bgColor = "#3399ff"; break; 
                case "cap 4": bgColor = "#ff9900"; break; 
                case "cap 3": bgColor = "#ff3333"; break; 
                case "cap 2": bgColor = "#cc0000"; break; 
                case "cap 1": bgColor = "#996633"; break; 
                case "1 dang": bgColor = "#b087d8ff"; break; 
                case "2 dang": bgColor = "#62358fff"; break; 
                case "3 dang": bgColor = "#402060"; break; 
                case "gv": bgColor = "#000000"; textColor = "#EEEEEE"; break; 
                default: bgColor = "#cccccc"; break;
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
            const matchRole = selectedRole === "" 
                || normalize(row[2]) === selectedRole;
            return matchKeyword && matchRole;
        });

        renderTable(filtered);
    }

    searchInput.addEventListener("input", filterAndRender);
    roleFilter.addEventListener("change", filterAndRender);

    loadCSV();
});
