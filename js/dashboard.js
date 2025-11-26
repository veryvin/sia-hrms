document.addEventListener("DOMContentLoaded", () => {
    // Get data from localStorage
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    const attendanceRecords = JSON.parse(localStorage.getItem('attendance_records')) || [];
    const leaveRequests = JSON.parse(localStorage.getItem('leaveRequests')) || [];
    const payrollRecords = JSON.parse(localStorage.getItem('payrollRecords')) || [];

    // If no data exists, initialize with sample data
    if (employees.length === 0) {
        const sampleEmployees = [
            {
                empId: "EMP-001",
                firstName: "Juan",
                lastName: "Dela Cruz",
                middleName: "Santos",
                email: "juan.delacruz@rmt.com",
                department: "Product Department",
                position: "Product Manager",
                status: "Regular",
                salary: 35000,
                dob: "1990-05-15",
                gender: "Male",
                phone: "+63 912 345 6789",
                address: "123 Main St, Quezon City",
                dateHired: "2020-01-15"
            },
            {
                empId: "EMP-002",
                firstName: "Maria",
                lastName: "Santos",
                middleName: "Garcia",
                email: "maria.santos@rmt.com",
                department: "Product Department",
                position: "Product Specialist",
                status: "Regular",
                salary: 28000,
                dob: "1992-08-22",
                gender: "Female",
                phone: "+63 923 456 7890",
                address: "456 Oak Ave, Manila",
                dateHired: "2021-03-10"
            },
            {
                empId: "EMP-003",
                firstName: "Pedro",
                lastName: "Reyes",
                middleName: "Lopez",
                email: "pedro.reyes@rmt.com",
                department: "Project Management",
                position: "Project Coordinator",
                status: "Probationary",
                salary: 25000,
                dob: "1995-11-30",
                gender: "Male",
                phone: "+63 934 567 8901",
                address: "789 Pine Rd, Makati",
                dateHired: "2024-09-01"
            }
        ];
        localStorage.setItem('employees', JSON.stringify(sampleEmployees));
    }

    // Update statistics
    updateDashboardStats();
    updateDepartmentDistribution();
    updateLeaveRequests();

    function updateDashboardStats() {
        const employees = JSON.parse(localStorage.getItem('employees')) || [];
        const attendanceRecords = JSON.parse(localStorage.getItem('attendance_records')) || [];
        const leaveRequests = JSON.parse(localStorage.getItem('leaveRequests')) || [];
        const payrollRecords = JSON.parse(localStorage.getItem('payrollRecords')) || [];

        // Total Employees
        const totalEmp = employees.length;
        const activeEmp = employees.filter(e => e.status === 'Regular' || e.status === 'Probationary').length;
        document.getElementById('totalEmployees').textContent = totalEmp;
        document.getElementById('activeEmployees').textContent = `${activeEmp} Active`;

        // Present Today
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = attendanceRecords.filter(r => r.date === today);
        const presentCount = todayAttendance.filter(r => r.timeIn !== '--').length;
        document.getElementById('presentToday').textContent = presentCount;
        document.getElementById('presentTodayText').textContent = `Out of ${totalEmp}`;

        // Pending Leaves
        const pendingCount = leaveRequests.filter(l => l.status === 'pending').length;
        document.getElementById('pendingLeaves').textContent = pendingCount;

        // Monthly Payroll
        const totalPayroll = payrollRecords.reduce((sum, p) => sum + (p.netPay || 0), 0);
        document.getElementById('monthlyPayroll').textContent = `₱${totalPayroll.toLocaleString('en-PH', {minimumFractionDigits: 2})}`;
        document.getElementById('payrollProcessed').textContent = `${payrollRecords.length} processed`;
    }

    function updateDepartmentDistribution() {
        const employees = JSON.parse(localStorage.getItem('employees')) || [];
        const deptContainer = document.getElementById('departmentDistribution');
        
        // Count employees by department
        const deptCounts = {};
        employees.forEach(emp => {
            const dept = emp.department || 'Unassigned';
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });

        // Calculate max for percentage
        const maxCount = Math.max(...Object.values(deptCounts), 1);

        // Generate HTML
        let html = '';
        Object.entries(deptCounts).forEach(([dept, count]) => {
            const percentage = (count / maxCount) * 100;
            html += `
                <div class="dept">
                    <span>${dept}</span>
                    <div class="bar">
                        <div class="fill" style="width: ${percentage}%;"></div>
                    </div>
                    <span class="count">${count} employee${count !== 1 ? 's' : ''}</span>
                </div>
            `;
        });

        html += `<p class="note">📈 Total: ${employees.length} employees across ${Object.keys(deptCounts).length} departments</p>`;
        deptContainer.innerHTML = html;
    }

    function updateLeaveRequests() {
        const leaveRequests = JSON.parse(localStorage.getItem('leaveRequests')) || [];
        const leaveContainer = document.getElementById('leaveRequestsList');
        
        const recentLeaves = leaveRequests.slice(-5).reverse();

        if (recentLeaves.length === 0) {
            leaveContainer.innerHTML = '<p>No leave requests yet</p>';
            return;
        }

        let html = '<div style="max-height: 300px; overflow-y: auto;">';
        recentLeaves.forEach(leave => {
            const statusClass = leave.status === 'pending' ? 'warning' : 
                              leave.status === 'approved' ? 'success' : 'danger';
            html += `
                <div style="padding: 10px; margin-bottom: 8px; border-left: 3px solid var(--${statusClass}); background: #f9f9f9; border-radius: 4px;">
                    <strong>${leave.employee}</strong> - ${leave.leaveType}<br>
                    <small>${leave.startDate} to ${leave.endDate}</small><br>
                    <span class="badge badge-${statusClass}">${leave.status}</span>
                </div>
            `;
        });
        html += '</div>';
        leaveContainer.innerHTML = html;
    }

    // Refresh data every 30 seconds
    setInterval(() => {
        updateDashboardStats();
        updateDepartmentDistribution();
        updateLeaveRequests();
    }, 30000);
});