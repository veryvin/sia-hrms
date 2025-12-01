// ===================================================
// DASHBOARD - SUPABASE READY
// ===================================================

document.addEventListener("DOMContentLoaded", async () => {
    const supabase = window.supabaseClient;

    // Fetch data from Supabase
    async function fetchEmployees() {
        try {
            const { data, error } = await supabase.from('employees').select('*');
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching employees:', error);
            return [];
        }
    }

    async function fetchAttendanceRecords() {
        try {
            const { data, error } = await supabase.from('attendance_records').select('*');
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching attendance:', error);
            return [];
        }
    }

    async function fetchLeaveRequests() {
        try {
            const { data, error } = await supabase.from('leave_requests').select('*');
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching leaves:', error);
            return [];
        }
    }

    async function fetchPayrollRecords() {
        try {
            const { data, error } = await supabase.from('payroll_records').select('*');
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching payroll:', error);
            return [];
        }
    }

    // Initialize dashboard with animations
    initializeDashboard();
    await updateDashboardStats();
    await updateDepartmentDistribution();
    await updateLeaveRequests();

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

    async function updateDashboardStats() {
        const employees = await fetchEmployees();
        const attendanceRecords = await fetchAttendanceRecords();
        const leaveRequests = await fetchLeaveRequests();
        const payrollRecords = await fetchPayrollRecords();

        // Total Employees with animation
        const totalEmp = employees.length;
        const activeEmp = employees.filter(e => 
            e.employment_status === 'Regular' || 
            e.employment_status === 'Probationary'
        ).length;
        animateNumber('totalEmployees', 0, totalEmp, 1000);
        document.getElementById('activeEmployees').textContent = `${activeEmp} Active`;

        // Present Today with animation
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = attendanceRecords.filter(r => r.date === today);
        const presentCount = todayAttendance.filter(r => r.time_in !== null).length;
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
        if (!element) return;
        
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
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
        if (!element) return;
        
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = start + (end - start) * easeOutQuart;
            
            element.textContent = `₱${current.toLocaleString('en-PH', {
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2
            })}`;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = `₱${end.toLocaleString('en-PH', {
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2
                })}`;
            }
        }
        
        requestAnimationFrame(update);
    }

    async function updateDepartmentDistribution() {
        const employees = await fetchEmployees();
        const deptContainer = document.getElementById('departmentDistribution');
        
        if (!deptContainer) return;

        // Count employees by department
        const deptCounts = {};
        employees.forEach(emp => {
            const dept = emp.department || 'Unassigned';
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });

        const maxCount = Math.max(...Object.values(deptCounts), 1);

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

        setTimeout(() => {
            document.querySelectorAll('.fill').forEach((bar, index) => {
                setTimeout(() => {
                    bar.style.width = bar.getAttribute('data-width');
                }, index * 150);
            });
        }, 300);
    }

    async function updateLeaveRequests() {
        const leaveRequests = await fetchLeaveRequests();
        const leaveContainer = document.getElementById('leaveRequestsList');
        
        if (!leaveContainer) return;

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
                    <strong>${leave.employeeName || 'Unknown'}</strong> - ${leave.leaveType}<br>
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
    setInterval(async () => {
        await updateDashboardStats();
        await updateDepartmentDistribution();
        await updateLeaveRequests();
    }, 30000);

    // Realtime subscriptions
    supabase
        .channel('dashboard-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, updateDashboardStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, updateDashboardStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => {
            updateDashboardStats();
            updateLeaveRequests();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payroll_records' }, updateDashboardStats)
        .subscribe();
});