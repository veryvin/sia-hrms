// /js/dashboard.js - FINAL CLEAN VERSION

<<<<<<< HEAD
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
=======
// ================================================================
// 1. SUPABASE CLIENT INITIALIZATION
// ================================================================
const SUPABASE_URL = 'https://pheupnmnisguenfqaphs.supabase.co';
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZXVwbm1uaXNndWVuZnFhcGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMzY2ODcsImV4cCI6MjA3OTgxMjY4N30.CYN8o3ilyeRY1aYLy7Vut47pLskF6gIcBv4zE3kOUqM';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global active state
let activeUser = null;
let activeProfile = null;

// Page detection
const currentPage = window.location.pathname.split("/").pop();


// ================================================================
// 2. AUTH + PROFILE FETCH
// ================================================================
async function checkAuthAndFetchProfile() {
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();

    // If no user → show guest
    if (sessionError || !user) {
        console.log("Guest access enabled (no user logged in).");
        activeUser = null;
        activeProfile = { roleName: "Guest", first_name: "Guest", email: "" };
        updateUI();
        handleRoleVisibility("Guest");
        loadDashboardData(); // still load stats for UI
        return;
    }

    activeUser = user;

    // Fetch employee profile + position + role
    const { data: profileData, error: profileError } = await supabase
        .from("employees")
        .select(`
            id,
            first_name,
            email,
            positions(
                role_id,
                roles(role_name),
                departments(department_name)
            )
        `)
        .eq("id", activeUser.id)
        .single();

    if (profileError || !profileData) {
        console.warn("Profile not found:", profileError);
        activeProfile = { first_name: "User", email: user.email, roleName: "User" };
    } else {
        activeProfile = {
            ...profileData,
            roleName: profileData.positions?.roles?.role_name || "User",
            departmentName: profileData.positions?.departments?.department_name || ""
        };
    }

    updateUI();
    handleRoleVisibility(activeProfile.roleName);
    loadDashboardData();
}
>>>>>>> 8b8df163618e8317ad8cd8d5a93505f44b92961a


<<<<<<< HEAD
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
=======
// ================================================================
// 3. LOAD DASHBOARD STATISTICS
// ================================================================
async function loadDashboardData() {
    loadTotalEmployees();
    loadPresentToday();
    loadPendingLeaves();
    loadMonthlyPayroll();
}


// Total Employees
async function loadTotalEmployees() {
    const el = document.getElementById("totalEmployees");
    const elActive = document.getElementById("activeEmployees");

    const { data, error } = await supabase.from("employees").select("id");

    if (error) return console.error(error);

    const total = data.length;

    el.textContent = total;
    elActive.textContent = `${total} Active`;
}


// Attendance Today
async function loadPresentToday() {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
        .from("attendance")
        .select("id")
        .gte("timestamp", `${today}T00:00:00`)
        .lte("timestamp", `${today}T23:59:59`);

    const present = data ? data.length : 0;

    document.getElementById("presentToday").textContent = present;
    document.getElementById("presentTodayText").textContent = `Out of ???`; // You can improve this
}


// Pending Leaves
async function loadPendingLeaves() {
    const { data, error } = await supabase
        .from("leave_requests")
        .select("id")
        .eq("status", "Pending");

    const pending = data ? data.length : 0;

    document.getElementById("pendingLeaves").textContent = pending;
}


// Monthly Payroll
async function loadMonthlyPayroll() {
    const month = new Date().getMonth() + 1;

    const { data, error } = await supabase
        .from("payroll")
        .select("amount");

    if (error || !data) {
        document.getElementById("monthlyPayroll").textContent = "₱0";
        return;
>>>>>>> 8b8df163618e8317ad8cd8d5a93505f44b92961a
    }

    const total = data.reduce((sum, row) => sum + (row.amount || 0), 0);

<<<<<<< HEAD
        if (recentLeaves.length === 0) {
            leaveContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #9ca3af;">No leave requests yet</p>';
            return;
=======
    document.getElementById("monthlyPayroll").textContent = `₱${total.toLocaleString()}`;
    document.getElementById("payrollProcessed").textContent = `${data.length} processed`;
}



// ================================================================
// 4. UPDATE UI (Welcome + Email)
// ================================================================
function updateUI() {
    const name = activeProfile.first_name || "User";
    const role = activeProfile.roleName || "User";

    document.getElementById("welcomeText").textContent =
        `Welcome, ${name}! (${role})`;

    const userEmailDisplay = document.getElementById("userEmailDisplay");
    if (userEmailDisplay) userEmailDisplay.textContent = activeProfile.email || "";
}


// ================================================================
// 5. ROLE-BASED VISIBILITY (Hide HR pages for employees)
// ================================================================
function handleRoleVisibility(role) {
    const hideForEmployees = ["navEmployees", "navPayroll", "navReports"];

    hideForEmployees.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        el.style.display = (role === "Employee") ? "none" : "";
    });
}


// ================================================================
// 6. LOGOUT
// ================================================================
function setupLogout() {
    const btn = document.getElementById("logoutBtn");
    if (!btn) return;

    btn.addEventListener("click", async () => {
        await supabase.auth.signOut();
        localStorage.clear();
        window.location.href = "index.html";
    });
}


// ================================================================
// 7. SIDEBAR + DROPDOWN UI INTERACTIONS
// ================================================================
function setupUIListeners() {
    const sidebar = document.querySelector(".sidebar");
    const navItems = document.querySelectorAll(".nav-item");
    const userIcon = document.getElementById("userIcon");
    const dropdownMenu = document.getElementById("dropdownMenu");

    // Hamburger button
    const hamburger = document.createElement("button");
    hamburger.className = "hamburger-btn";
    hamburger.innerHTML = "<span></span><span></span><span></span>";
    sidebar.appendChild(hamburger);

    let expanded = false;
    let hoverTimer;

    hamburger.addEventListener("click", e => {
        e.stopPropagation();
        expanded = !expanded;
        sidebar.classList.toggle("expanded", expanded);
    });

    sidebar.addEventListener("mouseenter", () => {
        clearTimeout(hoverTimer);
        sidebar.classList.add("expanded");
    });

    sidebar.addEventListener("mouseleave", () => {
        if (!expanded) {
            hoverTimer = setTimeout(() => {
                sidebar.classList.remove("expanded");
            }, 300);
>>>>>>> 8b8df163618e8317ad8cd8d5a93505f44b92961a
        }
    });

<<<<<<< HEAD
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
=======
    // Nav item icon/label formatting
    navItems.forEach(item => {
        const txt = item.textContent.trim();
        const icon = txt.split(" ")[0];
        const label = txt.substring(icon.length).trim();
        item.innerHTML = `<span class="nav-item-icon">${icon}</span><span class="nav-item-text">${label}</span>`;

        if (item.getAttribute("href") === currentPage) {
            item.classList.add("active");
        }
    });

    // User dropdown
    userIcon?.addEventListener("click", e => {
        e.stopPropagation();
        dropdownMenu.classList.toggle("show");
    });

    document.addEventListener("click", () => dropdownMenu.classList.remove("show"));
}


// ================================================================
// 8. INITIALIZE EVERYTHING
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
    setupUIListeners();
    setupLogout();
    checkAuthAndFetchProfile();
});
>>>>>>> 8b8df163618e8317ad8cd8d5a93505f44b92961a
