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
            },
            {
                empId: "EMP-004",
                firstName: "Ana",
                lastName: "Lim",
                middleName: "Torres",
                email: "ana.lim@rmt.com",
                department: "Smfo Department",
                position: "Sales Manager",
                status: "Regular",
                salary: 32000,
                dob: "1988-03-12",
                gender: "Female",
                phone: "+63 945 678 9012",
                address: "321 Maple St, Pasig",
                dateHired: "2019-06-20"
            }
        ];
        localStorage.setItem('employees', JSON.stringify(sampleEmployees));
    }

    // Initialize dashboard with animations
    initializeDashboard();
    updateDashboardStats();
    updateDepartmentDistribution();
    updateLeaveRequests();

    function initializeDashboard() {
        // Animate stats cards on load
        const cards = document.querySelectorAll('.card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'all 0.5s ease';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            }, index * 100);
        });

        // Animate panels
        const panels = document.querySelectorAll('.panel');
        panels.forEach((panel, index) => {
            setTimeout(() => {
                panel.style.opacity = '0';
                panel.style.transform = 'translateY(20px)';
                panel.style.transition = 'all 0.5s ease';
                
                setTimeout(() => {
                    panel.style.opacity = '1';
                    panel.style.transform = 'translateY(0)';
                }, 50);
            }, (cards.length * 100) + (index * 150));
        });
    }

    function updateDashboardStats() {
        const employees = JSON.parse(localStorage.getItem('employees')) || [];
        const attendanceRecords = JSON.parse(localStorage.getItem('attendance_records')) || [];
        const leaveRequests = JSON.parse(localStorage.getItem('leaveRequests')) || [];
        const payrollRecords = JSON.parse(localStorage.getItem('payrollRecords')) || [];

        // Total Employees with animation
        const totalEmp = employees.length;
        const activeEmp = employees.filter(e => e.status === 'Regular' || e.status === 'Probationary').length;
        animateNumber('totalEmployees', 0, totalEmp, 1000);
        document.getElementById('activeEmployees').textContent = `${activeEmp} Active`;

        // Present Today with animation
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = attendanceRecords.filter(r => r.date === today);
        const presentCount = todayAttendance.filter(r => r.timeIn !== '--').length;
        animateNumber('presentToday', 0, presentCount, 1000);
        document.getElementById('presentTodayText').textContent = `Out of ${totalEmp}`;

        // Pending Leaves with animation
        const pendingCount = leaveRequests.filter(l => l.status === 'pending').length;
        animateNumber('pendingLeaves', 0, pendingCount, 1000);

        // Monthly Payroll with animation
        const totalPayroll = payrollRecords.reduce((sum, p) => sum + (p.netPay || 0), 0);
        animatePayroll('monthlyPayroll', 0, totalPayroll, 1200);
        document.getElementById('payrollProcessed').textContent = `${payrollRecords.length} processed`;
    }

    function animateNumber(elementId, start, end, duration) {
        const element = document.getElementById(elementId);
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + (end - start) * easeOutQuart);
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = end;
            }
        }
        
        requestAnimationFrame(update);
    }

    function animatePayroll(elementId, start, end, duration) {
        const element = document.getElementById(elementId);
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = start + (end - start) * easeOutQuart;
            
            element.textContent = `₱${current.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = `₱${end.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            }
        }
        
        requestAnimationFrame(update);
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

        // Generate HTML with enhanced styling
        let html = '';
        Object.entries(deptCounts).forEach(([dept, count], index) => {
            const percentage = (count / maxCount) * 100;
            html += `
                <div class="dept" style="animation: slideInRight 0.5s ease forwards ${index * 0.1}s; opacity: 0;">
                    <span>${dept}</span>
                    <div class="bar">
                        <div class="fill" style="width: 0%;" data-width="${percentage}%"></div>
                    </div>
                    <span class="count">${count} employee${count !== 1 ? 's' : ''}</span>
                </div>
            `;
        });

        html += `<p class="note">📈 Total: ${employees.length} employees across ${Object.keys(deptCounts).length} departments</p>`;
        deptContainer.innerHTML = html;

        // Animate bars after a short delay
        setTimeout(() => {
            document.querySelectorAll('.fill').forEach((bar, index) => {
                setTimeout(() => {
                    bar.style.width = bar.getAttribute('data-width');
                }, index * 150);
            });
        }, 300);
    }

    function updateLeaveRequests() {
        const leaveRequests = JSON.parse(localStorage.getItem('leaveRequests')) || [];
        const leaveContainer = document.getElementById('leaveRequestsList');
        
        const recentLeaves = leaveRequests.slice(-5).reverse();

        if (recentLeaves.length === 0) {
            leaveContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #9ca3af;">No leave requests yet</p>';
            return;
        }

        let html = '<div style="max-height: 320px; overflow-y: auto;">';
        recentLeaves.forEach((leave, index) => {
            const statusColor = leave.status === 'pending' ? '#f59e0b' : 
                              leave.status === 'approved' ? '#10b981' : '#ef4444';
            const statusBg = leave.status === 'pending' ? '#fef3c7' : 
                           leave.status === 'approved' ? '#dcfce7' : '#fee2e2';
            
            html += `
                <div style="animation: slideInLeft 0.4s ease forwards ${index * 0.1}s; opacity: 0;">
                    <strong>${leave.employee}</strong> - ${leave.leaveType}<br>
                    <small>📅 ${leave.startDate} to ${leave.endDate}</small><br>
                    <span class="status-badge" style="background: ${statusBg}; color: ${statusColor}; margin-top: 6px;">${leave.status.toUpperCase()}</span>
                </div>
            `;
        });
        html += '</div>';
        leaveContainer.innerHTML = html;
    }

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
    `;
    document.head.appendChild(style);

    // Refresh data every 30 seconds
    setInterval(() => {
        updateDashboardStats();
        updateDepartmentDistribution();
        updateLeaveRequests();
    }, 30000);
});