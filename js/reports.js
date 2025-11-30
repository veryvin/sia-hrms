document.addEventListener("DOMContentLoaded", () => {
<<<<<<< HEAD
    // ===================================================
    // TAB SWITCHING
    // ===================================================
    const tabs = document.querySelectorAll(".tab-btn");
    const contents = document.querySelectorAll(".tab-content");
=======
  // Tab switching
  const tabs = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");
>>>>>>> 8b8df163618e8317ad8cd8d5a93505f44b92961a

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
    });
  });

<<<<<<< HEAD
    // ===================================================
    // GET DATA FROM LOCALSTORAGE
    // ===================================================
    function getEmployees() {
        return JSON.parse(localStorage.getItem('employees')) || [];
    }

    function getAttendanceRecords() {
        return JSON.parse(localStorage.getItem('attendance_records')) || [];
    }

    function getLeaveRequests() {
        return JSON.parse(localStorage.getItem('leaveRequests')) || [];
    }

    function getPayrollRecords() {
        return JSON.parse(localStorage.getItem('payrollRecords')) || [];
    }

    // ===================================================
    // PARSE TIME TO HOURS
    // ===================================================
    function parseTimeToSeconds(timeStr) {
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
    }

    function calculateHours(timeIn, timeOut) {
        if (!timeIn || !timeOut || timeOut === "--") return 0;
        
        const inSeconds = parseTimeToSeconds(timeIn);
        const outSeconds = parseTimeToSeconds(timeOut);
        
        if (inSeconds === null || outSeconds === null) return 0;

        let diffSeconds = outSeconds - inSeconds;
        if (diffSeconds < 0) diffSeconds += 24 * 3600;

        return diffSeconds / 3600;
    }

    // ===================================================
    // PROCESS ATTENDANCE DATA
    // ===================================================
    function processAttendanceData() {
        const employees = getEmployees();
        const attendance = getAttendanceRecords();

        const attendanceByEmployee = {};

        employees.forEach(emp => {
            attendanceByEmployee[emp.empId] = {
                name: `${emp.firstName} ${emp.lastName}`,
                present: 0,
                late: 0,
                absent: 0,
                totalHours: 0
            };
        });

        attendance.forEach(record => {
            if (attendanceByEmployee[record.id]) {
                const empData = attendanceByEmployee[record.id];
                
                if (record.timeOut && record.timeOut !== "--") {
                    empData.present++;
                    
                    const hours = calculateHours(record.timeIn, record.timeOut);
                    empData.totalHours += hours;

                    // Check if late (after 9:00 AM)
                    const nineAM = parseTimeToSeconds("09:00:00 AM");
                    const actualTime = parseTimeToSeconds(record.timeIn);
                    
                    if (actualTime && actualTime > nineAM) {
                        empData.late++;
                    }
                }
            }
        });

        // Calculate absences (days with no attendance)
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const workingDays = Math.floor(daysInMonth * (22/30)); // Approximate working days

        Object.keys(attendanceByEmployee).forEach(empId => {
            const data = attendanceByEmployee[empId];
            data.absent = Math.max(0, workingDays - data.present);
        });

        return attendanceByEmployee;
    }

    // ===================================================
    // SUMMARY TAB - UPDATE KPIs
    // ===================================================
    function updateSummaryKPIs() {
        const employees = getEmployees();
        const payroll = getPayrollRecords();
        const attendance = getAttendanceRecords();

        // Total Employees
        const totalEmployees = employees.length;
        const activeEmployees = employees.filter(e => e.empStatus === 'Regular' || e.empStatus === 'Active').length;

        document.getElementById("summaryTotalEmployees").textContent = totalEmployees;
        document.querySelector("#totalEmployeesCard .sub-text").textContent = `${activeEmployees} Active 📈`;

        // Attendance Rate (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentAttendance = attendance.filter(a => {
            const date = new Date(a.date);
            return date >= thirtyDaysAgo && a.timeOut && a.timeOut !== "--";
        });

        const totalPossibleAttendance = employees.length * 22; // 22 working days per month
        const attendanceRate = totalPossibleAttendance > 0 
            ? Math.round((recentAttendance.length / totalPossibleAttendance) * 100) 
            : 0;

        document.querySelector("#attendanceRateCard .number").textContent = attendanceRate + "%";

        // Total Payroll
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const currentMonthPayroll = payroll.filter(p => p.period.includes(currentMonth));
        
        const totalPayrollAmount = currentMonthPayroll.reduce((sum, p) => sum + (p.grossPay || 0), 0);
        const processedCount = currentMonthPayroll.length;

        document.querySelector("#totalPayrollCard .number").textContent = 
            "₱" + totalPayrollAmount.toLocaleString('en-PH', {minimumFractionDigits: 0});
        document.querySelector("#totalPayrollCard .sub-text").textContent = 
            `${processedCount} processed`;
    }

    // ===================================================
    // SUMMARY TAB - CHARTS
    // ===================================================
    function initializeCharts() {
        const employees = getEmployees();
        
        // Count employees by department
        const deptCount = {};
        employees.forEach(emp => {
            const dept = emp.department || 'Unassigned';
            deptCount[dept] = (deptCount[dept] || 0) + 1;
        });

        const deptLabels = Object.keys(deptCount);
        const deptData = Object.values(deptCount);

        // A. Headcount Bar Chart
        const headcountCtx = document.getElementById('headcountChart')?.getContext('2d');
        if (headcountCtx) {
            new Chart(headcountCtx, {
                type: 'bar',
                data: {
                    labels: deptLabels.length > 0 ? deptLabels : ['No Data'],
                    datasets: [{
                        label: 'Employees',
                        data: deptData.length > 0 ? deptData : [0],
                        backgroundColor: '#10B981',
                        borderRadius: 5,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, display: false },
                        x: { grid: { display: false } }
                    },
                    plugins: { legend: { display: false }, title: { display: false } }
                }
            });
        }
        
        // B. Leave Status Donut Chart
        const leaves = getLeaveRequests();
        const leaveStatusCount = {
            approved: leaves.filter(l => l.status === 'approved').length,
            pending: leaves.filter(l => l.status === 'pending').length,
            rejected: leaves.filter(l => l.status === 'rejected').length
        };

        const leaveCtx = document.getElementById('leaveStatusChart')?.getContext('2d');
        if (leaveCtx) {
            new Chart(leaveCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Approved', 'Pending', 'Rejected'],
                    datasets: [{
                        data: [leaveStatusCount.approved, leaveStatusCount.pending, leaveStatusCount.rejected],
                        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#333', font: { size: 13, weight: '600' } } },
                        title: { display: false }
                    }
                }
            });
        }

        // C. Payroll Role Distribution Donut Chart
        const payroll = getPayrollRecords();
        const roleCount = {};
        
        payroll.forEach(p => {
            const role = p.employeePosition || 'Unassigned';
            roleCount[role] = (roleCount[role] || 0) + 1;
        });

        const roleLabels = Object.keys(roleCount).slice(0, 5); // Top 5 roles
        const roleData = Object.values(roleCount).slice(0, 5);

        const payrollRoleCtx = document.getElementById('payrollRoleChart')?.getContext('2d');
        if (payrollRoleCtx) {
            new Chart(payrollRoleCtx, {
                type: 'doughnut',
                data: {
                    labels: roleLabels.length > 0 ? roleLabels : ['No Data'],
                    datasets: [{
                        data: roleData.length > 0 ? roleData : [1],
                        backgroundColor: ['#8B5CF6', '#1D4ED8', '#059669', '#F59E0B', '#EF4444'],
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#333', font: { size: 13, weight: '600' } } },
                        title: { display: false }
                    }
                }
            });
        }
    }

    // ===================================================
    // ATTENDANCE TAB
    // ===================================================
    function renderAttendanceTable() {
        const attendanceData = processAttendanceData();
        const tbody = document.getElementById("attendanceTable");
        
        let totalPresent = 0, totalLate = 0, totalAbsent = 0;
        
        tbody.innerHTML = '';
        
        const entries = Object.entries(attendanceData);
        
        if (entries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty">No attendance records found</td></tr>';
            document.getElementById("presentCount").textContent = 0;
            document.getElementById("lateCount").textContent = 0;
            document.getElementById("absentCount").textContent = 0;
            document.getElementById("totalCount").textContent = 0;
            return;
        }
        
        entries.forEach(([empId, data]) => {
            totalPresent += data.present;
            totalLate += data.late;
            totalAbsent += data.absent;
            
            tbody.innerHTML += `
                <tr>
                    <td>${data.name}</td>
                    <td>${data.present}</td>
                    <td>${data.late}</td>
                    <td>${data.absent}</td>
                    <td>${data.totalHours.toFixed(2)}</td>
                </tr>`;
        });
        
        document.getElementById("presentCount").textContent = totalPresent;
        document.getElementById("lateCount").textContent = totalLate;
        document.getElementById("absentCount").textContent = totalAbsent;
        document.getElementById("totalCount").textContent = entries.length;
    }

    // ===================================================
    // LEAVE TAB
    // ===================================================
    function renderLeaveTable() {
        const leaves = getLeaveRequests();
        const leaveTable = document.getElementById("leaveTable");
        
        leaveTable.innerHTML = '';
        
        if (leaves.length === 0) {
            leaveTable.innerHTML = '<tr><td colspan="4" class="empty">No leave records found</td></tr>';
            return;
        }
        
        leaves.forEach(l => {
            const startDate = new Date(l.startDate);
            const endDate = new Date(l.endDate);
            const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            
            leaveTable.innerHTML += `
                <tr>
                    <td>${l.employeeName}</td>
                    <td>${l.leaveType}</td>
                    <td><span class="status ${l.status}">${l.status}</span></td>
                    <td>${days} Day${days > 1 ? 's' : ''}</td>
                </tr>`;
        });
    }

    // ===================================================
    // PAYROLL TAB
    // ===================================================
    function renderPayrollTable() {
        const payroll = getPayrollRecords();
        const payrollTable = document.getElementById("payrollTable");
        
        payrollTable.innerHTML = '';
        
        if (payroll.length === 0) {
            payrollTable.innerHTML = '<tr><td colspan="4" class="empty">No payroll records found</td></tr>';
            return;
        }
        
        payroll.forEach(p => {
            payrollTable.innerHTML += `
                <tr>
                    <td>${p.employee}</td>
                    <td>${p.period}</td>
                    <td>₱${p.netPay.toLocaleString('en-PH', {minimumFractionDigits:2})}</td>
                    <td><span class="status ${p.status.toLowerCase()}">${p.status}</span></td>
                </tr>`;
        });
    }

    // ===================================================
    // INITIALIZE ALL TABS
    // ===================================================
    function initializeReports() {
        updateSummaryKPIs();
        initializeCharts();
        renderAttendanceTable();
        renderLeaveTable();
        renderPayrollTable();
    }

    // ===================================================
    // RUN ON LOAD
    // ===================================================
    initializeReports();

    // ===================================================
    // LISTEN FOR DATA UPDATES
    // ===================================================
    window.addEventListener('storage', (e) => {
        if (['employees', 'attendance_records', 'leaveRequests', 'payrollRecords'].includes(e.key)) {
            initializeReports();
        }
    });

    // Refresh every 30 seconds to catch same-tab updates
    setInterval(() => {
        initializeReports();
    }, 30000);
});
// TODO: Call Supabase fetch functions on page load // fetchAttendanceData(); // fetchLeaveData(); // fetchPayrollData(); });
=======
  // Sample Attendance Data
  const attendanceData = [
    { name: "Arjie Veloria", present: 5, late: 1, absent: 0, total: 45 },
    { name: "Leigh Moreno", present: 4, late: 2, absent: 1, total: 40 },
    { name: "Earvin Lopez", present: 6, late: 0, absent: 0, total: 48 },
  ];

  const leaveData = [
    { name: "Arjie Veloria", type: "Sick Leave", status: "Approved", duration: "2 Days" },
    { name: "Leigh Moreno", type: "Vacation Leave", status: "Pending", duration: "3 Days" },
  ];

  const payrollData = [
    { name: "Arjie Veloria", period: "Nov 1–15, 2025", net: 25000, status: "Processed" },
    { name: "Leigh Moreno", period: "Nov 1–15, 2025", net: 23000, status: "Processed" },
  ];

  // Populate Attendance
  const tbody = document.getElementById("attendanceTable");
  let totalPresent = 0, totalLate = 0, totalAbsent = 0;
  attendanceData.forEach(emp => {
    totalPresent += emp.present;
    totalLate += emp.late;
    totalAbsent += emp.absent;
    tbody.innerHTML += `
      <tr>
        <td>${emp.name}</td>
        <td>${emp.present}</td>
        <td>${emp.late}</td>
        <td>${emp.absent}</td>
        <td>${emp.total}</td>
      </tr>`;
  });
  document.getElementById("presentCount").textContent = totalPresent;
  document.getElementById("lateCount").textContent = totalLate;
  document.getElementById("absentCount").textContent = totalAbsent;
  document.getElementById("totalCount").textContent = attendanceData.length;

  // Populate Leave
  const leaveTable = document.getElementById("leaveTable");
  leaveData.forEach(l => {
    leaveTable.innerHTML += `
      <tr>
        <td>${l.name}</td>
        <td>${l.type}</td>
        <td>${l.status}</td>
        <td>${l.duration}</td>
      </tr>`;
  });

  // Populate Payroll
  const payrollTable = document.getElementById("payrollTable");
  payrollData.forEach(p => {
    payrollTable.innerHTML += `
      <tr>
        <td>${p.name}</td>
        <td>${p.period}</td>
        <td>₱${p.net.toLocaleString()}</td>
        <td>${p.status}</td>
      </tr>`;
  });
});
>>>>>>> 8b8df163618e8317ad8cd8d5a93505f44b92961a
