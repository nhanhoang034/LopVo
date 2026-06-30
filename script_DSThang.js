document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("excelFileInput");
    const resultContainer = document.getElementById("resultContainer");
    const excelPreviewContainer = document.getElementById("excelPreviewContainer");

    const lockScreen = document.getElementById("lockScreen");
    const webPasswordInput = document.getElementById("webPasswordInput");
    const unlockBtn = document.getElementById("unlockBtn");

    // Chỉ định worker cho thư viện PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

    // KIỂM TRA ĐĂNG NHẬP ĐỒNG BỘ
    const savedPassword = sessionStorage.getItem("web_secret_password");
    if (savedPassword) {
        lockScreen.style.display = "none";
    }

    unlockBtn.addEventListener("click", checkPassword);
    webPasswordInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") checkPassword();
    });

    async function checkPassword() {
        const password = webPasswordInput.value.trim();
        if (!password) {
            alert("Vui lòng nhập mật khẩu!");
            return;
        }
        try {
            const response = await fetch('data.encrypted');
            if (!response.ok) {
                alert("Không tìm thấy file data.encrypted trên hệ thống!");
                return;
            }
            const encryptedData = await response.text();
            const bytes = CryptoJS.AES.decrypt(encryptedData, password);
            const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedText) {
                alert("Mật khẩu sai!");
                return;
            }
            sessionStorage.setItem("web_secret_password", password);
            lockScreen.style.display = "none";
        } catch (error) {
            alert("Mật khẩu không chính xác!");
        }
    }

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

    // Hàm sinh bảng hiển thị xem trước danh sách Excel hoặc PDF ở cột bên trái
    function renderExcelPreview(sheetData) {
        excelPreviewContainer.innerHTML = "";
        if (sheetData.length === 0) return;

        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.marginTop = "0";
        table.style.fontSize = "16px";
        table.style.borderCollapse = "collapse";

        sheetData.forEach((row, rowIndex) => {
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

    // LẮNG NGHE SỰ KIỆN CHỌN FILE (HỖ TRỢ CẢ EXCEL LẪN PDF)
    fileInput.addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();
        const reader = new FileReader();

        if (fileName.endsWith('.pdf')) {
            // XỬ LÝ FILE ĐUÔI .PDF
            reader.onload = function (e) {
                const typedarray = new Uint8Array(e.target.result);
                processPdfData(typedarray);
            };
            reader.readAsArrayBuffer(file);
        } else {
            // XỬ LÝ FILE ĐUÔI EXCEL (.xlsx, .xls)
            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                processExcelData(sheetData);
            };
            reader.readAsArrayBuffer(file);
        }
    });

    // THUẬT TOÁN XỬ LÝ ĐỌC VÀ TRÍCH XUẤT VĂN BẢN TỪ FILE PDF
    async function processPdfData(typedarray) {
        resultContainer.innerHTML = "";
        try {
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            let fullTextLines = [];

            // Duyệt qua từng trang của file PDF để gom văn bản
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                
                // Ghép nối các từ nằm cùng một hàng tọa độ
                let lastY = -1;
                let pageLines = [];
                let currentLine = "";

                textContent.items.forEach(item => {
                    if (lastY === -1 || Math.abs(item.transform[5] - lastY) < 5) {
                        currentLine += " " + item.str;
                    } else {
                        if (currentLine.trim()) pageLines.push(currentLine.trim());
                        currentLine = item.str;
                    }
                    lastY = item.transform[5];
                });
                if (currentLine.trim()) pageLines.push(currentLine.trim());
                fullTextLines = fullTextLines.concat(pageLines);
            }

            // Chuyển đổi mảng văn bản thô PDF thành cấu trúc ma trận hàng cột để render Preview bên trái
            const simulatedSheetData = [["STT", "Họ và tên"]];
            const formattedNamesList = [];
            let isRecording = false;
            let sttCounter = 1;

            for (let i = 0; i < fullTextLines.length; i++) {
                const line = fullTextLines[i].trim();
                const cleanLine = removeVietnameseTones(line).replace(/\s+/g, "");

                // Tìm từ khóa kích hoạt bắt đầu lấy tên học viên
                if (cleanLine.includes("hovaten")) {
                    isRecording = true;
                    continue; 
                }

                if (isRecording) {
                    // Nếu gặp các chuỗi kết thúc danh sách hoặc dòng trống thì bỏ qua
                    if (line === "" || cleanLine.includes("ghichu") || cleanLine.includes("danhsachlop")) continue;
                    
                    // Thuật toán bóc tách thông minh: Bỏ số thứ tự ở đầu dòng văn bản PDF nếu có
                    let studentName = line.replace(/^\d+[\s,.\-/]*/, "").trim();
                    
                    // Nếu chuỗi tên có chứa dấu phẩy hoặc khoảng cách xa với chữ ghi chú, loại bỏ phần sau
                    if (studentName.includes(",")) studentName = studentName.split(",")[0].trim();

                    if (studentName && studentName.length > 2 && isNaN(studentName)) {
                        simulatedSheetData.push([sttCounter++, studentName]);
                        
                        const processedName = extractTwoLastWords(studentName);
                        if (processedName) formattedNamesList.push(processedName);
                    }
                }
            }

            if (formattedNamesList.length === 0) {
                alert("Không tìm thấy dữ liệu tên học viên nào dưới mục 'Họ và tên' trong file PDF!");
                return;
            }

            // Hiển thị bảng xem trước phía bên trái
            renderExcelPreview(simulatedSheetData);
            // Tiến hành chia cụm 13 người phía bên phải
            generateGroupChunks(formattedNamesList);

        } catch (error) {
            alert("Lỗi khi đọc file PDF!");
            console.error(error);
        }
    }

    // HÀM XỬ LÝ FILE EXCEL GỐC (GIỮ NGUYÊN LOGIC CŨ)
    function processExcelData(sheetData) {
        resultContainer.innerHTML = ""; 
        if (sheetData.length === 0) {
            alert("File Excel trống hoặc không đúng định dạng!");
            return;
        }

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

        generateGroupChunks(formattedNamesList);
    }

    // Hàm chia cụm mảng danh sách tên thành từng cụm 13 người dùng chung
    function generateGroupChunks(namesList) {
        const chunkSize = 13;
        let groupIndex = 1;
        for (let i = 0; i < namesList.length; i += chunkSize) {
            const chunk = namesList.slice(i, i + chunkSize);
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
                console.error("Lỗi copy nhóm:", err);
            });
        };

        rowDiv.appendChild(labelSpan);
        rowDiv.appendChild(textBox);
        rowDiv.appendChild(copyBtn);
        resultContainer.appendChild(rowDiv);
    }
});