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
  window.processEmployeePayroll = async function(employeeUUID) {
    const employees = await fetchAllEmployees();
    const employee = employees.find(e => e.id === employeeUUID);
    
    if (!employee) {
      alert("❌ Employee not found!");
      return;
    }

    console.log("🔍 DEBUGGING PAYROLL PROCESS:");
    console.log("Employee Object:", employee);
    console.log("Employee UUID:", employee.id);
    console.log("Employee Number:", employee.employee_id);

    const period = selectedPeriod;
    console.log("Period:", period);

    // Check if already processed
    const already = await fetchPayrollForEmployeeAndPeriod(employee.id, period);
    if (already) {
      alert("⚠️ Payroll already processed for this employee in this period.");
      return;
    }

    // Calculate payroll (will work even with 0 attendance)
    const calculation = await calculateEmployeePayroll(employee, period.start, period.end);

    if (!calculation) {
      alert(`❌ Error calculating payroll for ${employee.first_name} ${employee.last_name}.`);
      return;
    }

    console.log("💰 Calculation Result:", calculation);

    // Show confirmation with attendance warning if needed
    let confirmMsg = 
      `📊 PAYROLL SUMMARY\n\n` +
      `Employee ID: ${employee.employee_id}\n` +
      `Employee Name: ${employee.first_name} ${employee.last_name}\n\n` +
      `Period: ${period.start} to ${period.end}\n` +
      `Days Present: ${calculation.daysWorked} days\n` +
      `Daily Rate: ₱${calculation.dailyRate.toLocaleString('en-PH', {minimumFractionDigits: 2})}\n\n`;

    if (calculation.daysWorked === 0) {
      confirmMsg += `⚠️ WARNING: No attendance records found!\n`;
      confirmMsg += `This will result in ZERO pay.\n\n`;
    }

    confirmMsg +=
      `💰 GROSS PAY: ₱${calculation.grossPay.toLocaleString('en-PH', {minimumFractionDigits: 2})}\n` +
      `📉 DEDUCTIONS: ₱${calculation.totalDeductions.toLocaleString('en-PH', {minimumFractionDigits: 2})}\n` +
      `   • SSS: ₱${calculation.sss.toLocaleString('en-PH', {minimumFractionDigits: 2})}\n` +
      `   • PhilHealth: ₱${calculation.philHealth.toLocaleString('en-PH', {minimumFractionDigits: 2})}\n` +
      `   • Pag-IBIG: ₱${calculation.pagibig.toLocaleString('en-PH', {minimumFractionDigits: 2})}\n` +
      `   • Tax: ₱${calculation.wtax.toLocaleString('en-PH', {minimumFractionDigits: 2})}\n` +
      `💵 NET PAY: ₱${calculation.netPay.toLocaleString('en-PH', {minimumFractionDigits: 2})}\n\n` +
      `Process this payroll?`;

    if (!confirm(confirmMsg)) return;

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
      alert("✅ Payroll processed successfully!");
      await fetchAllPayrollRecords();
      await renderEmployeeTable();
    }
  };

  // ==================== DELETE PAYROLL ====================
  window.deletePayroll = async function(id) {
    if (!confirm("⚠️ Are you sure you want to delete this payroll record?")) return;
    
    const ok = await deletePayrollRecord(id);
    if (ok) {
      alert("✅ Payroll record deleted!");
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