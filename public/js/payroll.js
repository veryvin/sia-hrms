// ===================================================
// PAYROLL CALCULATOR (FIXED + WORKING)
// ===================================================
const PayrollCalculator = {
  calculateOTPay: (basicSalary, overtimeHours) => {
    const hourlyRate = basicSalary / 160; 
    return overtimeHours * hourlyRate * 1.25; 
  },

  calculateGrossPay: (basicSalary, otPay, holidayPay, nightDiff, allowances) => {
    return basicSalary + otPay + holidayPay + nightDiff + allowances;
  },

  calculateSSS: (basicSalary) => {
    return basicSalary * 0.05; // 5%
  },

  calculatePhilHealth: (basicSalary) => {
    return basicSalary * 0.025; // 2.5%
  },

  calculatePagIBIG: (basicSalary) => {
    return 100; // standard PH contribution
  },

  calculateWithholdingTax: (annualIncome) => {
    // sample 5% withholding bracket
    return annualIncome * 0.05 / 12;
  }
};

// ===================================================
// MAIN PAYROLL JS
// ===================================================
document.addEventListener("DOMContentLoaded", () => {
  const processBtn = document.getElementById("processBtn");
  const payrollModal = document.getElementById("payrollModal");
  const closeModal = document.getElementById("closeModal");
  const cancelBtn = document.getElementById("cancelBtn");
  const payrollForm = document.getElementById("payrollForm");
  const tableBody = document.querySelector(".payroll-table tbody");

  const detailsModal = document.getElementById("detailsModal");
  const closeDetailsModal = document.getElementById("closeDetailsModal");
  const closeDetailsBtn = document.getElementById("closeDetailsBtn");

  let payrollRecords = JSON.parse(localStorage.getItem("payrollRecords")) || [];

  // ===================================================
  // REAL-TIME SUMMARY
  // ===================================================
  const inputFields = [
    "basicSalary",
    "overtimeHours",
    "holidayPay",
    "nightDifferential",
    "taxableAllowances"
  ];

  inputFields.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.addEventListener("input", updatePayrollSummary);
  });

  function updatePayrollSummary() {
    const basicSalary = parseFloat(document.getElementById("basicSalary").value) || 0;
    const overtimeHours = parseFloat(document.getElementById("overtimeHours").value) || 0;
    const holidayPay = parseFloat(document.getElementById("holidayPay").value) || 0;
    const nightDiff = parseFloat(document.getElementById("nightDifferential").value) || 0;
    const allowances = parseFloat(document.getElementById("taxableAllowances").value) || 0;

    const otPay = PayrollCalculator.calculateOTPay(basicSalary, overtimeHours);
    const grossPay = PayrollCalculator.calculateGrossPay(basicSalary, otPay, holidayPay, nightDiff, allowances);

    const sss = PayrollCalculator.calculateSSS(basicSalary);
    const philHealth = PayrollCalculator.calculatePhilHealth(basicSalary);
    const pagibig = PayrollCalculator.calculatePagIBIG(basicSalary);
    const wtax = PayrollCalculator.calculateWithholdingTax(grossPay * 12);

    const totalDeductions = sss + philHealth + pagibig + wtax;
    const netPay = grossPay - totalDeductions;

    // UI update
    document.getElementById("grossPayDisplay").textContent = "₱" + grossPay.toLocaleString("en-PH", { minimumFractionDigits: 2 });
    document.getElementById("sssDisplay").textContent = "₱" + sss.toLocaleString("en-PH", { minimumFractionDigits: 2 });
    document.getElementById("philhealthDisplay").textContent = "₱" + philHealth.toLocaleString("en-PH", { minimumFractionDigits: 2 });
    document.getElementById("pagibigDisplay").textContent = "₱" + pagibig.toLocaleString("en-PH", { minimumFractionDigits: 2 });
    document.getElementById("withholdingtaxDisplay").textContent = "₱" + wtax.toLocaleString("en-PH", { minimumFractionDigits: 2 });
    document.getElementById("totalDeductionsDisplay").textContent = "₱" + totalDeductions.toLocaleString("en-PH", { minimumFractionDigits: 2 });
    document.getElementById("netPayDisplay").textContent = "₱" + netPay.toLocaleString("en-PH", { minimumFractionDigits: 2 });
  }

  // ===================================================
  // SHOW MODAL
  // ===================================================
  processBtn.addEventListener("click", () => {
    payrollForm.reset();
    updatePayrollSummary();
    payrollModal.style.display = "flex";
  });

  closeModal.addEventListener("click", () => payrollModal.style.display = "none");
  cancelBtn.addEventListener("click", () => payrollModal.style.display = "none");

  window.addEventListener("click", (e) => {
    if (e.target === payrollModal) payrollModal.style.display = "none";
    if (e.target === detailsModal) detailsModal.style.display = "none";
  });

  closeDetailsModal.addEventListener("click", () => detailsModal.style.display = "none");
  closeDetailsBtn.addEventListener("click", () => detailsModal.style.display = "none");

  // ===================================================
  // SUBMIT FORM
  // ===================================================
  payrollForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const basicSalary = parseFloat(document.getElementById("basicSalary").value) || 0;
    const overtimeHours = parseFloat(document.getElementById("overtimeHours").value) || 0;
    const holidayPay = parseFloat(document.getElementById("holidayPay").value) || 0;
    const nightDiff = parseFloat(document.getElementById("nightDifferential").value) || 0;
    const allowances = parseFloat(document.getElementById("taxableAllowances").value) || 0;

    const otPay = PayrollCalculator.calculateOTPay(basicSalary, overtimeHours);
    const grossPay = PayrollCalculator.calculateGrossPay(basicSalary, otPay, holidayPay, nightDiff, allowances);

    const sss = PayrollCalculator.calculateSSS(basicSalary);
    const philHealth = PayrollCalculator.calculatePhilHealth(basicSalary);
    const pagibig = PayrollCalculator.calculatePagIBIG(basicSalary);
    const wtax = PayrollCalculator.calculateWithholdingTax(grossPay * 12);

    const totalDeductions = sss + philHealth + pagibig + wtax;
    const netPay = grossPay - totalDeductions;

    const newRecord = {
      id: Date.now(),
      employeeNo: document.getElementById("employeeNo").value,
      employeeStatus: document.getElementById("employeeStatus").value,
      employeePosition: document.getElementById("employeePosition").value,
      employee: document.getElementById("employee").value,
      period: `${document.getElementById("periodStart").value} → ${document.getElementById("periodEnd").value}`,
      basicSalary,
      otPay,
      holidayPay,
      nightDifferential: nightDiff,
      taxableAllowances: allowances,
      grossPay,
      sss,
      philHealth,
      pagIBIG: pagibig,
      withholdingTax: wtax,
      totalDeductions,
      netPay,
      status: "Processed",
      processedDate: new Date().toLocaleDateString()
    };

    payrollRecords.push(newRecord);
    localStorage.setItem("payrollRecords", JSON.stringify(payrollRecords));

    payrollModal.style.display = "none";
    renderPayroll();
    updateSummaryCards();
  });

  // ===================================================
  // RENDER TABLE
  // ===================================================
  function renderPayroll() {
    if (payrollRecords.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="10" class="empty">No payroll records found</td></tr>`;
      return;
    }

    tableBody.innerHTML = payrollRecords.map(p => `
      <tr>
        <td>${p.employeeNo}</td>
        <td>${p.employee}</td>
        <td>${p.employeePosition}</td>
        <td>${p.employeeStatus}</td>
        <td>${p.period}</td>
        <td>₱${p.grossPay.toLocaleString("en-PH",{ minimumFractionDigits:2 })}</td>
        <td>₱${p.totalDeductions.toLocaleString("en-PH",{ minimumFractionDigits:2 })}</td>
        <td>₱${p.netPay.toLocaleString("en-PH",{ minimumFractionDigits:2 })}</td>
        <td>
          <span class="status-badge">${p.status}</span>
          <div class="action-buttons">
            <button class="view-btn" onclick="showPayrollDetails(${p.id})">👁 View</button>
            <button class="delete-btn" onclick="deletePayroll(${p.id})">🗑 Delete</button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  // ===================================================
  // DELETE RECORD
  // ===================================================
  window.deletePayroll = function(id) {
    if (!confirm("Are you sure you want to delete this payroll record?")) return;

    payrollRecords = payrollRecords.filter(p => p.id !== id);
    localStorage.setItem("payrollRecords", JSON.stringify(payrollRecords));

    renderPayroll();
    updateSummaryCards();
  };

  // ===================================================
  // VIEW DETAILS
  // ===================================================
  window.showPayrollDetails = function(id) {
    const p = payrollRecords.find(x => x.id === id);
    if (!p) return;

    document.getElementById("detailsContent").innerHTML = `
      <div class="detail-row"><strong>Employee No:</strong> <span>${p.employeeNo}</span></div>
      <div class="detail-row"><strong>Status:</strong> <span>${p.employeeStatus}</span></div>
      <div class="detail-row"><strong>Position:</strong> <span>${p.employeePosition}</span></div>
      <div class="detail-row"><strong>Name:</strong> <span>${p.employee}</span></div>
      <div class="detail-row"><strong>Period:</strong> <span>${p.period}</span></div>
      <div class="detail-row"><strong>Processed:</strong> <span>${p.processedDate}</span></div>
      <hr>
      <div class="detail-row"><strong>Basic Salary:</strong> ₱${p.basicSalary.toLocaleString("en-PH",{minimumFractionDigits:2})}</div>
      <div class="detail-row"><strong>OT Pay:</strong> ₱${p.otPay.toLocaleString("en-PH",{minimumFractionDigits:2})}</div>
      <div class="detail-row"><strong>Holiday Pay:</strong> ₱${p.holidayPay.toLocaleString("en-PH",{minimumFractionDigits:2})}</div>
      <div class="detail-row"><strong>Night Diff:</strong> ₱${p.nightDifferential.toLocaleString("en-PH",{minimumFractionDigits:2})}</div>
      <div class="detail-row"><strong>Allowances:</strong> ₱${p.taxableAllowances.toLocaleString("en-PH",{minimumFractionDigits:2})}</div>
      <hr>
      <div class="detail-row"><strong>GROSS PAY:</strong> ₱${p.grossPay.toLocaleString("en-PH",{minimumFractionDigits:2})}</div>
      <hr>
      <div class="detail-row"><strong>SSS:</strong> ₱${p.sss.toLocaleString("en-PH",{minimumFractionDigits:2})}</div>
      <div class="detail-row"><strong>PhilHealth:</strong> ₱${p.philHealth.toLocaleString("en-PH",{minimumFractionDigits:2})}</div>
      <div class="detail-row"><strong>Pag-IBIG:</strong> ₱${p.pagIBIG.toLocaleString("en-PH",{minimumFractionDigits:2})}</div>
      <div class="detail-row"><strong>Withholding Tax:</strong> ₱${p.withholdingTax.toLocaleString("en-PH",{minimumFractionDigits:2})}</div>
      <div class="detail-row"><strong>Total Deductions:</strong> ₱${p.totalDeductions.toLocaleString("en-PH",{minimumFractionDigits:2})}</div>
      <div class="detail-row"><strong>NET PAY:</strong> <span style="color:green;font-weight:bold">₱${p.netPay.toLocaleString("en-PH",{minimumFractionDigits:2})}</span></div>
    `;

    detailsModal.style.display = "flex";
  };

  // ===================================================
  // SUMMARY CARDS
  // ===================================================
  function updateSummaryCards() {
    let totalPayroll = 0;
    let totalDeductions = 0;

    payrollRecords.forEach(p => {
      totalPayroll += p.grossPay;
      totalDeductions += p.totalDeductions;
    });

    document.getElementById("totalPayroll").textContent =
      "₱" + totalPayroll.toLocaleString("en-PH", { minimumFractionDigits: 2 });

    document.getElementById("totalDeductions").textContent =
      "₱" + totalDeductions.toLocaleString("en-PH", { minimumFractionDigits: 2 });

    document.getElementById("processedCount").textContent =
      payrollRecords.length;
  }

  renderPayroll();
  updateSummaryCards();
});
