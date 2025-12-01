// ===================================================
// ATTENDANCE-BASED PAYROLL SYSTEM - FIXED VERSION
// Calculates payroll based on days present (not hours)
// ===================================================

document.addEventListener("DOMContentLoaded", () => {
  if (!window.supabaseClient) {
    console.error("❌ Supabase client not found. Load supabase-config.js first.");
    return;
  }
  const supabase = window.supabaseClient;

    const welcomeText = document.getElementById('welcomeText');
  const userEmailDisplay = document.getElementById('userEmailDisplay');
  
  const loggedInUserString = localStorage.getItem('loggedInUser');
  if (loggedInUserString) {
    try {
      const loggedInUser = JSON.parse(loggedInUserString);
      const displayName = loggedInUser.email || loggedInUser.first_name || loggedInUser.username || 'User';
      
      if (welcomeText) {
        welcomeText.textContent = `Welcome, ${displayName}`;
      }
      if (userEmailDisplay) {
        userEmailDisplay.textContent = displayName;
      }
      
      console.log("👤 Logged in user:", loggedInUser);
    } catch (e) {
      console.error("Error parsing logged in user:", e);
      if (welcomeText) welcomeText.textContent = "Welcome, User";
    }
  } else {
    console.warn("⚠️ No logged in user found in localStorage");
    if (welcomeText) welcomeText.textContent = "Welcome, Guest";
  }

  // ==================== UI ELEMENTS ====================
  const periodSelect = document.getElementById("periodSelect");
  const tableBody = document.querySelector(".payroll-table tbody");
  const detailsModal = document.getElementById("detailsModal");
  const detailsContent = document.getElementById("detailsContent");
  const closeDetailsModal = document.getElementById("closeDetailsModal");
  const closeDetailsBtn = document.getElementById("closeDetailsBtn");
  const printReceiptBtn = document.getElementById("printReceiptBtn");
  const processBtn = document.getElementById("processBtn");

  // Hide the top "Process Payroll" button
  if (processBtn) processBtn.style.display = "none";

  // ==================== STATE ====================
  let payrollRecords = [];
  let selectedPeriod = getCurrentPeriod();

  // ==================== SIMPLIFIED PAYROLL CALCULATOR ====================
  const PayrollCalculator = {
    // Calculate basic pay based on days worked
    calculateBasicPay: (monthlySalary, daysWorked, workingDaysInMonth = 22) => {
      const dailyRate = monthlySalary / workingDaysInMonth;
      return dailyRate * daysWorked;
    },

    // Calculate daily rate
    calculateDailyRate: (monthlySalary, workingDaysInMonth = 22) => {
      return monthlySalary / workingDaysInMonth;
    },

    // Philippine Deductions
    calculateSSS: (grossPay) => {
      // Simplified SSS calculation - 5% of gross
      return grossPay * 0.05;
    },

    calculatePhilHealth: (grossPay) => {
      // PhilHealth - 2.5% of gross (employee share)
      return grossPay * 0.025;
    },

    calculatePagIBIG: (grossPay) => {
      // Pag-IBIG contribution
      if (grossPay <= 1500) return grossPay * 0.01;
      if (grossPay <= 5000) return grossPay * 0.02;
      return 100; // Maximum Pag-IBIG
    },

    calculateWithholdingTax: (grossPay) => {
      // Simplified withholding tax (monthly basis)
      if (grossPay <= 20833) return 0;
      if (grossPay <= 33332) return (grossPay - 20833) * 0.15;
      if (grossPay <= 66666) return 1875 + (grossPay - 33332) * 0.20;
      if (grossPay <= 166666) return 8541.80 + (grossPay - 66666) * 0.25;
      if (grossPay <= 666666) return 33541.80 + (grossPay - 166666) * 0.30;
      return 183541.80 + (grossPay - 666666) * 0.35;
    }
  };
  

// ==================== CUSTOM MODAL FUNCTIONS ====================

// Show Payroll Confirmation Modal
function showPayrollConfirmation(data) {
  const modal = document.getElementById('confirmPayrollModal');
  const content = document.getElementById('confirmPayrollContent');
  
  content.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h3 style="color: #111827; font-size: 18px; font-weight: 600; margin-bottom: 15px;">
        Process Payroll for ${data.employeeName}?
      </h3>
    </div>
    
    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
      <div class="detail-row">
        <span class="detail-label">Employee No:</span>
        <span class="detail-value">${data.employeeNo}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Period:</span>
        <span class="detail-value">${data.periodStart} to ${data.periodEnd}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Days Worked:</span>
        <span class="detail-value">${data.daysWorked} days</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Daily Rate:</span>
        <span class="detail-value">₱${data.dailyRate.toLocaleString("en-PH", {minimumFractionDigits: 2})}</span>
      </div>
    </div>
    
    <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 2px solid #22c55e;">
      <div class="detail-row">
        <span class="detail-label">Gross Pay:</span>
        <span class="detail-value">₱${data.grossPay.toLocaleString("en-PH", {minimumFractionDigits: 2})}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label" style="font-size: 12px;">SSS:</span>
        <span class="detail-value" style="font-size: 12px;">₱${data.sss.toLocaleString("en-PH", {minimumFractionDigits: 2})}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label" style="font-size: 12px;">PhilHealth:</span>
        <span class="detail-value" style="font-size: 12px;">₱${data.philHealth.toLocaleString("en-PH", {minimumFractionDigits: 2})}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label" style="font-size: 12px;">Pag-IBIG:</span>
        <span class="detail-value" style="font-size: 12px;">₱${data.pagibig.toLocaleString("en-PH", {minimumFractionDigits: 2})}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label" style="font-size: 12px;">Withholding Tax:</span>
        <span class="detail-value" style="font-size: 12px;">₱${data.wtax.toLocaleString("en-PH", {minimumFractionDigits: 2})}</span>
      </div>
      <div class="detail-row" style="border-top: 2px solid #22c55e; padding-top: 10px; margin-top: 10px;">
        <span class="detail-label">Total Deductions:</span>
        <span class="detail-value">₱${data.totalDeductions.toLocaleString("en-PH", {minimumFractionDigits: 2})}</span>
      </div>
      <div class="detail-row" style="border-top: none; font-size: 18px; color: #16a34a; font-weight: 700;">
        <span class="detail-label">NET PAY:</span>
        <span class="detail-value">₱${data.netPay.toLocaleString("en-PH", {minimumFractionDigits: 2})}</span>
      </div>
    </div>
  `;
  
  modal.classList.add('show');
  
  // Set up button handlers
  const proceedBtn = document.getElementById('proceedPayrollBtn');
  const cancelBtn = document.getElementById('cancelConfirmBtn');
  const closeBtn = document.getElementById('closeConfirmModal');
  
  const confirmHandler = (e) => {
    e.preventDefault();
    modal.classList.remove('show');
    if (window.confirmPayrollCallback) {
      window.confirmPayrollCallback();
    }
  };
  
  const cancelHandler = (e) => {
    e.preventDefault();
    modal.classList.remove('show');
    if (window.confirmPayrollCancelCallback) {
      window.confirmPayrollCancelCallback();
    }
  };
  
  if (proceedBtn) proceedBtn.onclick = confirmHandler;
  if (cancelBtn) cancelBtn.onclick = cancelHandler;
  if (closeBtn) closeBtn.onclick = cancelHandler;
}
// Show Success Message
function showSuccess(message) {
  const modal = document.getElementById('successModal');
  document.getElementById('successMessage').textContent = message;
  modal.classList.add('show');
  
  const close = () => modal.classList.remove('show');
  document.getElementById('successOkBtn').onclick = close;
  document.getElementById('closeSuccessModal').onclick = close;
}

// Show Error Message
function showError(message) {
  const modal = document.getElementById('errorModal');
  document.getElementById('errorMessage').textContent = message;
  modal.classList.add('show');
  
  const close = () => modal.classList.remove('show');
  document.getElementById('errorOkBtn').onclick = close;
  document.getElementById('closeErrorModal').onclick = close;
}

/// Show Warning Message
function showWarning(message) {
  const modal = document.getElementById('warningModal');
  document.getElementById('warningMessage').textContent = message;
  modal.classList.add('show');
  
  const close = () => modal.classList.remove('show');
  document.getElementById('warningOkBtn').onclick = close;
  document.getElementById('closeWarningModal').onclick = close;
}

// Show Delete Confirmation
function showDeleteConfirmation() {
  return new Promise((resolve) => {
    const modal = document.getElementById('deleteConfirmModal');
    if (!modal) {
      // Fallback to browser confirm if modal doesn't exist
      resolve(confirm('Are you sure you want to delete this payroll record?'));
      return;
    }
    
    modal.classList.add('show');
    
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const cancelBtn = document.getElementById('cancelDeleteBtn');
    const closeBtn = document.getElementById('closeDeleteModal');
    
    const handleConfirm = () => {
      modal.classList.remove('show');
      resolve(true);
    };
    
    const handleCancel = () => {
      modal.classList.remove('show');
      resolve(false);
    };
    
    if (confirmBtn) confirmBtn.onclick = handleConfirm;
    if (cancelBtn) cancelBtn.onclick = handleCancel;
    if (closeBtn) closeBtn.onclick = handleCancel;
  });
}
  // ==================== PERIOD UTILITIES ====================
  function getCurrentPeriod() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const firstDay = `${year}-${month}-01`;
    const lastDay = new Date(year, now.getMonth() + 1, 0);
    const lastDayStr = `${year}-${month}-${String(lastDay.getDate()).padStart(2, "0")}`;
    return { start: firstDay, end: lastDayStr };
  }

  function getPeriodFor(year, month) {
    const monthStr = String(month).padStart(2, "0");
    const firstDay = `${year}-${monthStr}-01`;
    const lastDay = new Date(year, month, 0);
    const lastDayStr = `${year}-${monthStr}-${String(lastDay.getDate()).padStart(2, "0")}`;
    return { start: firstDay, end: lastDayStr };
  }

  function periodKeyFor(period) {
    return `${period.start} → ${period.end}`;
  }

  // ==================== DATABASE QUERIES ====================
  
  async function fetchAllEmployees() {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*");
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("❌ Error fetching employees:", err);
      return [];
    }
  }

  // ✅ FIXED: Fetch attendance records for specific employee and period
  async function fetchAttendanceForEmployee(employeeId, startDate, endDate) {
    try {
      console.log(`🔍 Fetching attendance for employee ${employeeId} from ${startDate} to ${endDate}`);
      
      const { data, error } = await supabase
        .from('attendance')
        .select('id, employee_id, date, time_in, time_out')
        .eq('employee_id', employeeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) {
        console.error('Attendance query error:', error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} attendance records`);
      return data || [];
      
    } catch (error) {
      console.error('Error in fetchAttendanceForEmployee:', error);
      return [];
    }
  }

  async function fetchPayrollForEmployeeAndPeriod(employeeUUID, period) {
    try {
      const { data, error } = await supabase
        .from("payroll")
        .select("*")
        .eq("employee_id", employeeUUID)
        .eq("pay_period_start", period.start)
        .eq("pay_period_end", period.end)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    } catch (err) {
      console.error("❌ Error fetching payroll:", err);
      return null;
    }
  }

  async function fetchAllPayrollRecords() {
    try {
      const { data, error } = await supabase
        .from("payroll")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      payrollRecords = data || [];
      return payrollRecords;
    } catch (err) {
      console.error("❌ Error fetching payroll records:", err);
      payrollRecords = [];
      return [];
    }
  }

  async function savePayrollRecord(record) {
    try {
      const { data, error } = await supabase
        .from("payroll")
        .insert([record])
        .select()
        .single();

      if (error) throw error;
      payrollRecords.push(data);
      return data;
    } catch (err) {
      console.error("❌ Error saving payroll:", err);
      alert("❌ Error saving payroll: " + (err.message || err));
      return null;
    }
  }

  async function deletePayrollRecord(id) {
    try {
      const { error } = await supabase
        .from("payroll")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      payrollRecords = payrollRecords.filter(p => p.id !== id);
      return true;
    } catch (err) {
      console.error("❌ Error deleting payroll:", err);
      alert("❌ Error deleting payroll: " + (err.message || err));
      return false;
    }
  }

  // ==================== SIMPLIFIED PAYROLL CALCULATION ====================
  async function calculateEmployeePayroll(employee, periodStart, periodEnd) {
    if (!employee || !employee.employee_id) return null;

    // Fetch attendance using employee_id (not UUID)
    const attendanceRecords = await fetchAttendanceForEmployee(
      employee.employee_id, 
      periodStart, 
      periodEnd
    );
    
    const monthlySalary = parseFloat(employee.salary) || 17000;

    console.log(`💰 Calculating payroll for ${employee.employee_id}:`, {
      attendanceRecords: attendanceRecords.length,
      monthlySalary,
      period: `${periodStart} to ${periodEnd}`
    });

    // Count days worked (unique dates with attendance)
    const uniqueDates = new Set(attendanceRecords.map(r => r.date));
    const daysWorked = uniqueDates.size;
    
    // Calculate pay based on daily rate × days present
    const basicPay = PayrollCalculator.calculateBasicPay(monthlySalary, daysWorked);
    const grossPay = basicPay;

    // Calculate deductions
    const sss = PayrollCalculator.calculateSSS(grossPay);
    const philHealth = PayrollCalculator.calculatePhilHealth(grossPay);
    const pagibig = PayrollCalculator.calculatePagIBIG(grossPay);
    const wtax = PayrollCalculator.calculateWithholdingTax(grossPay);

    const totalDeductions = sss + philHealth + pagibig + wtax;
    const netPay = grossPay - totalDeductions;

    return {
      daysWorked,
      dailyRate: Number(PayrollCalculator.calculateDailyRate(monthlySalary).toFixed(2)),
      basicPay: Number(basicPay.toFixed(2)),
      grossPay: Number(grossPay.toFixed(2)),
      sss: Number(sss.toFixed(2)),
      philHealth: Number(philHealth.toFixed(2)),
      pagibig: Number(pagibig.toFixed(2)),
      wtax: Number(wtax.toFixed(2)),
      totalDeductions: Number(totalDeductions.toFixed(2)),
      netPay: Number(netPay.toFixed(2))
    };
  }

  // ==================== GET POSITION NAME ====================
  async function getPositionName(positionId) {
    if (!positionId) return "N/A";
    try {
      const { data, error } = await supabase
        .from("positions")
        .select("position_name")
        .eq("id", positionId)
        .single();
      
      if (error) return "N/A";
      return data?.position_name || "N/A";
    } catch (err) {
      return "N/A";
    }
  }

  // ==================== UI RENDERING ====================
  async function renderEmployeeTable() {
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="9" class="empty">⏳ Loading...</td></tr>';

    const employees = await fetchAllEmployees();
    if (!employees || employees.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" class="empty">No employees found</td></tr>`;
      updateSummaryCards();
      return;
    }

    const period = selectedPeriod;
    const periodLabel = periodKeyFor(period);
    const rows = [];

    await fetchAllPayrollRecords();

    for (const emp of employees) {
      const processed = payrollRecords.find(p => 
        p.employee_id === emp.id && 
        p.pay_period_start === period.start &&
        p.pay_period_end === period.end
      );
      
      const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim();
      const positionName = await getPositionName(emp.position_id);

      if (processed) {
        rows.push(`
          <tr>
            <td>${emp.employee_id || ""}</td>
            <td>${fullName}</td>
            <td>${positionName}</td>
            <td>${emp.employment_status || "N/A"}</td>
            <td>${periodLabel}</td>
            <td>₱${Number(processed.base_pay || 0).toLocaleString("en-PH", {minimumFractionDigits: 2})}</td>
            <td>₱${Number(processed.deductions || 0).toLocaleString("en-PH", {minimumFractionDigits: 2})}</td>
            <td>₱${Number(processed.net_pay || 0).toLocaleString("en-PH", {minimumFractionDigits: 2})}</td>
            <td>
              <div class="action-buttons" style="display:flex;gap:8px;">
                <button class="view-btn" onclick="showPayrollDetails('${processed.id}')" style="padding:6px 12px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;">👁 View</button>
                <button class="delete-btn" onclick="deletePayroll('${processed.id}')" style="padding:6px 12px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer;">🗑 Delete</button>
              </div>
            </td>
          </tr>
        `);
      } else {
        rows.push(`
          <tr>
            <td>${emp.employee_id || ""}</td>
            <td>${fullName}</td>
            <td>${positionName}</td>
            <td>${emp.employment_status || "N/A"}</td>
            <td>${periodLabel}</td>
            <td class="empty">—</td>
            <td class="empty">—</td>
            <td class="empty">—</td>
            <td>
              <button 
                class="btn-green" 
                onclick="processEmployeePayroll('${emp.id}')"
                style="padding: 8px 16px; font-size: 13px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer;"
              >
                💼 Process Payroll
              </button>
            </td>
          </tr>
        `);
      }
    }

    tableBody.innerHTML = rows.join("");
    updateSummaryCards();
  }

  // ==================== PROCESS PAYROLL ====================
 // ===================================================
// REPLACE THESE FUNCTIONS IN YOUR payroll.js
// ===================================================

// ==================== PROCESS PAYROLL ====================
window.processEmployeePayroll = async function(employeeUUID) {
  const employees = await fetchAllEmployees();
  const employee = employees.find(e => e.id === employeeUUID);
  
  if (!employee) {
    showError("Employee not found!");
    return;
  }

  const period = selectedPeriod;

  // Check if already processed
  const already = await fetchPayrollForEmployeeAndPeriod(employee.id, period);
  if (already) {
    showWarning("Payroll already processed for this employee in this period.");
    return;
  }

  // Calculate payroll
  const calculation = await calculateEmployeePayroll(employee, period.start, period.end);

  if (!calculation) {
    showError(`Error calculating payroll for ${employee.first_name} ${employee.last_name}.`);
    return;
  }

  // Show custom confirmation modal with payroll details
  const confirmed = await new Promise((resolve) => {
    // Set callback FIRST before showing modal
    window.confirmPayrollCallback = () => {
      resolve(true);
    };
    
    // Then show the modal (which will attach the handlers)
    showPayrollConfirmation({
      employeeNo: employee.employee_id,
      employeeName: `${employee.first_name} ${employee.last_name}`,
      periodStart: period.start,
      periodEnd: period.end,
      daysWorked: calculation.daysWorked,
      dailyRate: calculation.dailyRate,
      grossPay: calculation.grossPay,
      sss: calculation.sss,
      philHealth: calculation.philHealth,
      pagibig: calculation.pagibig,
      wtax: calculation.wtax,
      totalDeductions: calculation.totalDeductions,
      netPay: calculation.netPay
    });
    
    // The cancel handlers are now set inside showPayrollConfirmation
    // So we also need to handle rejection here
    const modal = document.getElementById('confirmPayrollModal');
    const cancelHandler = () => {
      modal.classList.remove('show');
      resolve(false);
    };
    
    // Store cancel handler reference
    window.confirmPayrollCancelCallback = cancelHandler;
  });

  if (!confirmed) return;

  // Save to database
  const newRecord = {
    employee_id: employee.id,
    pay_period_start: period.start,
    pay_period_end: period.end,
    base_pay: calculation.grossPay,
    overtime_pay: 0,
    bonus: 0,
    deductions: calculation.totalDeductions,
    tax: calculation.wtax,
    net_pay: calculation.netPay,
    payment_date: new Date().toISOString().split("T")[0],
    status: "Processed",
    created_at: new Date().toISOString()
  };

  const saved = await savePayrollRecord(newRecord);
  if (saved) {
    showSuccess("✅ Payroll processed successfully!");
    await fetchAllPayrollRecords();
    await renderEmployeeTable();
  }
};
// ==================== DELETE PAYROLL ====================
window.deletePayroll = async function(id) {
  const confirmed = await showDeleteConfirmation();
  if (!confirmed) return;
  
  const ok = await deletePayrollRecord(id);
  if (ok) {
    showSuccess("✅ Payroll record deleted successfully!");
    await renderEmployeeTable();
  }
};

  // ==================== VIEW DETAILS ====================
  window.showPayrollDetails = async function(id) {
    const p = payrollRecords.find(x => x.id === id);
    if (!p || !detailsModal || !detailsContent) return;

    const employees = await fetchAllEmployees();
    const emp = employees.find(e => e.id === p.employee_id);
    const empName = emp ? `${emp.first_name} ${emp.last_name}` : "N/A";
    const empNo = emp ? emp.employee_id : "N/A";

    // Fetch attendance to get days worked
    const attendanceRecords = await fetchAttendanceForEmployee(
      empNo,
      p.pay_period_start, 
      p.pay_period_end
    );
    const uniqueDates = new Set(attendanceRecords.map(r => r.date));
    const daysWorked = uniqueDates.size;

    detailsContent.innerHTML = `
      <div style="padding:20px;">
        <div style="margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #e5e7eb;">
          <h3 style="margin:0 0 10px 0;color:#1f2937;">Payroll Receipt</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:14px;">
            <div><strong>Employee No:</strong> ${empNo}</div>
            <div><strong>Employee Name:</strong> ${empName}</div>
            <div><strong>Period:</strong> ${p.pay_period_start} to ${p.pay_period_end}</div>
            <div><strong>Days Worked:</strong> ${daysWorked} days</div>
            <div><strong>Processed Date:</strong> ${p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}</div>
          </div>
        </div>

        <div style="margin-bottom:20px;">
          <h4 style="margin:0 0 10px 0;color:#059669;">Earnings</h4>
          <div style="display:grid;grid-template-columns:1fr auto;gap:8px;font-size:14px;">
            <div>Base Pay (${daysWorked} days):</div>
            <div style="text-align:right;">₱${Number(p.base_pay || 0).toLocaleString("en-PH", {minimumFractionDigits: 2})}</div>
          </div>
        </div>

        <div style="margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #e5e7eb;">
          <h4 style="margin:0 0 10px 0;color:#dc2626;">Deductions</h4>
          <div style="display:grid;grid-template-columns:1fr auto;gap:8px;font-size:14px;">
            <div>Withholding Tax:</div>
            <div style="text-align:right;">₱${Number(p.tax || 0).toLocaleString("en-PH", {minimumFractionDigits: 2})}</div>
            <div><strong>Total Deductions:</strong></div>
            <div style="text-align:right;"><strong>₱${Number(p.deductions || 0).toLocaleString("en-PH", {minimumFractionDigits: 2})}</strong></div>
          </div>
        </div>

        <div style="background:#f0fdf4;padding:15px;border-radius:8px;border:2px solid #10b981;">
          <div style="display:grid;grid-template-columns:1fr auto;align-items:center;">
            <div style="font-size:18px;font-weight:bold;color:#065f46;">NET PAY:</div>
            <div style="font-size:24px;font-weight:bold;color:#059669;">₱${Number(p.net_pay || 0).toLocaleString("en-PH", {minimumFractionDigits: 2})}</div>
          </div>
        </div>
      </div>
    `;
    
    detailsModal.style.display = "flex";
  };

  // ==================== MODAL CONTROLS ====================
  closeDetailsModal?.addEventListener("click", () => detailsModal.style.display = "none");
  closeDetailsBtn?.addEventListener("click", () => detailsModal.style.display = "none");
  window.addEventListener("click", (e) => {
    if (e.target === detailsModal) detailsModal.style.display = "none";
  });
  printReceiptBtn?.addEventListener("click", () => window.print());

  // ==================== SUMMARY CARDS ====================
  async function updateSummaryCards() {
    let totalPayroll = 0;
    let totalDeductions = 0;
    let processedCount = 0;
    const period = selectedPeriod;

    payrollRecords.forEach(p => {
      if (p.pay_period_start === period.start && p.pay_period_end === period.end) {
        totalPayroll += Number(p.base_pay || 0);
        totalDeductions += Number(p.deductions || 0);
        processedCount++;
      }
    });

    if (document.getElementById("totalPayroll")) {
      document.getElementById("totalPayroll").textContent = 
        "₱" + totalPayroll.toLocaleString("en-PH", { minimumFractionDigits: 2 });
    }
    if (document.getElementById("totalDeductions")) {
      document.getElementById("totalDeductions").textContent = 
        "₱" + totalDeductions.toLocaleString("en-PH", { minimumFractionDigits: 2 });
    }
    if (document.getElementById("processedCount")) {
      document.getElementById("processedCount").textContent = processedCount;
    }
  }

  // ==================== PERIOD SELECT ====================
  if (periodSelect) {
    const periods = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const period = getPeriodFor(year, month);
      const monthName = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      periods.push({ period, label: monthName });
    }

    periodSelect.innerHTML = periods.map((p, idx) => 
      `<option value="${idx}">${p.label} (${p.period.start} to ${p.period.end})</option>`
    ).join('');

    periodSelect.addEventListener("change", async (e) => {
      const idx = parseInt(e.target.value);
      selectedPeriod = periods[idx].period;
      console.log("Selected period:", selectedPeriod);
      await renderEmployeeTable();
    });

    selectedPeriod = periods[0].period;
  }

  // ==================== INITIALIZATION ====================
  (async function init() {
    console.log("🚀 Initializing attendance-based payroll system...");
    await fetchAllPayrollRecords();
    await renderEmployeeTable();
    console.log("✅ Payroll system ready!");
  })();

  // ==================== REALTIME SUBSCRIPTION ====================
  supabase
    .channel("payroll-changes")
    .on("postgres_changes", { 
      event: "*", 
      schema: "public", 
      table: "payroll" 
    }, async () => {
      console.log("🔄 Payroll data changed, refreshing...");
      await fetchAllPayrollRecords();
      await renderEmployeeTable();
    })
    .subscribe();
});