document.addEventListener("DOMContentLoaded", () => {
    if (!window.supabaseClient) {
        console.error("❌ Supabase client not found. Load supabase-config.js first.");
        return;
    }
    const supabase = window.supabaseClient;

    // Global variable to store the employee map for lookups
    let employeeNameMap = {};

    // ===================================================
    // DISPLAY LOGGED IN USER (FIXED: Using LocalStorage)
    // ===================================================
    const welcomeText = document.getElementById('welcomeText');
    const userEmailDisplay = document.getElementById('userEmailDisplay');

    function displayLoggedInUser() {
        const loggedInUserString = localStorage.getItem('loggedInUser');

        if (loggedInUserString) {
            try {
                const loggedInUser = JSON.parse(loggedInUserString);
                
                // Prioritize name fields, finally falling back to 'User'
                const displayName = loggedInUser.first_name 
                                    || loggedInUser.email 
                                    || loggedInUser.username 
                                    || 'User'; 
                
                if (welcomeText) {
                    welcomeText.textContent = `Welcome, ${displayName}`;
                }
                if (userEmailDisplay) {
                    userEmailDisplay.textContent = displayName;
                }
                
                console.log("👤 Logged in user from localStorage:", loggedInUser);
            } catch (e) {
                console.error("Error parsing logged in user from localStorage:", e);
                if (welcomeText) welcomeText.textContent = "Welcome, User (Parse Error)";
                if (userEmailDisplay) userEmailDisplay.textContent = "User (Error)";
            }
        } else {
            console.warn("⚠️ No logged in user found in localStorage");
            if (welcomeText) welcomeText.textContent = "Welcome, Guest";
            if (userEmailDisplay) userEmailDisplay.textContent = "Guest";
        }
    }
    
    displayLoggedInUser();

    // ===================================================
    // TAB SWITCHING
    // ===================================================
    const tabs = document.querySelectorAll(".tab-btn");
    const contents = document.querySelectorAll(".tab-content");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            contents.forEach(c => c.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(tab.dataset.tab).classList.add("active");
        });
    });

    // ===================================================
    // FETCH DATA FROM SUPABASE (WITH DEBUGGING)
    // ===================================================
    async function fetchEmployees() {
        try {
            const { data, error } = await supabase.from('employees').select('*');
            if (error) throw error;
            console.log("🟢 Employees Fetched:", data.length);
            return data || [];
        } catch (error) {
            console.error('🔴 Error fetching employees:', error);
            return [];
        }
    }

    async function fetchAttendanceRecords() {
        try {
            // FIX: Changed table name to 'Attendance'
            const { data, error } = await supabase.from('attendance').select('*');
            if (error) throw error;
            console.log("🟢 Attendance Fetched:", data.length);
            return data || [];
        } catch (error) {
            console.error('🔴 Error fetching attendance:', error);
            return [];
        }
    }

    async function fetchLeaveRequests() {
        try {
            const { data, error } = await supabase.from('leave_requests').select('*');
            if (error) throw error;
            console.log("🟢 Leave Requests Fetched:", data.length);
            return data || [];
        } catch (error) {
            console.error('🔴 Error fetching leave requests:', error);
            return [];
        }
    }

    async function fetchPayrollRecords() {
        try {
            // FIX: Changed table name to 'Payroll'
            const { data, error } = await supabase.from('payroll').select('*');
            if (error) throw error;
            console.log("🟢 Payroll Records Fetched:", data.length);
            return data || [];
        } catch (error) {
            console.error('🔴 Error fetching payroll:', error);
            return [];
        }
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
    async function processAttendanceData() {
        const attendance = await fetchAttendanceRecords();
        const attendanceByEmployee = {};

        // Iterate through the already established employeeNameMap
        Object.keys(employeeNameMap).forEach(employee_id => {
            attendanceByEmployee[employee_id] = { 
                name: employeeNameMap[employee_id], // Use resolved name from map
                present: 0,
                late: 0,
                absent: 0,
                totalHours: 0
            };
        });

        attendance.forEach(record => {
            if (attendanceByEmployee[record.employee_id]) { 
                const empData = attendanceByEmployee[record.employee_id];
                
                if (record.timeOut && record.timeOut !== "--") {
                    empData.present++;
                    
                    const hours = calculateHours(record.timeIn, record.timeOut);
                    empData.totalHours += hours;

                    // Check if late (after 9:00 AM)
                    const nineAM = parseTimeToSeconds("09:00:00 AM");
                    const actualTime = parseTimeToSeconds(record.timeIn);
                    
                    if (actualTime && nineAM && actualTime > nineAM) {
                        empData.late++;
                    }
                }
            }
        });

        // Calculate absences
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const workingDays = Math.floor(daysInMonth * (22/30));

        Object.keys(attendanceByEmployee).forEach(empId => {
            const data = attendanceByEmployee[empId];
            data.absent = Math.max(0, workingDays - data.present);
        });

        return attendanceByEmployee;
    }

    // ===================================================
    // SUMMARY TAB - UPDATE KPIs
    // ===================================================
    async function updateSummaryKPIs() {
        const employees = await fetchEmployees();
        const payroll = await fetchPayrollRecords() || []; // Safely default to array
        const attendance = await fetchAttendanceRecords();

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

        const totalPossibleAttendance = employees.length * 22;
        const attendanceRate = totalPossibleAttendance > 0 
            ? Math.round((recentAttendance.length / totalPossibleAttendance) * 100) 
            : 0;

        document.querySelector("#attendanceRateCard .number").textContent = attendanceRate + "%";

        // Total Payroll
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        
        // FIX: Use 'payment_date' and add null check to prevent TypeError (reading 'includes')
        const currentMonthPayroll = payroll.filter(p => 
            p.payment_date && p.payment_date.includes(currentMonth) 
        );
        
        // FIX: Use 'net_pay' for total payroll since 'grossPay' doesn't exist
        const totalPayrollAmount = currentMonthPayroll.reduce((sum, p) => sum + (p.net_pay || 0), 0);
        const processedCount = currentMonthPayroll.length;

        document.querySelector("#totalPayrollCard .number").textContent = 
            "₱" + totalPayrollAmount.toLocaleString('en-PH', {minimumFractionDigits: 0});
        document.querySelector("#totalPayrollCard .sub-text").textContent = 
            `${processedCount} processed`;
    }

    // ===================================================
    // SUMMARY TAB - CHARTS
    // ===================================================
    async function initializeCharts() {
        const employees = await fetchEmployees();
        
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
        const leaves = await fetchLeaveRequests();
        const leaveStatusCount = {
            approved: leaves.filter(l => l.status === 'Approved').length,
            pending: leaves.filter(l => l.status === 'Pending').length,
            rejected: leaves.filter(l => l.status === 'Rejected').length
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
        const payroll = await fetchPayrollRecords() || []; // Safely default to array
        const roleCount = {};
        
        // Assuming employeePosition is available on the payroll record, otherwise needs join/lookup
        payroll.forEach(p => {
            // Note: This needs a join to work correctly if employeePosition is not on the payroll table
            const role = p.employeePosition || 'Unassigned'; 
            roleCount[role] = (roleCount[role] || 0) + 1;
        });

        const roleLabels = Object.keys(roleCount).slice(0, 5);
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
    async function renderAttendanceTable() {
        const attendanceData = await processAttendanceData();
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
async function renderLeaveTable() {
    const leaves = await fetchLeaveRequests();
    const leaveTable = document.getElementById("leaveTable");
    
    leaveTable.innerHTML = '';
    
    if (leaves.length === 0) {
        leaveTable.innerHTML = '<tr><td colspan="4" class="empty">No leave records found</td></tr>';
        return;
    }
    
    leaves.forEach(l => {
        const startDate = new Date(l.start_date); 
        const endDate = new Date(l.end_date);     
        
        let days = 0;
        if (!isNaN(startDate) && !isNaN(endDate)) {
            days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        } else {
            days = l.number_of_days || 0; 
        }

        // *** CRITICAL FIX: Ensure l.employee_id is used for lookup ***
        // This links the leave record's ID to the new emp.id key in the map.
        const employeeName = employeeNameMap[l.employee_id] || 'N/A';
        
        leaveTable.innerHTML += `
            <tr>
                <td>${employeeName}</td>
                <td>${l.leave_type}</td>
                <td><span class="status ${l.status.toLowerCase()}">${l.status}</span></td>
                <td>${days} Day${days === 1 ? '' : 's'}</td>
            </tr>`;
    });
}
// ===================================================
    // PAYROLL TAB (Updated Lookup Logic)
    // ===================================================
    async function renderPayrollTable() {
        const payroll = await fetchPayrollRecords();
        const payrollTable = document.getElementById("payrollTable");
        
        payrollTable.innerHTML = '';
        
        if (payroll.length === 0) {
            payrollTable.innerHTML = '<tr><td colspan="4" class="empty">No payroll records found</td></tr>';
            return;
        }
        
        payroll.forEach(p => {
            // STEP 1: Get the universal key from the secondary map using the Payroll FK (p.employee_id -> employees.id)
            const universalKey = employeeIdToUniversalKeyMap[p.employee_id];
            
            // STEP 2: Use the universal key to look up the name
            const employeeName = employeeNameMap[universalKey] || 'N/A'; 
            
            payrollTable.innerHTML += `
                <tr>
                    <td>${employeeName}</td>
                    <td>${p.pay_period_start} - ${p.pay_period_end}</td> 
                    <td>₱${(p.net_pay || 0).toLocaleString('en-PH', {minimumFractionDigits:2})}</td>
                    <td><span class="status ${p.status.toLowerCase()}">${p.status}</span></td>
                </tr>`;
        });
    }
    
    // ===================================================
    // INITIALIZE ALL TABS
    // ===================================================
    async function initializeReports() {
        const employees = await fetchEmployees();
        
        // 1. POPULATE THE EMPLOYEE NAME MAP (FINAL UNIFIED FIX)
        employeeNameMap = {};
        employeeIdToUniversalKeyMap = {};

        employees.forEach(emp => {
            let firstName = emp.firstName || emp.first_name || '';
            let lastName = emp.last_name || emp.last_name || '';
            let fullName = `${firstName} ${lastName}`.trim();
            if (!fullName) {
                 fullName = emp.name || emp.full_name || emp.employeeName || '';
            }
            const finalName = fullName || String(emp.employee_id) || 'Unknown Employee';

            // CRITICAL: We use employee_id as the universal key for the map (used by Attendance/Leave)
            if (emp.employee_id) {
                employeeNameMap[emp.employee_id] = finalName; 
            }
            
            // SECONDARY MAP: Map the PRIMARY ID (emp.id) to the universal key (emp.employee_id)
            // This is for the Payroll lookup (which references emp.id)
            if (emp.id && emp.employee_id) {
                 employeeIdToUniversalKeyMap[emp.id] = emp.employee_id;
            }
        });

        // ... (rest of the functions call)
        await updateSummaryKPIs();
        await initializeCharts();
        await renderAttendanceTable();
        await renderLeaveTable();
        await renderPayrollTable();
    }    
    
    // ===================================================
    // RUN ON LOAD
    // ===================================================
    initializeReports();

    // Refresh every 30 seconds
    setInterval(() => {
        initializeReports();
    }, 30000);

    // ===================================================
    // REALTIME SUBSCRIPTIONS
    // ===================================================
    supabase
        .channel('reports-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => initializeReports())
        // FIX: Changed table name to 'Attendance'
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => initializeReports())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => initializeReports())
        // FIX: Changed table name to 'Payroll'
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payroll' }, () => initializeReports())
        .subscribe();
});