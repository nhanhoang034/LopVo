document.addEventListener("DOMContentLoaded", function () {
    let data = [];
    const totalCount = document.getElementById("totalCount");
    const tableBody = document.getElementById("memberTable");
    const searchInput = document.getElementById("searchInput");
    const roleFilter = document.getElementById("roleFilter");

    // Modal để hiển thị ảnh lớn
    const imageModal = document.createElement("div");
    imageModal.id = "imageModal";

    const closeBtn = document.createElement("span");
    closeBtn.id = "closeBtn";
    closeBtn.textContent = "×"; // Dấu X để đóng
    imageModal.appendChild(closeBtn);

    const modalImg = document.createElement("img");
    imageModal.appendChild(modalImg);
    document.body.appendChild(imageModal);

    // Nếu ảnh bị lỗi, gán ảnh mặc định
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
                console.error("⚠️ File CSV rỗng!");
                return;
            }

            data = csvData
                .split(/\r?\n/)
                .filter(line => line.trim() !== "") // Bỏ dòng trống
                .map(line => {
                    let cells = line.split(',').map(cell => cell.trim());
                    if (cells.length < 4 || cells[3] === "") {
                        cells[3] = "default.jpg"; // Gán ảnh mặc định nếu không có
                    }
                    return cells;
                });

            renderTable(data);
        } catch (error) {
            console.error("🚨 Lỗi khi tải file CSV:", error);
        }
    }

    function renderTable(filteredData) {
        tableBody.innerHTML = "";

        filteredData.forEach(row => {
            const tr = document.createElement("tr");

            const role = row[2];
            let bgColor = "#cccccc";  // mặc định: xám
            let textColor = "#000000";

            switch (role) {
                case "2":
                    bgColor = "#ffff66"; textColor = "#000000"; break; // vàng
                case "3":
                    bgColor = "#66cc66"; textColor = "#ffffff"; break; // xanh lá
                case "4":
                    bgColor = "#3399ff"; textColor = "#ffffff"; break; // xanh dương
                case "5":
                    bgColor = "#ff9900"; textColor = "#000000"; break; // cam
                case "6":
                    bgColor = "#ff3333"; textColor = "#ffffff"; break; // đỏ
                case "7":
                    bgColor = "#cc0000"; textColor = "#ffffff"; break; // đỏ đậm
                case "8":
                    bgColor = "#996633"; textColor = "#ffffff"; break; // nâu
                case "9":
                    bgColor = "#9966cc"; textColor = "#ffffff"; break; // tím
                case "GV":
                    bgColor = "#663399"; textColor = "#ffffff"; break; // tím đậm
                default:
                    bgColor = "#cccccc"; textColor = "#000000"; break;
            }

            // Cột Họ và Tên
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

            // Cột Mã Hội Viên
            const memberCodeCell = document.createElement("td");
            memberCodeCell.textContent = row[1];
            memberCodeCell.style.backgroundColor = bgColor;
            memberCodeCell.style.color = textColor;
            tr.appendChild(memberCodeCell);

            // Cột Quyền
            const roleCell = document.createElement("td");
            roleCell.textContent = row[2];
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
