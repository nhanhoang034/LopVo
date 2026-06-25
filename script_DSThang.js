document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("excelFileInput");
    const resultContainer = document.getElementById("resultContainer");
    const excelPreviewContainer = document.getElementById("excelPreviewContainer");

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

    function removeVietnameseTones(str) {
        if (!str) return "";
        return str.normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/[đĐ]/g, "d")
                  .replace(/\s+/g, " ")
                  .trim()
                  .toLowerCase();
    }

    function extractTwoLastWords(fullName) {
        if (!fullName) return "";
        const words = fullName.trim().split(/\s+/);
        
        if (words.length === 0) return "";
        if (words.length === 1) return removeVietnameseTones(words[0]);

        const lastTwo = words.slice(-2);
        return removeVietnameseTones(lastTwo.join(""));
    }

    // Hàm sinh bảng hiển thị xem trước danh sách Excel gốc ở cột bên trái
    function renderExcelPreview(sheetData) {
        excelPreviewContainer.innerHTML = "";
        if (sheetData.length === 0) return;

        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.marginTop = "0";
        table.style.fontSize = "16px";
        table.style.borderCollapse = "collapse";

        sheetData.forEach((row, rowIndex) => {
            // Loại bỏ các dòng trống hoàn toàn trong file Excel để bảng gọn đẹp
            if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || cell === "")) return;

            const tr = document.createElement("tr");
            row.forEach(cell => {
                const cellElement = rowIndex === 0 ? document.createElement("th") : document.createElement("td");
                cellElement.textContent = cell !== undefined && cell !== null ? cell.toString().trim() : "";
                cellElement.style.border = "1px solid #ddd";
                cellElement.style.padding = "6px 8px";
                if (rowIndex === 0) {
                    cellElement.style.backgroundColor = "#f2f2f2";
                    cellElement.style.fontWeight = "bold";
                }
                tr.appendChild(cellElement);
            });
            table.appendChild(tr);
        });
        excelPreviewContainer.appendChild(table);
    }

    function processExcelData(sheetData) {
        resultContainer.innerHTML = ""; 
        
        if (sheetData.length === 0) {
            alert("File Excel trống hoặc không đúng định dạng!");
            return;
        }

        // Tạo giao diện bảng xem trước ở cột bên trái trước
        renderExcelPreview(sheetData);

        let nameColumnIndex = -1;
        let startRowIndex = -1;

        for (let r = 0; r < Math.min(sheetData.length, 15); r++) {
            const row = sheetData[r];
            if (!row) continue;
            for (let c = 0; c < row.length; c++) {
                if (row[c] === undefined || row[c] === null) continue;
                
                const cellClean = removeVietnameseTones(row[c].toString()).replace(/\s+/g, "");
                
                if (cellClean.includes("hovaten")) {
                    nameColumnIndex = c;
                    startRowIndex = r + 1; 
                    break;
                }
            }
            if (nameColumnIndex !== -1) break;
        }

        if (nameColumnIndex === -1) {
            alert("Thử lại với Danh sách khác.");
            return;
        }

        const formattedNamesList = [];
        for (let i = startRowIndex; i < sheetData.length; i++) {
            const row = sheetData[i];
            if (row && row[nameColumnIndex]) {
                const rawName = row[nameColumnIndex].toString().trim();
                if (rawName !== "" && rawName.toLowerCase() !== "họ và tên") {
                    const processedName = extractTwoLastWords(rawName);
                    if (processedName) formattedNamesList.push(processedName);
                }
            }
        }

        if (formattedNamesList.length === 0) {
            alert("Danh sách rỗng.");
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
        labelSpan.style.minWidth = "110px";
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
        copyBtn.textContent = "Copy";
        copyBtn.style.padding = "10px 15px";
        copyBtn.style.fontSize = "15px";
        copyBtn.style.cursor = "pointer";
        copyBtn.style.border = "none";
        copyBtn.style.backgroundColor = "#3498db";
        copyBtn.style.color = "white";
        copyBtn.style.borderRadius = "4px";
        copyBtn.style.fontWeight = "bold";
        copyBtn.style.minWidth = "80px";

        copyBtn.onclick = function () {
            navigator.clipboard.writeText(textData).then(() => {
                copyBtn.textContent = "Done";
                copyBtn.style.backgroundColor = "#2ecc71";
                setTimeout(() => {
                    copyBtn.textContent = "Copy";
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