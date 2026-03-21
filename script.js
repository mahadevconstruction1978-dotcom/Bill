/* --- CONFIGURATION & ELEMENTS --- */
const itemsDiv = document.getElementById("items");
const addBtn = document.getElementById("addItem");
const preview = document.getElementById("preview");
const accountSelector = document.getElementById("accountSelector");

// Bank Database
const bankData = {
    acc1: {
        bank: "Bank of India",
        acNo: "693220110000308",
        ifsc: "BKID0006932",
        branch: "Shivaji Nagar Jhansi-284128"
    },
    acc2: {
        bank: "IDBI Bank",
        acNo: "2265102000001021",
        ifsc: "IBKL0002265",
        branch: "Niwari Madhya Pradesh-472442"
    }
};
const branchData = {
    "budwar.jpg": {
        stateName: "Uttar Pradesh",   // Added Name
        stateCode: "09",              // Added Code
        gstin: "09AMLPC5798A1ZW",
        address: "H.N.151,BUDWAR LALITPUR, UTTAR PRADESH 284403",
        phone: "9811503806, 7974184033"
    },
    "niwari.jpg": {
        stateName: "Madhya Pradesh",  // Added Name
        stateCode: "23",              // Added Code
        gstin: "23AMLPC5798A1Z6",     // REMEMBER: Update this with real MP GSTIN
        address: "Ward no. 07 Matan Mohalla Niwari Madhya Pradesh 472442",
        phone: "9811503806, 7974184033"
    }
};
let currentBackground = "budwar.jpg";
/* --- HELPER FUNCTIONS --- */
function formatDate(inputDate) {
    if (!inputDate) return "";
    const date = new Date(inputDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

function toUpper(str) {
    return str ? str.toUpperCase() : "";
}
/* --- GLOBAL VARIABLES TO STORE TOTALS --- */
// We update these every time render() runs
let currentTotals = {
    taxable: 0,
    totalGST: 0,
    grandTotal: 0
};
/* Number to Words (Indian System) */
function numToWords(n) {
    const a = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
    const b = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

    if (n === 0) return "";
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " HUNDRED " + numToWords(n % 100);
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + " THOUSAND " + numToWords(n % 1000);
    return numToWords(Math.floor(n / 100000)) + " LAKH " + numToWords(n % 100000);
}

function words(n) {
    if (n === 0) return "ZERO RUPEES ONLY";
    const intPart = Math.floor(n);
    const paisaPart = Math.round((n - intPart) * 100);

    let result = "";
    if (intPart > 0) result += numToWords(intPart) + " RUPEES";
    if (paisaPart > 0) {
        if (result !== "") result += " AND ";
        result += numToWords(paisaPart) + " PAISA";
    }
    return result + " ONLY";
}

/* --- MAIN LOGIC --- */
let itemCount = 0;

function addItem() {
    // 1. Removed the item limit. Add as many as needed!
    const row = document.createElement("div");
    row.className = "item-row";

    row.innerHTML = `
        <input placeholder="Description">
        <input placeholder="HSN">
        <input type="number" placeholder="Qty">
        <select class="unit-select" style="padding: 5px;">
            <option value="Piece">Piece</option>
            <option value="m³">m³</option>
            <option value="KGS">KGS</option>
            <option value="MTRS">MTRS</option>
            <option value="BAGS">BAGS</option>
            <option value="SETS">SETS</option>
            <option value="SQ.FT">SQ.FT</option>
        </select>
        <input type="number" placeholder="Rate">
        <input type="number" placeholder="CGST %">
        <input type="number" placeholder="SGST %">
        <input type="number" placeholder="IGST %">
    `;
    itemsDiv.appendChild(row);

    row.querySelectorAll("input, select").forEach(i =>
        i.addEventListener("input", render)
    );

    itemCount++;
}

function render() {
    // Grab the freshest background value
    const bgSelect = document.getElementById("bgSelector");
    if (bgSelect) {
        currentBackground = bgSelect.value;
        console.log("Currently selected background file:", currentBackground);
    }

    const rows = [...document.querySelectorAll(".item-row")];
    const currentBranch = branchData[currentBackground] || branchData["budwar.jpg"];

    // 💡 ADD THIS LINE BACK IN:
    const val = (id) => document.getElementById(id)?.value || "";
    let goodsTotal = 0;
    let totalCGST = 0, totalSGST = 0, totalIGST = 0;

    // --- 1. PRE-CALCULATE ALL ITEMS ---
    const processedItems = rows.map((r, i) => {
        const [d, h, q, rt, cg, sg, ig] = r.querySelectorAll("input");
        const unitSelect = r.querySelector("select");

        const desc = d.value;
        const hsn = h.value;
        const qty = +q.value || 0;
        const unit = unitSelect ? unitSelect.value : "";
        const rate = +rt.value || 0;
        const amt = qty * rate;

        const cgstP = +cg?.value || 0;
        const sgstP = +sg?.value || 0;
        const igstP = +ig?.value || 0;

        const cgstA = amt * cgstP / 100;
        const sgstA = amt * sgstP / 100;
        const igstA = amt * igstP / 100;

        goodsTotal += amt;
        totalCGST += cgstA;
        totalSGST += sgstA;
        totalIGST += igstA;

        return { i: i + 1, desc, hsn, qty, unit, rate, amt, cgstP, cgstA, sgstP, sgstA, igstP, igstA };
    });

    const overallGST = totalCGST + totalSGST + totalIGST;
    const grandTotal = goodsTotal + overallGST;

    currentTotals.taxable = goodsTotal;
    currentTotals.totalGST = overallGST;
    currentTotals.grandTotal = grandTotal;

    // --- 2. BUILD CONTENT BLOCKS ---
    // We break the invoice into "blocks" with a height cost.
    const blocks = [];

    // A. Goods Table Start
    const goodsHeaderBlock = { html: `<table class="table"><tr><th>S.No</th><th>Description</th><th>HSN</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Amount</th></tr>`, cost: 2, type: 'open' };
    blocks.push(goodsHeaderBlock);

    // B. Goods Rows
    // B. Goods Rows
    processedItems.forEach(item => {
        // 💡 SMART COST: Assume roughly 35 characters fit on one line. 
        // If the description is 70 chars long, this row costs "2" lines of space.
        const charLimitPerLine = 35;
        const linesNeeded = Math.ceil((item.desc.length || 1) / charLimitPerLine);
        const rowCost = Math.max(1, linesNeeded);

        blocks.push({
            html: `
            <tr>
                <td>${item.i}</td>
                <td class="desc" style="max-width: 100px; word-wrap: break-word; white-space: normal; text-align: left; padding: 4px;">
                    ${item.desc}
                </td>
                <td>${item.hsn}</td>
                <td>${item.qty}</td>
                <td>${item.unit}</td>
                <td>${item.rate}</td>
                <td>${item.amt.toFixed(2)}</td>
            </tr>`,
            cost: rowCost,
            type: 'row'
        });
    });

    // C. Goods Table End
    blocks.push({ html: `<tr class="bold"><td colspan="6" class="right">TOTAL</td><td>${goodsTotal.toFixed(2)}</td></tr></table>`, cost: 2, type: 'close' });

    // Spacer
    blocks.push({ html: `<br>`, cost: 1, type: 'spacer' });

    // D. GST Table Start
    const gstHeaderBlock = { html: `<table class="table"><tr><th>S.No</th><th>Description</th><th>Taxable</th><th>CGST%</th><th>CGST Amt</th><th>SGST%</th><th>SGST Amt</th><th>IGST%</th><th>IGST Amt</th></tr>`, cost: 2, type: 'open' };
    blocks.push(gstHeaderBlock);

    // E. GST Rows
    // E. GST Rows
    processedItems.forEach(item => {
        // Re-calculate the cost for the GST table rows
        const charLimitPerLine = 35;
        const linesNeeded = Math.ceil((item.desc.length || 1) / charLimitPerLine);
        const rowCost = Math.max(1, linesNeeded);

        blocks.push({
            html: `
            <tr>
                <td>${item.i}</td>
                <td class="desc" style="max-width: 150px; word-wrap: break-word; white-space: normal; text-align: left; padding: 4px;">
                    ${item.desc}
                </td>
                <td>${item.amt.toFixed(2)}</td>
                <td>${item.cgstP}%</td>
                <td>${item.cgstA.toFixed(2)}</td>
                <td>${item.sgstP}%</td>
                <td>${item.sgstA.toFixed(2)}</td>
                <td>${item.igstP}%</td>
                <td>${item.igstA.toFixed(2)}</td>
            </tr>`,
            cost: rowCost,
            type: 'row'
        });
    });

    // F. GST Table End
    blocks.push({ html: `<tr class="bold"><td colspan="4" class="right">TOTAL GST</td><td>${totalCGST.toFixed(2)}</td><td></td><td>${totalSGST.toFixed(2)}</td><td></td><td>${totalIGST.toFixed(2)}</td></tr><tr class="bold"><td colspan="8" class="right">OVERALL GST TOTAL</td><td>${overallGST.toFixed(2)}</td></tr></table>`, cost: 3, type: 'close' });

    // G. Final Signature Footer
    // Grab the selected bank directly from the dropdown
    const selectedBankKey = document.getElementById("accountSelector")?.value;
    const currentBank = bankData[selectedBankKey] || { bank: "", acNo: "", ifsc: "", branch: "" };

    // G. Final Signature Footer
    // G. Final Signature Footer
    // G. Final Signature Footer
    blocks.push({
        html: `
        <div class="box bold" style="margin-top: 2px;">Amount in Words: INR ${words(grandTotal)}</div>
        <div class="box right bold">GRAND TOTAL ₹${grandTotal.toFixed(2)}</div>
        
        <div class="row" style="display: flex; flex-wrap: nowrap; width: 100%;">
            <div class="box" style="flex: 1 1 50%; max-width: 50%; box-sizing: border-box; overflow: hidden;">
                <b>Bank: ${currentBank.bank}<br>
                A/C No: ${currentBank.acNo}<br>
                IFSC: ${currentBank.ifsc}<br>
                Branch: ${currentBank.branch}</b>
            </div>
            <div class="box right" style="flex: 1 1 50%; max-width: 50%; text-align: right; box-sizing: border-box; overflow: hidden;">
                For MAHADEV CONSTRUCTION<br><br><br><br>
                Authorised signature.
            </div>
        </div>
    `, cost: 8, type: 'footer'
    });
    // --- 3. DISTRIBUTE BLOCKS INTO PAGES ---
    const MAX_COST_PER_PAGE = 28; // 💡 Change this to control how much fits on one page (higher = more items per page)

    let pages = [];
    let currentPage = [];
    let currentCost = 0;
    let openTables = [];

    for (let i = 0; i < blocks.length; i++) {
        let block = blocks[i];

        // If adding this block overflows the page
        if (currentCost + block.cost > MAX_COST_PER_PAGE && currentCost > 0) {

            // If we are in the middle of a table, close it safely
            if (openTables.length > 0) {
                currentPage.push({ html: `</table>`, cost: 0 });
            }

            pages.push(currentPage); // Save current page

            // Reset for the new page
            currentPage = [];
            currentCost = 0;

            // Re-open the table at the top of the new page
            if (openTables.length > 0) {
                let lastOpenTable = openTables[openTables.length - 1];
                currentPage.push(lastOpenTable);
                currentCost += lastOpenTable.cost;
            }
        }

        // Track if a table is opened or closed
        if (block.type === 'open') openTables.push(block);
        if (block.type === 'close') openTables.pop();

        currentPage.push(block);
        currentCost += block.cost;
    }

    if (currentPage.length > 0) pages.push(currentPage);

    // --- 4. RENDER HTML FOR ALL PAGES ---
    // --- 4. RENDER HTML FOR ALL PAGES ---
    const totalPages = pages.length;
    let finalPreviewHTML = "";

    pages.forEach((pageBlocks, index) => {
        const pageNum = index + 1;
        const isLastPage = (pageNum === totalPages);

        // Standard Header for EVERY page
        const standardHeader = `
            <div id="heading" class="center bold" style="position: relative;">
                TAX INVOICE 
                <span style="position: absolute; right: 0; font-size: 12px; top: 0;">Page ${pageNum} of ${totalPages}</span>
            </div><br>
            <div class="row">
                <div class="box">
                    <b>MAHADEV CONSTRUCTION</b><br>
                    ${toUpper(currentBranch.address)}<br>
                    <b>State Name: ${toUpper(currentBranch.stateName)} </b>
                    <b>State Code: ${currentBranch.stateCode}</b><br>
                    GSTIN: ${toUpper(currentBranch.gstin)}<br>
                    PAN: AMLPC5798A<br>
                    <b>Phone no.: ${currentBranch.phone}</b>
                </div>
                <div class="box">
                    <b>${toUpper(val('buyerName'))}</b><br>
                    ${toUpper(val('buyerAddress'))}<br>
                    <b>State Name: ${toUpper(val('StateCode2'))}</b><br>
                    GSTIN: ${toUpper(val('buyerGST'))}
                </div>
            </div>
            <div class="row">
                <div class="box">Invoice No: ${val('invoiceNo')}</div>
                <div class="box right">Date: ${formatDate(val('invoiceDate'))}</div>
            </div>
        `;

        // Extract the raw HTML from the blocks for this specific page
        const pageContent = pageBlocks.map(b => b.html).join("");

        // Add P.T.O only if it's NOT the last page
        const ptoHTML = !isLastPage ? `<div class="bold right" style="margin-top: 15px;">P.T.O. (Continued on next page...)</div>` : "";

        // 💡 NEW: Outside Footer Note (Only appears on the LAST page)
        const outsideFooterHTML = isLastPage ? `
            <div style="position: absolute; bottom: 70px; right: 40px; text-align: right; font-weight: bold; font-size: 16px; color: #000;">
                Thanks<br>
                Yours Faithfully<br>
                Mahadev Construction
            </div>
        ` : "";

        // 💡 FIX: Only add a page break if it is NOT the last page to prevent blank pages
        const pageBreakCSS = !isLastPage ? `page-break-after: always;` : ``;

        finalPreviewHTML += `
            <div class="page" style="background-image: url('${currentBackground}'); background-size: cover; ${pageBreakCSS} position: relative; min-height: 297mm; box-sizing: border-box;">
                <div class="invoice">
                    ${standardHeader}
                    ${pageContent}
                    ${ptoHTML}
                </div>
                ${outsideFooterHTML}
            </div>
        `;
    });

    // Inject everything into the preview window
    preview.innerHTML = finalPreviewHTML;
}
/* --- EVENT LISTENERS --- */
// 1. Listen for typing in main inputs
// 1. Listen for typing AND dropdown changes
document.querySelectorAll("input, textarea, select").forEach(e => {
    e.addEventListener("input", render);
    e.addEventListener("change", render);
});

// 2. Listen for Account Selection
if (accountSelector) {
    accountSelector.addEventListener("change", function () {
        const selected = this.value;
        const bName = document.getElementById("bankName");
        const bAc = document.getElementById("AccountNumber");
        const bIfsc = document.getElementById("Ifsc");
        const bBranch = document.getElementById("branch");

        if (bankData[selected]) {
            bName.value = bankData[selected].bank;
            bAc.value = bankData[selected].acNo;
            bIfsc.value = bankData[selected].ifsc;
            bBranch.value = bankData[selected].branch;
        } else {
            bName.value = "";
            bAc.value = "";
            bIfsc.value = "";
            bBranch.value = "";
        }
        render();
    });
}

// 3. Download PDF Listener
// Change document.querySelector("#preview .page") to document.getElementById("preview")
// 3. Download PDF Listener
// 3. Download PDF Listener
const downloadBtn = document.getElementById("downloadBtn");
if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
        const element = document.getElementById("preview");

        const opt = {
            margin: 0,
            filename: 'Invoice_' + new Date().getTime() + '.pdf',
            image: { type: 'jpeg', quality: 1.0 },
            // Tell the PDF generator to look for your .page classes!
            pagebreak: { mode: 'css', avoid: 'tr' },
            html2canvas: {
                scale: 3, // Lowered slightly from 4 so multi-page doesn't crash browser memory
                useCORS: true,
                letterRendering: true,
                scrollY: 0, // Starts capture from the absolute top
                windowHeight: element.scrollHeight // Captures the full hidden length of all pages
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    });
}


// Ensure Buyer GST Input triggers render
document.getElementById("buyerGST").addEventListener("input", render);
/* --- INITIALIZE --- */
addBtn.onclick = addItem;
addItem(); // Add first empty row
render();  // Initial render
/* --- DASHBOARD LOGIC (Update this section) --- */
const viewBranchSelector = document.getElementById("viewBranchSelector");
const billsTableBody = document.querySelector("#billsTable tbody");
const loadingDiv = document.getElementById("loading");

if (viewBranchSelector) {
    viewBranchSelector.addEventListener("change", async function () {
        const selectedBranch = this.value;
        billsTableBody.innerHTML = "";

        if (!selectedBranch) return;

        loadingDiv.style.display = "block";

        try {
            const response = await fetch(`https://backrnd-8n8g.onrender.com/api/get-invoices?branch=${selectedBranch}`);
            const invoices = await response.json();

            loadingDiv.style.display = "none";

            if (invoices.length === 0) {
                billsTableBody.innerHTML = "<tr><td colspan='7' style='text-align:center; padding:10px;'>No bills found.</td></tr>";
                return;
            }

            invoices.forEach(inv => {
                const row = document.createElement("tr");
                const rawDate = new Date(inv.invoice_date);
                const dateStr = rawDate.toLocaleDateString('en-GB');

                row.innerHTML = `
                    <td style="padding:8px; text-align:center;">${inv.invoice_no}</td>
                    <td style="padding:8px; text-align:center;">${dateStr}</td>
                    <td style="padding:8px;">${inv.buyer_name}</td>
                    <td style="padding:8px; text-align:center;">${inv.buyer_gst}</td>
                    
                    <td style="padding:8px; text-align:right;">₹${inv.taxable_amount || 0}</td>
                    <td style="padding:8px; text-align:right;">₹${inv.total_gst || 0}</td>
                    <td style="padding:8px; text-align:right; font-weight:bold;">₹${inv.grand_total}</td>
                `;
                billsTableBody.appendChild(row);
            });

        } catch (error) {
            console.error("Error fetching bills:", error);
            loadingDiv.innerText = "Error loading data.";
        }
    });
}
async function saveToDatabase() {
    const loader = document.getElementById("fullScreenLoader");
    loader.style.display = "flex";

    try {
        // 1. GET TOTALS DIRECTLY FROM GLOBAL VARIABLE (No Calculation!)
        const { taxable, totalGST, grandTotal } = currentTotals;

        // 2. PREPARE ITEMS DATA (Only structure, no math needed for totals)
        const rows = [...document.querySelectorAll(".item-row")];

        const currentBranch = branchData[document.getElementById('bgSelector').value] || branchData["budwar.jpg"];
        const buyerGSTVal = document.getElementById("buyerGST").value.trim();
        const buyerStateCode = buyerGSTVal.substring(0, 2);
        const isLocal = (buyerStateCode === currentBranch.stateCode) && (buyerStateCode.length === 2);

        const itemsData = rows.map(r => {
            const inputs = r.querySelectorAll("input");
            const unitSelect = r.querySelector(".unit-select");
            const gstSelect = r.querySelector(".gst-select");

            const qty = parseFloat(inputs[2].value) || 0;
            const rate = parseFloat(inputs[3].value) || 0;
            const gstPercent = parseFloat(gstSelect ? gstSelect.value : 0) || 0;
            const taxableAmt = qty * rate;

            // Simple split logic just for the item record
            let cgstRate = 0, sgstRate = 0, igstRate = 0;
            if (isLocal) {
                cgstRate = gstPercent / 2;
                sgstRate = gstPercent / 2;
            } else {
                igstRate = gstPercent;
            }

            return {
                desc: inputs[0].value,
                hsn: inputs[1].value,
                qty: qty,
                unit: unitSelect ? unitSelect.value : "",
                rate: rate,
                amount: taxableAmt, // Item Taxable Value
                cgst: cgstRate,
                sgst: sgstRate,
                igst: igstRate
            };
        });

        // 3. PREPARE PAYLOAD
        const payload = {
            invoiceNo: document.getElementById('invoiceNo').value,
            invoiceDate: document.getElementById('invoiceDate').value,
            sellerBranch: document.getElementById('bgSelector').value,
            buyerName: document.getElementById('buyerName').value,
            buyerGST: document.getElementById('buyerGST').value,
            buyerAddress: document.getElementById('buyerAddress').value,
            buyerState: document.getElementById('StateCode2').value,

            // DIRECTLY USING THE GLOBALS
            taxableAmount: parseFloat(taxable.toFixed(2)),
            totalGST: parseFloat(totalGST.toFixed(2)),
            grandTotal: parseFloat(grandTotal.toFixed(2)),

            items: itemsData
        };

        // 4. SEND TO SERVER
        const res = await fetch('https://backrnd-8n8g.onrender.com/api/save-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        loader.style.display = "none";

        if (data.success) {
            alert("Saved Successfully!");
            // Refresh view if needed
            const viewBranchSelector = document.getElementById("viewBranchSelector");
            if (viewBranchSelector && viewBranchSelector.value === payload.sellerBranch) {
                viewBranchSelector.dispatchEvent(new Event('change'));
            }
        } else {
            alert("Error saving: " + data.error);
        }

    } catch (err) {
        console.error(err);
        loader.style.display = "none";
        alert("Failed to connect to server.");
    }
}
/* --- PRINT LOGIC --- */
/* --- PRINT LOGIC --- */
function directPrint() {
    const previewContent = document.getElementById("preview").innerHTML;
    if (!previewContent) return;

    let printFrame = document.getElementById("printFrame");
    if (!printFrame) {
        printFrame = document.createElement("iframe");
        printFrame.id = "printFrame";
        printFrame.style.position = "absolute";
        printFrame.style.right = "0";
        printFrame.style.bottom = "0";
        printFrame.style.width = "0";
        printFrame.style.height = "0";
        printFrame.style.border = "0";
        document.body.appendChild(printFrame);
    }

    const doc = printFrame.contentWindow.document;

    doc.open();
    doc.write('<html><head><title>Print Invoice</title>');

    // 1. Copy main styles
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach(style => {
        doc.write(style.outerHTML);
    });

    // 2. INJECT STRICT PRINT CSS
    doc.write(`
        <style>
            /* Kill browser default margins and blank pages */
            @page { size: A4 portrait; margin: 0mm !important; }
            
            /* Force background images to print and allow full scrolling */
            body { 
                margin: 0 !important; 
                padding: 0 !important; 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
                background-color: white;
            }
            
            /* Lock the page to exact A4 dimensions */
            .page { 
                width: 210mm !important; 
                min-height: 297mm !important; 
                box-sizing: border-box; 
                page-break-after: always;
                page-break-inside: avoid;
                overflow: hidden;
            }
            
            /* Prevent the phantom blank page at the very end */
            .page:last-child { 
                page-break-after: auto !important; 
            }
        </style>
    `);

    doc.write('</head><body>');
    doc.write(previewContent);
    doc.write('</body></html>');
    doc.close();

    // 3. Give the background image 500ms to load before opening print dialog
    setTimeout(() => {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
    }, 500);
}