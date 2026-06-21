document.addEventListener("DOMContentLoaded", function () {
    let data = [];
    const totalCount = document.getElementById("totalCount");
    const tableBody = document.getElementById("memberTable");
    const searchInput = document.getElementById("searchInput");
    const roleFilter = document.getElementById("roleFilter");
    const genderFilter = document.getElementById("genderFilter");
    const yearFilter = document.getElementById("yearFilter");

    // Tạo Modal ảnh
    const imageModal = document.createElement("div");
    imageModal.id = "imageModal";
    const closeBtn = document.createElement("span");
    closeBtn.id = "closeBtn";
    closeBtn.textContent = "×";
    imageModal.appendChild(closeBtn);
    const modalImg = document.createElement("img");
    imageModal.appendChild(modalImg);
    document.body.appendChild(imageModal);

    modalImg.onerror = function () { this.src = "default.jpg"; };
    closeBtn.addEventListener("click", function () { imageModal.style.display = "none"; });

    async function loadCSV() {
        try {
            const response = await fetch('data.csv');
            const csvData = await response.text();
            if (!csvData) return;

            data = csvData.split(/\r?\n/)
                .filter(line => line.trim() !== "")
                .map(line => {
                    const cells = line.split(',').map(cell => cell.trim());
                    // Cấu trúc: [Tên, Mã, NgàySinh, GiớiTính, Quyền, LinkẢnh]
                    if (cells.length < 6 || cells[5] === "") {
                        cells[5] = "default.jpg";
                    }
                    return cells;
                });

            populateDynamicFilters(data); 
            renderTable(data);
        } catch (error) {
            console.error("Lỗi tải CSV:", error);
        }
    }

    // Tự động lấy danh sách Quyền và Năm sinh có trong dữ liệu (Hỗ trợ cả dấu - và /)
    function populateDynamicFilters(memberData) {
        const roles = new Set();
        const years = new Set();

        memberData.forEach(row => {
            const dob = row[2];
            const role = row[4];
            if (role) roles.add(role);
            
            if (dob) {
                // Tách chuỗi theo dấu gạch ngang (-) hoặc gạch chéo (/)
                const parts = dob.split(/[-/]/);
                const year = parts[parts.length - 1];
                if (year && year.trim().length === 4) { // Đảm bảo lấy đúng năm 4 chữ số
                    years.add(year.trim());
                }
            }
        });

        // Đổ dữ liệu vào ô chọn Quyền
        Array.from(roles).sort().forEach(role => {
            const option = document.createElement("option");
            option.value = role;
            option.textContent = role;
            roleFilter.appendChild(option);
        });

        // Đổ dữ liệu vào ô chọn Năm sinh (giảm dần)
        Array.from(years).sort((a, b) => b - a).forEach(year => {
            const option = document.createElement("option");
            option.value = year;
            option.textContent = year;
            yearFilter.appendChild(option);
        });
    }

    function normalize(str) {
        if (!str) return "";
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").replace(/\s+/g, " ").trim().toLowerCase();
    }

    function renderTable(filteredData) {
        tableBody.innerHTML = "";
        filteredData.forEach(row => {
            const tr = document.createElement("tr");
            const [name, code, dob, gender, role, img] = row;
            const normRole = normalize(role);
            
            let bgColor = "#cccccc";
            let textColor = "#000000";

            // Logic màu sắc theo cấp bậc
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

            const cells = [name, code, dob, gender, role];
            cells.forEach((text, index) => {
                const td = document.createElement("td");
                td.style.backgroundColor = bgColor;
                td.style.color = textColor;

                if (index === 0) { // Cột Họ và Tên: Click xem ảnh
                    td.textContent = text;
                    td.style.cursor = "pointer";
                    td.onclick = () => { modalImg.src = img; imageModal.style.display = "flex"; };
                } else if (index === 1) { // Cột Mã Hội Viên: Thêm nút copy nhanh
                    const codeSpan = document.createElement("span");
                    codeSpan.textContent = text;
                    td.appendChild(codeSpan);

                    const copyBtn = document.createElement("button");
                    copyBtn.textContent = "📋";
                    copyBtn.title = "Sao chép mã";
                    copyBtn.style.marginLeft = "10px";
                    copyBtn.style.cursor = "pointer";
                    copyBtn.style.border = "none";
                    copyBtn.style.background = "transparent";
                    copyBtn.style.fontSize = "16px";
                    copyBtn.style.verticalAlign = "middle";

                    copyBtn.onclick = function () {
                        navigator.clipboard.writeText(text).then(() => {
                            copyBtn.textContent = "✅";
                            setTimeout(() => { copyBtn.textContent = "📋"; }, 1200);
                        }).catch(err => {
                            console.error("Lỗi copy:", err);
                        });
                    };
                    td.appendChild(copyBtn);
                } else {
                    td.textContent = text;
                }
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
        totalCount.textContent = `Hiện có: ${filteredData.length} học viên`;
    }

    function filterAndRender() {
        const keyword = normalize(searchInput.value);
        const selectedRole = normalize(roleFilter.value);
        const selectedGender = normalize(genderFilter.value);
        const selectedYear = yearFilter.value;

        const filtered = data.filter(row => {
            const [name, code, dob, gender, role] = row;
            // Tách chuỗi hỗ trợ cả dấu - và /
            const parts = dob ? dob.split(/[-/]/) : [];
            const yearOfBirth = parts.length > 0 ? parts[parts.length - 1].trim() : "";

            const matchKeyword = normalize(name).includes(keyword) || normalize(code).includes(keyword);
            const matchRole = selectedRole === "" || normalize(role) === selectedRole;
            const matchGender = selectedGender === "" || normalize(gender) === selectedGender;
            const matchYear = selectedYear === "" || yearOfBirth === selectedYear;

            return matchKeyword && matchRole && matchGender && matchYear;
        });
        renderTable(filtered);
    }

    [searchInput, roleFilter, genderFilter, yearFilter].forEach(el => {
        el.addEventListener(el.tagName === "INPUT" ? "input" : "change", filterAndRender);
    });

    loadCSV();
});