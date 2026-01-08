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
    const a = ["","ONE","TWO","THREE","FOUR","FIVE","SIX","SEVEN","EIGHT","NINE","TEN","ELEVEN","TWELVE","THIRTEEN","FOURTEEN","FIFTEEN","SIXTEEN","SEVENTEEN","EIGHTEEN","NINETEEN"];
    const b = ["","","TWENTY","THIRTY","FORTY","FIFTY","SIXTY","SEVENTY","EIGHTY","NINETY"];

    if (n === 0) return ""; 
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n/10)] + (n%10 !== 0 ? " " + a[n%10] : "");
    if (n < 1000) return a[Math.floor(n/100)] + " HUNDRED " + numToWords(n%100);
    if (n < 100000) return numToWords(Math.floor(n/1000)) + " THOUSAND " + numToWords(n%1000);
    return numToWords(Math.floor(n/100000)) + " LAKH " + numToWords(n%100000);
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
    if (itemCount >= 3) return;

    const row = document.createElement("div");
    row.className = "item-row";
    
    // HTML for the Row (Includes the Unit Select)
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

    // Add listeners to Inputs AND Selects
    row.querySelectorAll("input, select").forEach(i =>
        i.addEventListener("input", render)
    );

    itemCount++;
    if (itemCount >= 3) addBtn.disabled = true;
}

function render() {
    const rows = [...document.querySelectorAll(".item-row")];

    /* --- 1. GET CURRENT BRANCH DETAILS --- */
    // Uses the global 'currentBackground' variable to find the right data
    const currentBranch = branchData[currentBackground] || branchData["budwar.jpg"];

    let goodsTotal = 0;
    let totalCGST = 0, totalSGST = 0, totalIGST = 0;

    /* --- 2. CALCULATE GOODS --- */
    const goodsRows = rows.map((r, i) => {
        const [d, h, q, rt] = r.querySelectorAll("input");
        const unitSelect = r.querySelector("select");
        const unit = unitSelect ? unitSelect.value : "";
        const qty = +q.value || 0;
        const rate = +rt.value || 0;
        const amt = qty * rate;

        goodsTotal += amt;

        return `
          <tr>
            <td>${i+1}</td>
            <td class="desc">${d.value}</td>
            <td>${h.value}</td>
            <td>${qty}</td>
            <td>${unit}</td> 
            <td>${rate}</td>
            <td>${amt.toFixed(2)}</td>
          </tr>`;
    }).join("");

    /* --- 3. CALCULATE TAXES --- */
    const gstRows = rows.map((r, i) => {
        const [d,, q, rt, cg, sg, ig] = r.querySelectorAll("input");
        const taxable = (+q.value || 0) * (+rt.value || 0);
        
        const cgstP = +cg.value || 0;
        const sgstP = +sg.value || 0;
        const igstP = +ig.value || 0;

        const cgstA = taxable * cgstP / 100;
        const sgstA = taxable * sgstP / 100;
        const igstA = taxable * igstP / 100;

        totalCGST += cgstA;
        totalSGST += sgstA;
        totalIGST += igstA;

        return `
          <tr>
            <td>${i+1}</td>
            <td class="desc">${d.value}</td>
            <td>${taxable.toFixed(2)}</td>
            <td>${cgstP}%</td>
            <td>${cgstA.toFixed(2)}</td>
            <td>${sgstP}%</td>
            <td>${sgstA.toFixed(2)}</td>
            <td>${igstP}%</td>
            <td>${igstA.toFixed(2)}</td>
          </tr>`;
    }).join("");

    const overallGST = totalCGST + totalSGST + totalIGST;
    const grandTotal = goodsTotal + overallGST;
    currentTotals.taxable = goodsTotal;
    currentTotals.totalGST = totalCGST + totalSGST + totalIGST;
    currentTotals.grandTotal = grandTotal;

    /* --- 4. UPDATE PREVIEW HTML --- */
    const val = (id) => document.getElementById(id)?.value || "";

    preview.innerHTML = `
    <div class="page" style="background-image: url('${currentBackground}');">
        <div class="invoice">
            
            <div id="heading" class="center bold">TAX INVOICE</div><br>

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

            <table class="table">
                <tr>
                    <th>S.No</th><th>Description</th><th>HSN</th>
                    <th>Qty</th><th>Unit</th><th>Rate</th><th>Amount</th>
                </tr>
                ${goodsRows}
                <tr class="bold">
                    <td colspan="6" class="right">TOTAL</td>
                    <td>${goodsTotal.toFixed(2)}</td>
                </tr>
            </table>

            <table class="table">
                <tr>
                    <th>S.No</th><th>Description</th><th>Taxable</th>
                    <th>CGST%</th><th>CGST Amt</th>
                    <th>SGST%</th><th>SGST Amt</th>
                    <th>IGST%</th><th>IGST Amt</th>
                </tr>
                ${gstRows}
                <tr class="bold">
                    <td colspan="4" class="right">TOTAL GST</td>
                    <td>${totalCGST.toFixed(2)}</td>
                    <td></td>
                    <td>${totalSGST.toFixed(2)}</td>
                    <td></td>
                    <td>${totalIGST.toFixed(2)}</td>
                </tr>
                <tr class="bold">
                    <td colspan="8" class="right">OVERALL GST TOTAL</td>
                    <td>${overallGST.toFixed(2)}</td>
                </tr>
            </table>

            <div class="box bold">
                Amount in Words: INR ${words(grandTotal)}
            </div>

            <div class="box right bold">
                GRAND TOTAL ₹${grandTotal.toFixed(2)}
            </div>

            <div class="row">
                <div class="box">
                    <b>Bank:   ${val('bankName')}<br>
                    A/C No: ${val('AccountNumber')}<br>
                    IFSC:   ${val('Ifsc')}<br>
                    Branch: ${val('branch')}</b>
                </div>
                <div class="box right">
                    For MAHADEV CONSTRUCTION<br><BR><BR>
                    Authorised signature.
                </div>
            </div>
        </div>
    </div>`;
}
/* --- EVENT LISTENERS --- */
// 1. Listen for typing in main inputs
document.querySelectorAll("input, textarea").forEach(e =>
    e.addEventListener("input", render)
);

// 2. Listen for Account Selection
if(accountSelector) {
    accountSelector.addEventListener("change", function() {
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
const downloadBtn = document.getElementById("downloadBtn");
if(downloadBtn) {
    downloadBtn.addEventListener("click", () => {
        const element = document.querySelector("#preview .page");
        const opt = {
            margin:       0, 
            filename:     'Invoice_' + new Date().getTime() + '.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, scrollY: 0 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    });
}
const bgSelector = document.getElementById("bgSelector");
if (bgSelector) {
    bgSelector.addEventListener("change", function() {
        currentBackground = this.value;
        render(); 
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
    viewBranchSelector.addEventListener("change", async function() {
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

      if(data.success) {
          alert("Saved Successfully!");
          // Refresh view if needed
          const viewBranchSelector = document.getElementById("viewBranchSelector");
          if(viewBranchSelector && viewBranchSelector.value === payload.sellerBranch) {
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
function directPrint() {
    // 1. Get the invoice element
    const element = document.querySelector("#preview .page");
    if (!element) return;

    // 2. Create a hidden iframe if it doesn't exist
    let printFrame = document.getElementById("printFrame");
    if (!printFrame) {
        printFrame = document.createElement("iframe");
        printFrame.id = "printFrame";
        printFrame.style.position = "fixed";
        printFrame.style.right = "0";
        printFrame.style.bottom = "0";
        printFrame.style.width = "0";
        printFrame.style.height = "0";
        printFrame.style.border = "0";
        document.body.appendChild(printFrame);
    }

    const doc = printFrame.contentWindow.document;
    
    // 3. Write the HTML and copy ALL styles from the main page
    doc.open();
    doc.write('<html><head><title>Print Invoice</title>');
    
    // Copy all <style> and <link> tags so the invoice looks correct
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach(style => {
        doc.write(style.outerHTML);
    });

    doc.write('</head><body style="margin:0; padding:0;">');
    doc.write(element.outerHTML); // Directly copy the .page div
    doc.write('</body></html>');
    doc.close();

    // 4. Wait for images (backgrounds) to load before printing
    printFrame.contentWindow.onload = function() {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
    };
}