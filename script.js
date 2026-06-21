document.addEventListener("DOMContentLoaded", function () {
    let data = [];
    const totalCount = document.getElementById("totalCount");
    const tableBody = document.getElementById("memberTable");
    const searchInput = document.getElementById("searchInput");
    const roleFilter = document.getElementById("roleFilter");
    const genderFilter = document.getElementById("genderFilter");
    const yearFilter = document.getElementById("yearFilter");

    // Đã loại bỏ Modal ảnh theo yêu cầu

    async function loadCSV() {
        try {
            const response = await fetch('data.csv');
            const csvData = await response.text();
            if (!csvData) return;

            data = csvData.split(/\r?\n/)
                .filter(line => line.trim() !== "")
                .map(line => {
                    return line.split(',').map(cell => cell.trim());
                    // Cấu trúc: [Tên, Mã, NgàySinh, GiớiTính, Cấp bậc cũ]
                });

            populateDynamicFilters(data); 
            renderTable(data);
        } catch (error) {
            console.error("Lỗi tải CSV:", error);
        }
    }

    // Tự động lấy danh sách Cấp và Năm sinh có trong dữ liệu
    function populateDynamicFilters(memberData) {
        const roles = new Set();
        const years = new Set();

        memberData.forEach(row => {
            const dob = row[2];
            const role = row[4];
            if (role) roles.add(role);
            
            if (dob) {
                const parts = dob.split(/[-/]/);
                const year = parts[parts.length - 1];
                if (year && year.trim().length === 4) {
                    years.add(year.trim());
                }
            }
        });

        // Đổ dữ liệu vào ô chọn Cấp
        roleFilter.innerHTML = '<option value="">Tất cả cấp</option>';
        Array.from(roles).sort().forEach(role => {
            const option = document.createElement("option");
            option.value = role;
            option.textContent = role;
            roleFilter.appendChild(option);
        });

        // Đổ dữ liệu vào ô chọn Năm sinh (giảm dần)
        yearFilter.innerHTML = '<option value="">Tất cả năm</option>';
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

    // Hàm tính toán Quyền tự động: Quyền = 9 - Cấp
    function calculatePermission(normRole, originalRole) {
        if (normRole === "gv") return "GV";
        if (normRole === "4 dang") return "12"; // 8 + 4
        
        // Xử lý chuỗi đẳng (Ví dụ: "1 dang", "2 dang")
        if (normRole.includes("dang")) {
            const dangMatch = normRole.match(/(\d+)\s*dang/);
            if (dangMatch) {
                const dangNum = parseInt(dangMatch[1]);
                return (8 + dangNum).toString(); // 1 đẳng -> 9, 2 đẳng -> 10
            }
        }

        // Xử lý chuỗi cấp (Ví dụ: "cap 10", "cap 3")
        if (normRole.includes("cap")) {
            const capMatch = normRole.match(/cap\s*(\d+)/);
            if (capMatch) {
                const capNum = parseInt(capMatch[1]);
                if (capNum === 10 || capNum === 9) return "0";
                return (9 - capNum).toString(); // Cấp 8 -> 1, Cấp 2 -> 7, Cấp 1 -> 8
            }
        }

        return originalRole;
    }

    function renderTable(filteredData) {
        tableBody.innerHTML = "";
        filteredData.forEach(row => {
            const tr = document.createElement("tr");
            const [name, code, dob, gender, role] = row;
            const normRole = normalize(role);
            
            let bgColor = "#cccccc";
            let textColor = "#000000";

            // Logic màu sắc chuẩn theo quy định hệ thống đai võ thuật
            switch (normRole) {
                case "cap 10": 
                    bgColor = "#ffffff"; textColor = "#000000"; break; // Trắng
                case "cap 9": 
                    bgColor = "#fffde0"; textColor = "#bda000"; break; // Trắng 1 gạch vàng
                case "cap 8": 
                    bgColor = "#fff9a6"; textColor = "#bda000"; break; // Trắng 2 gạch vàng
                case "cap 7": 
                    bgColor = "#ffea00"; textColor = "#000000"; break; // Vàng
                case "cap 6": 
                    bgColor = "#2ecc71"; textColor = "#ffffff"; break; // Xanh lá
                case "cap 5": 
                    bgColor = "#3498db"; textColor = "#ffffff"; break; // Xanh dương
                case "cap 4": 
                    bgColor = "#e74c3c"; textColor = "#ffffff"; break; // Đỏ
                case "cap 3": 
                    bgColor = "#d63031"; textColor = "#ffea00"; break; // Đỏ 1 gạch vàng
                case "cap 2": 
                    bgColor = "#b21f1f"; textColor = "#ffea00"; break; // Đỏ 2 gạch vàng
                case "cap 1": 
                    bgColor = "#8b0000"; textColor = "#ffea00"; break; // Đỏ 3 gạch vàng
                case "1 dang": 
                    bgColor = "#e0b0ff"; textColor = "#000000"; break; // Tím nhạt
                case "2 dang": 
                    bgColor = "#702963"; textColor = "#ffffff"; break; // Tím đậm
                case "4 dang": 
                    bgColor = "#111111"; textColor = "#ffffff"; break; // Đen
                case "gv":     
                    bgColor = "#000000"; textColor = "#ffffff"; break; // GV: Đen
                default:       
                    bgColor = "#cccccc"; textColor = "#000000"; break;
            }

            // Tính toán giá trị cột Quyền mới từ Cấp cũ
            const permissionValue = calculatePermission(normRole, role);

            // Cấu trúc mảng hiển thị mới gồm 7 phần tử (thêm chỗ cho nút copy ở index số 2)
            const cells = [name, code, "EXCEL_COPY_COLUMN", dob, gender, role, permissionValue];
            
            cells.forEach((text, index) => {
                const td = document.createElement("td");
                td.style.backgroundColor = bgColor;
                td.style.color = textColor;

                if (index === 2) { 
                    // Tạo cột nút Copy ở giữa Mã Hội Viên và Ngày Sinh
                    const copyBtn = document.createElement("button");
                    copyBtn.textContent = "📋";
                    copyBtn.title = "Copy Tên và Mã (Paste vào Excel tự tách làm 2 cột)";
                    copyBtn.style.cursor = "pointer";
                    copyBtn.style.border = "none";
                    copyBtn.style.background = "transparent";
                    copyBtn.style.fontSize = "16px";
                    copyBtn.style.verticalAlign = "middle";

                    copyBtn.onclick = function (e) {
                        e.stopPropagation();
                        // Gom Tên và Mã cách nhau bằng dấu Tab (\t) để Excel hiểu là 2 cột riêng biệt
                        const combinedText = `${name}\t${code}`;
                        navigator.clipboard.writeText(combinedText).then(() => {
                            copyBtn.textContent = "✅";
                            setTimeout(() => { copyBtn.textContent = "📋"; }, 1200);
                        }).catch(err => {
                            console.error("Lỗi copy:", err);
                        });
                    };
                    td.appendChild(copyBtn);
                } else {
                    // Các cột văn bản hiển thị bình thường (Không gắn thêm nút copy lẻ tẻ)
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