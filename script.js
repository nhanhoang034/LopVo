document.addEventListener("DOMContentLoaded", function () {
    let data = [];
    const totalCount = document.getElementById("totalCount");
    const tableBody = document.getElementById("memberTable");
    const searchInput = document.getElementById("searchInput");
    const roleFilter = document.getElementById("roleFilter");

    // Map hiển thị quyền đầy đủ
    const roleMap = {
        "Cấp 10": "Cấp 10",
        "Cấp 9": "Cấp 9",
        "Cấp 8": "Quyền 1 - Cấp 8",
        "Cấp 7": "Quyền 2 - Cấp 7",
        "Cấp 6": "Quyền 3 - Cấp 6",
        "Cấp 5": "Quyền 4 - Cấp 5",
        "Cấp 4": "Quyền 5 - Cấp 4",
        "Cấp 3": "Quyền 6 - Cấp 3",
        "Cấp 2": "Quyền 7 - Cấp 2",
        "Cấp 1": "Quyền 8 - Cấp 1",
        "1 Đẳng": "Quyền 9 - 1 Đẳng",
        "2 Đẳng": "Quyền 10 - 2 Đẳng",
        "3 Đẳng": "Quyền 11 - 3 Đẳng",
        "GV": "GV"
    };

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

    function renderTable(filteredData) {
        tableBody.innerHTML = "";

        filteredData.forEach(row => {
            const tr = document.createElement("tr");

            const originalRole = row[2];
            const displayRole = roleMap[originalRole] || originalRole;

            let bgColor = "#cccccc";  
            let textColor = "#000000";

            switch (displayRole) {
                case "Quyền 1 - Cấp 8": bgColor = "#FFFFFF"; break; 
                case "Quyền 2 - Cấp 7": bgColor = "#ffff66"; break; 
                case "Quyền 3 - Cấp 6": bgColor = "#66cc66"; break; 
                case "Quyền 4 - Cấp 5": bgColor = "#3399ff"; break; 
                case "Quyền 5 - Cấp 4": bgColor = "#ff9900"; break; 
                case "Quyền 6 - Cấp 3": bgColor = "#ff3333"; break; 
                case "Quyền 7 - Cấp 2": bgColor = "#cc0000"; break; 
                case "Quyền 8 - Cấp 1": bgColor = "#996633"; break; 
                case "1 Đẳng":          bgColor = "#b087d8ff"; break; 
                case "2 Đẳng":          bgColor = "#62358fff"; break; 
                case "GV":              bgColor = "#000000"; textColor = "#EEEEEE"; break; 
                default:                bgColor = "#cccccc"; break;
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

            // Quyền
            const roleCell = document.createElement("td");
            roleCell.textContent = displayRole; 
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
        const keyword = searchInput.value.toLowerCase().trim();
        const selectedRole = roleFilter.value;

        const filtered = data.filter(row => {
            const matchKeyword = row.some(cell => cell.toLowerCase().includes(keyword));
            const matchRole = selectedRole === "" || row[2] === selectedRole;
            return matchKeyword && matchRole;
        });

        renderTable(filtered);
    }

    searchInput.addEventListener("input", filterAndRender);
    roleFilter.addEventListener("change", filterAndRender);

    loadCSV();
});
