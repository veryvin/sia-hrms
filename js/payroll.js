// ===================================================
// AUTOMATED PAYROLL DASHBOARD
// ===================================================

const PayrollCalculator = {
  parseTimeToSeconds: (timeStr) => {
    if (!timeStr || timeStr === "--" || timeStr === null) return null;
    const match = timeStr.match(/(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);
    const meridiem = match[4].toUpperCase();

    if (meridiem === "AM") {
      if (hours === 12) hours = 0;
    } else {
      if (hours !== 12) hours += 12;
    }

    return hours * 3600 + minutes * 60 + seconds;
  },

  calculateDailyHours: (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return 0;
    
    const inSeconds = PayrollCalculator.parseTimeToSeconds(timeIn);
    const outSeconds = PayrollCalculator.parseTimeToSeconds(timeOut);
    
    if (inSeconds === null || outSeconds === null) return 0;

    let diffSeconds = outSeconds - inSeconds;
    if (diffSeconds < 0) diffSeconds += 24 * 3600;

    return diffSeconds / 3600;
  },

  calculateRegularHours: (attendanceRecords) => {
    let regularHours = 0;
    attendanceRecords.forEach(record => {
      const hoursWorked = PayrollCalculator.calculateDailyHours(record.timeIn, record.timeOut);
      regularHours += Math.min(hoursWorked, 8);
    });
    return regularHours;
  },

  calculateOvertimeHours: (attendanceRecords) => {
    let overtimeHours = 0;
    attendanceRecords.forEach(record => {
      const hoursWorked = PayrollCalculator.calculateDailyHours(record.timeIn, record.timeOut);
      if (hoursWorked > 8) {
        overtimeHours += hoursWorked - 8;
      }
    });
    return overtimeHours;
  },

  calculateNightDifferentialHours: (attendanceRecords) => {
    let nightHours = 0;
    const nightStart = 22;
    const nightEnd = 6;

    attendanceRecords.forEach(record => {
      if (!record.timeIn || !record.timeOut) return;

      const inSeconds = PayrollCalculator.parseTimeToSeconds(record.timeIn);
      const outSeconds = PayrollCalculator.parseTimeToSeconds(record.timeOut);
      
      if (inSeconds === null || outSeconds === null) return;

      let currentSeconds = inSeconds;
      const endSeconds = outSeconds > inSeconds ? outSeconds : outSeconds + 24 * 3600;

      while (currentSeconds < endSeconds) {
        const hour = Math.floor((currentSeconds % (24 * 3600)) / 3600);
        if (hour >= nightStart || hour < nightEnd) {
          nightHours += 1/3600;
        }
        currentSeconds += 1;
      }
    });

    return nightHours;
  },

  calculateBasicPay: (monthlySalary, daysWorked, workingDaysInMonth = 22) => {
    const dailyRate = monthlySalary / workingDaysInMonth;
    return dailyRate * daysWorked;
  },

  calculateHourlyRate: (monthlySalary, workingDaysInMonth = 22, hoursPerDay = 8) => {
    return monthlySalary / (workingDaysInMonth * hoursPerDay);
  },

  calculateOTPay: (hourlyRate, overtimeHours) => {
    return overtimeHours * hourlyRate * 1.25;
  },

  calculateNightDiffPay: (hourlyRate, nightHours) => {
    return nightHours * hourlyRate * 0.10;
  },

  calculateGrossPay: (basicPay, otPay, nightDiffPay, allowances = 0) => {
    return basicPay + otPay + nightDiffPay + allowances;
  },

  calculateSSS: (grossPay) => {
    return grossPay * 0.05;
  },

  calculatePhilHealth: (grossPay) => {
    return grossPay * 0.025;
  },

  calculatePagIBIG: (grossPay) => {
    if (grossPay <= 1500) return grossPay * 0.01;
    if (grossPay <= 5000) return grossPay * 0.02;
    return 100;
  },

  calculateWithholdingTax: (grossPay) => {
    if (grossPay <= 20833) return 0;
    if (grossPay <= 33332) return (grossPay - 20833) * 0.15;
    if (grossPay <= 66666) return 1875 + (grossPay - 33332) * 0.20;
    if (grossPay <= 166666) return 8541.80 + (grossPay - 66666) * 0.25;
    if (grossPay <= 666666) return 33541.80 + (grossPay - 166666) * 0.30;
    return 183541.80 + (grossPay - 666666) * 0.35;
  }
};

// ===================================================
// MAIN APPLICATION
// ===================================================
document.addEventListener("DOMContentLoaded", () => {
  const periodSelect = document.getElementById("periodSelect");
  const tableBody = document.querySelector(".payroll-table tbody");
  const detailsModal = document.getElementById("detailsModal");
  const closeDetailsModal = document.getElementById("closeDetailsModal");
  const closeDetailsBtn = document.getElementById("closeDetailsBtn");
<<<<<<< HEAD
  const printReceiptBtn = document.getElementById("printReceiptBtn");

  // Hide the "+ Process Payroll" button
  const processBtn = document.getElementById("processBtn");
  if (processBtn) {
    processBtn.style.display = "none";
  }
=======
>>>>>>> 8b8df163618e8317ad8cd8d5a93505f44b92961a

  let payrollRecords = JSON.parse(localStorage.getItem("payrollRecords")) || [];
  let selectedPeriod = getCurrentPeriod();

  // ===================================================
<<<<<<< HEAD
  // GET CURRENT PERIOD (Current Month)
  // ===================================================
  function getCurrentPeriod() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const firstDay = `${year}-${month}-01`;
    const lastDay = new Date(year, now.getMonth() + 1, 0);
    const lastDayStr = `${year}-${month}-${String(lastDay.getDate()).padStart(2, '0')}`;
    
    return { start: firstDay, end: lastDayStr };
=======
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
>>>>>>> 8b8df163618e8317ad8cd8d5a93505f44b92961a
  }

  // ===================================================
  // GET DATA
  // ===================================================
  function getAllEmployees() {
    return JSON.parse(localStorage.getItem("employees")) || [];
  }

  function getAttendanceRecords(employeeId, periodStart, periodEnd) {
    const allAttendance = JSON.parse(localStorage.getItem("attendance_records")) || [];
    
    return allAttendance.filter(record => {
      const recordDate = new Date(record.date);
      const startDate = new Date(periodStart);
      const endDate = new Date(periodEnd);
      
      return record.id === employeeId && 
             recordDate >= startDate && 
             recordDate <= endDate &&
             record.timeOut !== null &&
             record.timeOut !== "--";
    });
  }

  function getProcessedPayroll(employeeId, period) {
    return payrollRecords.find(p => 
      p.employeeNo === employeeId && 
      p.period === period
    );
  }

  // ===================================================
  // CALCULATE PAYROLL FOR EMPLOYEE
  // ===================================================
  function calculateEmployeePayroll(employee, periodStart, periodEnd) {
    const attendanceRecords = getAttendanceRecords(employee.empId, periodStart, periodEnd);
    const monthlySalary = parseFloat(employee.basicSalary) || parseFloat(employee.monthlySalary) || 17000;

    if (attendanceRecords.length === 0) {
      return null; // No attendance data
    }

    const daysWorked = attendanceRecords.length;
    const regularHours = PayrollCalculator.calculateRegularHours(attendanceRecords);
    const overtimeHours = PayrollCalculator.calculateOvertimeHours(attendanceRecords);
    const nightDiffHours = PayrollCalculator.calculateNightDifferentialHours(attendanceRecords);

    const hourlyRate = PayrollCalculator.calculateHourlyRate(monthlySalary);
    const basicPay = PayrollCalculator.calculateBasicPay(monthlySalary, daysWorked);
    const otPay = PayrollCalculator.calculateOTPay(hourlyRate, overtimeHours);
    const nightDiffPay = PayrollCalculator.calculateNightDiffPay(hourlyRate, nightDiffHours);

    const grossPay = PayrollCalculator.calculateGrossPay(basicPay, otPay, nightDiffPay);

    const sss = PayrollCalculator.calculateSSS(grossPay);
    const philHealth = PayrollCalculator.calculatePhilHealth(grossPay);
    const pagibig = PayrollCalculator.calculatePagIBIG(grossPay);
    const wtax = PayrollCalculator.calculateWithholdingTax(grossPay);

    const totalDeductions = sss + philHealth + pagibig + wtax;
    const netPay = grossPay - totalDeductions;

    return {
      daysWorked,
      regularHours: regularHours.toFixed(2),
      overtimeHours: overtimeHours.toFixed(2),
      nightDiffHours: nightDiffHours.toFixed(2),
      basicPay,
      otPay,
      nightDiffPay,
      grossPay,
      sss,
      philHealth,
      pagibig,
      wtax,
      totalDeductions,
      netPay
    };
  }

  // ===================================================
  // RENDER TABLE
  // ===================================================
  function renderEmployeeTable() {
    const employees = getAllEmployees();
    
    if (employees.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" class="empty">No employees found</td></tr>`;
      updateSummaryCards();
      return;
    }

    const periodKey = `${selectedPeriod.start} → ${selectedPeriod.end}`;

    tableBody.innerHTML = employees.map(emp => {
      const processed = getProcessedPayroll(emp.empId, periodKey);
      const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();

      if (processed) {
        // Already processed - show View/Delete
        return `
          <tr>
            <td>${emp.empId}</td>
            <td>${fullName}</td>
            <td>${emp.position || 'N/A'}</td>
            <td>${emp.empStatus || 'N/A'}</td>
            <td>${periodKey}</td>
            <td>₱${processed.grossPay.toLocaleString("en-PH", {minimumFractionDigits:2})}</td>
            <td>₱${processed.totalDeductions.toLocaleString("en-PH", {minimumFractionDigits:2})}</td>
            <td>₱${processed.netPay.toLocaleString("en-PH", {minimumFractionDigits:2})}</td>
            <td>
              <div class="action-buttons">
                <button class="view-btn" onclick="showPayrollDetails(${processed.id})">👁 View</button>
                <button class="delete-btn" onclick="deletePayroll(${processed.id})">🗑 Delete</button>
              </div>
            </td>
          </tr>
        `;
      } else {
        // Not processed yet - show Process button
        return `
          <tr>
            <td>${emp.empId}</td>
            <td>${fullName}</td>
            <td>${emp.position || 'N/A'}</td>
            <td>${emp.empStatus || 'N/A'}</td>
            <td>${periodKey}</td>
            <td class="empty">—</td>
            <td class="empty">—</td>
            <td class="empty">—</td>
            <td>
              <button 
                class="btn-green" 
                onclick="processEmployeePayroll('${emp.empId}')"
                style="padding:6px 12px;font-size:13px;"
              >
                💼 Process Payroll
              </button>
            </td>
          </tr>
        `;
      }
    }).join("");

    updateSummaryCards();
  }

  // ===================================================
  // PROCESS PAYROLL FOR EMPLOYEE
  // ===================================================
  window.processEmployeePayroll = function(empId) {
    const employees = getAllEmployees();
    const employee = employees.find(e => e.empId === empId);

    if (!employee) {
      alert("❌ Employee not found!");
      return;
    }

    const calculation = calculateEmployeePayroll(employee, selectedPeriod.start, selectedPeriod.end);

    if (!calculation) {
      alert(`⚠️ No attendance records found for ${employee.firstName} ${employee.lastName} in this period.`);
      return;
    }

    // Show confirmation
    const confirmMsg = `📊 PAYROLL SUMMARY for ${employee.firstName} ${employee.lastName}\n\n` +
          `Period: ${selectedPeriod.start} to ${selectedPeriod.end}\n` +
          `Days Worked: ${calculation.daysWorked}\n` +
          `Regular Hours: ${calculation.regularHours} hrs\n` +
          `Overtime: ${calculation.overtimeHours} hrs\n` +
          `Night Diff: ${calculation.nightDiffHours} hrs\n\n` +
          `💰 GROSS PAY: ₱${calculation.grossPay.toLocaleString('en-PH', {minimumFractionDigits:2})}\n` +
          `📉 DEDUCTIONS: ₱${calculation.totalDeductions.toLocaleString('en-PH', {minimumFractionDigits:2})}\n` +
          `💵 NET PAY: ₱${calculation.netPay.toLocaleString('en-PH', {minimumFractionDigits:2})}\n\n` +
          `Process this payroll?`;

    if (!confirm(confirmMsg)) return;

    // Save payroll record
    const newRecord = {
      id: Date.now(),
      employeeNo: employee.empId,
      employeeStatus: employee.empStatus || 'Regular',
      employeePosition: employee.position || 'N/A',
      employee: `${employee.firstName} ${employee.lastName}`,
      period: `${selectedPeriod.start} → ${selectedPeriod.end}`,
      daysWorked: calculation.daysWorked,
      regularHours: calculation.regularHours,
      overtimeHours: calculation.overtimeHours,
      nightDiffHours: calculation.nightDiffHours,
      basicSalary: calculation.basicPay,
      otPay: calculation.otPay,
      nightDiffPay: calculation.nightDiffPay,
      grossPay: calculation.grossPay,
      sss: calculation.sss,
      philHealth: calculation.philHealth,
      pagibig: calculation.pagibig,
      withholdingTax: calculation.wtax,
      totalDeductions: calculation.totalDeductions,
      netPay: calculation.netPay,
      status: "Processed",
      processedDate: new Date().toLocaleDateString()
    };

    payrollRecords.push(newRecord);
    localStorage.setItem("payrollRecords", JSON.stringify(payrollRecords));

    alert("✅ Payroll processed successfully!");
    renderEmployeeTable();
  };

  // ===================================================
<<<<<<< HEAD
  // DELETE PAYROLL
=======
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
>>>>>>> 8b8df163618e8317ad8cd8d5a93505f44b92961a
  // ===================================================
  window.deletePayroll = function(id) {
    if (!confirm("Are you sure you want to delete this payroll record?")) return;

    payrollRecords = payrollRecords.filter(p => p.id !== id);
    localStorage.setItem("payrollRecords", JSON.stringify(payrollRecords));

    alert("✅ Payroll record deleted!");
    renderEmployeeTable();
  };

  // ===================================================
  // VIEW PAYROLL DETAILS
  // ===================================================
  window.showPayrollDetails = function(id) {
    const p = payrollRecords.find(x => x.id === id);
    if (!p) return;

    document.getElementById("detailsContent").innerHTML = `
      <div class="detail-row"><strong>Employee No:</strong> <span>${p.employeeNo}</span></div>
      <div class="detail-row"><strong>Name:</strong> <span>${p.employee}</span></div>
      <div class="detail-row"><strong>Position:</strong> <span>${p.employeePosition}</span></div>
      <div class="detail-row"><strong>Status:</strong> <span>${p.employeeStatus}</span></div>
      <div class="detail-row"><strong>Period:</strong> <span>${p.period}</span></div>
      <div class="detail-row"><strong>Processed Date:</strong> <span>${p.processedDate}</span></div>
      <hr>
      <div class="detail-row"><strong>Days Worked:</strong> ${p.daysWorked}</div>
      <div class="detail-row"><strong>Regular Hours:</strong> ${p.regularHours} hrs</div>
      <div class="detail-row"><strong>Overtime Hours:</strong> ${p.overtimeHours} hrs</div>
      <div class="detail-row"><strong>Night Diff Hours:</strong> ${p.nightDiffHours} hrs</div>
      <hr>
      <div class="detail-row"><strong>Basic Pay:</strong> ₱${p.basicSalary.toLocaleString("en-PH",{minimumFractionDigits:2})}</div>
      <div class="detail-row"><strong>Overtime Pay:</strong> ₱${p.otPay.toLocaleString("en-PH",{minimumFractionDigits:2})}</div>
      <div class="detail-row"><strong>Night Differential:</strong> ₱${p.nightDiffPay.toLocaleString("en-PH",{minimumFractionDigits:2})}</div>
      <hr>
      <div class="detail-row"><strong>GROSS PAY:</strong> <strong>₱${p.grossPay.toLocaleString("en-PH",{minimumFractionDigits:2})}</strong></div>
      <hr>
      <div class="detail-row"><strong>SSS (5%):</strong> ₱${p.sss.toLocaleString("en-PH",{minimumFractionDigits:2})}</div>
      <div class="detail-row"><strong>PhilHealth (2.5%):</strong> ₱${p.philHealth.toLocaleString("en-PH",{minimumFractionDigits:2})}</div>
      <div class="detail-row"><strong>Pag-IBIG:</strong> ₱${p.pagibig.toLocaleString("en-PH",{minimumFractionDigits:2})}</div>
      <div class="detail-row"><strong>Withholding Tax:</strong> ₱${p.withholdingTax.toLocaleString("en-PH",{minimumFractionDigits:2})}</div>
      <div class="detail-row"><strong>Total Deductions:</strong> ₱${p.totalDeductions.toLocaleString("en-PH",{minimumFractionDigits:2})}</div>
      <hr>
      <div class="detail-row"><strong>NET PAY:</strong> <span style="color:green;font-weight:bold;font-size:1.3em">₱${p.netPay.toLocaleString("en-PH",{minimumFractionDigits:2})}</span></div>
    `;
    detailsModal.style.display = "flex";
  };

  // ===================================================
<<<<<<< HEAD
  // MODAL CONTROLS
  // ===================================================
  closeDetailsModal?.addEventListener("click", () => detailsModal.style.display = "none");
  closeDetailsBtn?.addEventListener("click", () => detailsModal.style.display = "none");

  window.addEventListener("click", (e) => {
    if (e.target === detailsModal) detailsModal.style.display = "none";
  });

  printReceiptBtn?.addEventListener("click", () => window.print());

  // ===================================================
=======
>>>>>>> 8b8df163618e8317ad8cd8d5a93505f44b92961a
  // SUMMARY CARDS
  // ===================================================
  function updateSummaryCards() {
    let totalPayroll = 0;
    let totalDeductions = 0;
    let processedCount = 0;

    const periodKey = `${selectedPeriod.start} → ${selectedPeriod.end}`;

    payrollRecords.forEach(p => {
      if (p.period === periodKey) {
        totalPayroll += p.grossPay;
        totalDeductions += p.totalDeductions;
        processedCount++;
      }
    });

    if (document.getElementById("totalPayroll")) {
      document.getElementById("totalPayroll").textContent = "₱" + totalPayroll.toLocaleString("en-PH", { minimumFractionDigits: 2 });
    }
    if (document.getElementById("totalDeductions")) {
      document.getElementById("totalDeductions").textContent = "₱" + totalDeductions.toLocaleString("en-PH", { minimumFractionDigits: 2 });
    }
    if (document.getElementById("processedCount")) {
      document.getElementById("processedCount").textContent = processedCount;
    }
  }

<<<<<<< HEAD
  // ===================================================
  // PERIOD FILTER (Optional Enhancement)
  // ===================================================
  if (periodSelect) {
    periodSelect.addEventListener("change", (e) => {
      if (e.target.value !== "All Periods") {
        // You can add period filtering logic here
        // For now, it shows current month by default
      }
      renderEmployeeTable();
    });
  }

  // ===================================================
  // INITIALIZE
  // ===================================================
  renderEmployeeTable();
});
=======
  renderPayroll();
  updateSummaryCards();
});
>>>>>>> 8b8df163618e8317ad8cd8d5a93505f44b92961a
