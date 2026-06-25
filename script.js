document.addEventListener("DOMContentLoaded", function () {
    let data = [];
    let selectedMembers = new Set(); 
    
    const totalCount = document.getElementById("totalCount");
    const selectedCount = document.getElementById("selectedCount");
    const exportBtn = document.getElementById("exportBtn");
    const exportTxtBtn = document.getElementById("exportTxtBtn"); 
    const resetBtn = document.getElementById("resetBtn");
    const tableBody = document.getElementById("memberTable");
    const searchInput = document.getElementById("searchInput");
    const roleFilter = document.getElementById("roleFilter");
    const genderFilter = document.getElementById("genderFilter");
    const yearFilter = document.getElementById("yearFilter");

    // Các phần tử bảo mật vòng ngoài
    const lockScreen = document.getElementById("lockScreen");
    const webPasswordInput = document.getElementById("webPasswordInput");
    const unlockBtn = document.getElementById("unlockBtn");

    // Các phần tử công cụ mã hóa cho Admin
    const adminCsvFileInput = document.getElementById("adminCsvFileInput");
    const adminSecretKeyInput = document.getElementById("adminSecretKeyInput");
    const adminEncryptBtn = document.getElementById("adminEncryptBtn");

    // SỰ KIỆN BẤM NÚT MỞ KHÓA WEB
    unlockBtn.addEventListener("click", performDecryption);
    webPasswordInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") performDecryption();
    });

    async function performDecryption() {
        const password = webPasswordInput.value.trim();
        if (!password) {
            alert("Vui lòng nhập mật khẩu!");
            return;
        }

        try {
            // Tải file dữ liệu đã được mã hóa an toàn trên server GitHub về máy
            const response = await fetch('data.encrypted');
            if (!response.ok) {
                alert("Không tìm thấy file dữ liệu đã mã hóa (data.encrypted) trên GitHub!");
                return;
            }
            const encryptedData = await response.text();

            // Dùng mật khẩu người dùng gõ vào để thực hiện giải mã chuỗi bằng thuật toán AES
            const bytes = CryptoJS.AES.decrypt(encryptedData, password);
            const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedText) {
                alert("Mật khẩu sai! Không thể giải mã dữ liệu.");
                return;
            }

            // Giải mã thành công -> Khóa màn hình ẩn đi, bóc tách chuỗi CSV thành mảng dữ liệu như cũ
            lockScreen.style.display = "none";

            data = decryptedText.split(/\r?\n/)
                .filter(line => line.trim() !== "")
                .map(line => {
                    return line.split(',').map(cell => cell.trim());
                });

            populateDynamicFilters(data); 
            renderTable(data);

        } catch (error) {
            alert("Mật khẩu không chính xác hoặc dữ liệu bị lỗi!");
            console.error(error);
        }
    }

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

        roleFilter.innerHTML = '<option value="">Tất cả cấp</option>';
        Array.from(roles).sort().forEach(role => {
            const option = document.createElement("option");
            option.value = role;
            option.textContent = role;
            roleFilter.appendChild(option);
        });

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

    function calculatePermission(normRole, originalRole) {
        if (normRole === "gv") return "GV";
        if (normRole === "4 dang") return "12";
        
        if (normRole.includes("dang")) {
            const dangMatch = normRole.match(/(\d+)\s*dang/);
            if (dangMatch) {
                const dangNum = parseInt(dangMatch[1]);
                return (8 + dangNum).toString();
            }
        }

        if (normRole.includes("cap")) {
            const capMatch = normRole.match(/cap\s*(\d+)/);
            if (capMatch) {
                const capNum = parseInt(capMatch[1]);
                if (capNum === 10 || capNum === 9) return "0";
                return (9 - capNum).toString();
            }
        }

        return originalRole;
    }

    function updateSelectedCount() {
        selectedCount.textContent = `Đã chọn: ${selectedMembers.size} học viên`;
    }

    function renderTable(filteredData) {
        tableBody.innerHTML = "";
        filteredData.forEach(row => {
            const tr = document.createElement("tr");
            const [name, code, dob, gender, role] = row;
            const normRole = normalize(role);
            
            let bgColor = "#cccccc";
            let textColor = "#000000";

            switch (normRole) {
                case "cap 10": bgColor = "#ffffff"; textColor = "#000000"; break;
                case "cap 9":  bgColor = "#fffde0"; textColor = "#bda000"; break;
                case "cap 8":  bgColor = "#fff9a6"; textColor = "#bda000"; break;
                case "cap 7":  bgColor = "#ffea00"; textColor = "#000000"; break;
                case "cap 6":  bgColor = "#2ecc71"; textColor = "#ffffff"; break;
                case "cap 5":  bgColor = "#3498db"; textColor = "#ffffff"; break;
                case "cap 4":  bgColor = "#e74c3c"; textColor = "#ffffff"; break;
                case "cap 3":  bgColor = "#d63031"; textColor = "#ffea00"; break;
                case "cap 2":  bgColor = "#b21f1f"; textColor = "#ffea00"; break;
                case "cap 1":  bgColor = "#8b0000"; textColor = "#ffea00"; break;
                case "1 dang": bgColor = "#e0b0ff"; textColor = "#000000"; break;
                case "2 dang": bgColor = "#702963"; textColor = "#ffffff"; break;
                case "4 dang": bgColor = "#111111"; textColor = "#ffffff"; break;
                case "gv":     bgColor = "#000000"; textColor = "#ffffff"; break;
                default:       bgColor = "#cccccc"; textColor = "#000000"; break;
            }

            const permissionValue = calculatePermission(normRole, role);
            const cells = [name, code, "EXCEL_COPY_COLUMN", "CHECKBOX_COLUMN", dob, gender, permissionValue, role];
            
            cells.forEach((text, index) => {
                const td = document.createElement("td");
                td.style.backgroundColor = bgColor;
                td.style.color = textColor;

                if (index === 2) { 
                    const copyBtn = document.createElement("button");
                    copyBtn.textContent = "Copy";
                    copyBtn.style.cursor = "pointer";
                    copyBtn.style.border = "1px solid #ccc";
                    copyBtn.style.background = "#fff";
                    copyBtn.style.borderRadius = "3px";
                    copyBtn.style.padding = "2px 6px";
                    copyBtn.style.fontSize = "15px";

                    copyBtn.onclick = function (e) {
                        e.stopPropagation();
                        const combinedText = `${name}\t${code}`;
                        navigator.clipboard.writeText(combinedText).then(() => {
                            copyBtn.textContent = "Done";
                            setTimeout(() => { copyBtn.textContent = "Copy"; }, 1200);
                        }).catch(err => {
                            console.error("Lỗi copy:", err);
                        });
                    };
                    td.appendChild(copyBtn);
                } else if (index === 3) {
                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.style.transform = "scale(1.3)";
                    checkbox.style.cursor = "pointer";
                    
                    if (selectedMembers.has(code)) {
                        checkbox.checked = true;
                    }

                    checkbox.addEventListener("change", function () {
                        if (checkbox.checked) {
                            selectedMembers.add(code);
                        } else {
                            selectedMembers.delete(code);
                        }
                        updateSelectedCount();
                    });

                    td.appendChild(checkbox);
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

    resetBtn.addEventListener("click", function () {
        if (selectedMembers.size === 0) return;
        if (confirm("Bạn có chắc chắn muốn bỏ chọn tất cả học viên không?")) {
            selectedMembers.clear();
            updateSelectedCount();
            filterAndRender(); 
        }
    });

    exportTxtBtn.addEventListener("click", function () {
        if (selectedMembers.size === 0) {
            alert("Chọn ít nhất 1 học viên để xuất file text!");
            return;
        }
        const selectedCodes = [];
        data.forEach(row => {
            const code = row[1];
            if (selectedMembers.has(code)) {
                selectedCodes.push(code);
            }
        });
        const txtContent = selectedCodes.join(" ");
        const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "Ma_Hoi_Vien.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    exportBtn.addEventListener("click", function () {
        if (selectedMembers.size === 0) {
            alert("Chọn ít nhất 1 học viên để xuất file Excel!");
            return;
        }
        const exportData = [];
        let stt = 1;
        data.forEach(row => {
            const [name, code, dob, gender, role] = row;
            if (selectedMembers.has(code)) {
                const normRole = normalize(role);
                const permissionValue = calculatePermission(normRole, role);
                exportData.push({
                    "STT": stt++,
                    "Họ và Tên": name,
                    "Mã hội viên": code,
                    "Quyền": permissionValue,
                    "Cấp": role
                });
            }
        });
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Danh Sách");
        worksheet["!cols"] = [{ wch: 8 }, { wch: 30 }, { wch: 18 }, { wch: 10 }, { wch: 12 }];
        XLSX.writeFile(workbook, "DS thi quý .xlsx");
    });

    [searchInput, roleFilter, genderFilter, yearFilter].forEach(el => {
        el.addEventListener(el.tagName === "INPUT" ? "input" : "change", filterAndRender);
    });

    // ==========================================
    // LOGIC CÔNG CỤ MÃ HÓA FILE CHO ADMIN
    // ==========================================
    adminEncryptBtn.addEventListener("click", function () {
        const file = adminCsvFileInput.files[0];
        const secretKey = adminSecretKeyInput.value.trim();

        if (!file) {
            alert("Vui lòng chọn file data.csv gốc!");
            return;
        }
        if (!secretKey) {
            alert("Vui lòng nhập mật khẩu muốn đặt để khóa file!");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const csvText = e.target.result;
            
            // Thực hiện mã hóa toàn bộ chuỗi văn bản của file CSV bằng mật khẩu bí mật
            const encryptedStr = CryptoJS.AES.encrypt(csvText, secretKey).toString();

            // Tạo file data.encrypted và kích hoạt tải xuống máy tính của bạn
            const blob = new Blob([encryptedStr], { type: "text/plain;charset=utf-8" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "data.encrypted";
            link.click();
        };
        reader.readAsText(file);
    });
});