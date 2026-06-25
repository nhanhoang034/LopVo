document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("excelFileInput");
    const resultContainer = document.getElementById("resultContainer");

    fileInput.addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            processExcelData(sheetData);
        };
        reader.readAsArrayBuffer(file);
    });

    // Hàm chuẩn hóa loại bỏ dấu tiếng Việt mượt mà
    function removeVietnameseTones(str) {
        if (!str) return "";
        return str.normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/[đĐ]/g, "d")
                  .replace(/\s+/g, " ")
                  .trim()
                  .toLowerCase();
    }

    // Thuật toán xử lý bóc tách 2 từ cuối lên từ Họ và Tên bằng mảng .slice(-2)
    function extractTwoLastWords(fullName) {
        if (!fullName) return "";
        const words = fullName.trim().split(/\s+/);
        
        if (words.length === 0) return "";
        if (words.length === 1) return removeVietnameseTones(words[0]);

        const lastTwo = words.slice(-2);
        return removeVietnameseTones(lastTwo.join(""));
    }

    function processExcelData(sheetData) {
        resultContainer.innerHTML = ""; 
        
        if (sheetData.length === 0) {
            alert("File Excel trống hoặc không đúng định dạng!");
            return;
        }

        let nameColumnIndex = -1;
        let startRowIndex = -1;

        // Quét tìm cột có chữ "Họ và tên" trong 10 hàng đầu tiên
        for (let r = 0; r < Math.min(sheetData.length, 10); r++) {
            const row = sheetData[r];
            if (!row) continue;
            for (let c = 0; c < row.length; c++) {
                const cellValue = row[c] ? row[c].toString().trim().toLowerCase().replace(/\s+/g, "") : "";
                if (cellValue.includes("hovaten")) {
                    nameColumnIndex = c;
                    startRowIndex = r + 1; 
                    break;
                }
            }
            if (nameColumnIndex !== -1) break;
        }

        if (nameColumnIndex === -1) {
            alert("Không tìm thấy cột có chữ 'Họ và tên' trong file Excel của bạn!");
            return;
        }

        const formattedNamesList = [];
        for (let i = startRowIndex; i < sheetData.length; i++) {
            const row = sheetData[i];
            if (row && row[nameColumnIndex]) {
                const rawName = row[nameColumnIndex].toString().trim();
                if (rawName !== "") {
                    const processedName = extractTwoLastWords(rawName);
                    if (processedName) formattedNamesList.push(processedName);
                }
            }
        }

        if (formattedNamesList.length === 0) {
            alert("Không tìm thấy dữ liệu tên học viên nào dưới cột Họ và tên!");
            return;
        }

        const chunkSize = 13;
        let groupIndex = 1;

        for (let i = 0; i < formattedNamesList.length; i += chunkSize) {
            const chunk = formattedNamesList.slice(i, i + chunkSize);
            const combinedText = chunk.join(" ");

            createGroupRowUI(groupIndex, combinedText, i + 1, i + chunk.length);
            groupIndex++;
        }
    }

    // Hàm vẽ giao diện hàng cho mỗi cụm 13 học viên kèm nút Copy độc lập
    function createGroupRowUI(groupNumber, textData, fromSTT, toSTT) {
        const rowDiv = document.createElement("div");
        rowDiv.style.display = "flex";
        rowDiv.style.width = "100%";
        rowDiv.style.alignItems = "center";
        rowDiv.style.background = "#fff";
        rowDiv.style.border = "1px solid #ddd";
        rowDiv.style.borderRadius = "5px";
        rowDiv.style.padding = "10px 15px";
        rowDiv.style.boxSizing = "border-box";
        rowDiv.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";

        const labelSpan = document.createElement("span");
        labelSpan.innerHTML = `<strong>Nhóm ${groupNumber}</strong><br><small style="color:#7f8c8d;">(STT ${fromSTT} - ${toSTT})</small>`;
        labelSpan.style.minWidth = "120px";
        labelSpan.style.textAlign = "left";
        labelSpan.style.fontSize = "15px";

        const textBox = document.createElement("textarea");
        textBox.value = textData;
        textBox.readOnly = true;
        textBox.rows = 2;
        textBox.style.flex = "1";
        textBox.style.margin = "0 15px";
        textBox.style.padding = "8px";
        textBox.style.fontSize = "16px";
        textBox.style.fontFamily = "'Times New Roman', Times, serif";
        textBox.style.borderRadius = "4px";
        textBox.style.border = "1px solid #ccc";
        textBox.style.resize = "none";
        textBox.style.background = "#fafafa";

        const copyBtn = document.createElement("button");
        copyBtn.textContent = "📋 Copy";
        copyBtn.style.padding = "10px 15px";
        copyBtn.style.fontSize = "15px";
        copyBtn.style.cursor = "pointer";
        copyBtn.style.border = "none";
        copyBtn.style.backgroundColor = "#3498db";
        copyBtn.style.color = "white";
        copyBtn.style.borderRadius = "4px";
        copyBtn.style.fontWeight = "bold";
        copyBtn.style.minWidth = "90px";

        copyBtn.onclick = function () {
            navigator.clipboard.writeText(textData).then(() => {
                copyBtn.textContent = "✅ Ok";
                copyBtn.style.backgroundColor = "#2ecc71";
                setTimeout(() => {
                    copyBtn.textContent = "📋 Copy";
                    copyBtn.style.backgroundColor = "#3498db";
                }, 1200);
            }).catch(err => {
                console.error("Lỗi không thể copy nhóm:", err);
            });
        };

        rowDiv.appendChild(labelSpan);
        rowDiv.appendChild(textBox);
        rowDiv.appendChild(copyBtn);
        resultContainer.appendChild(rowDiv);
    }
});