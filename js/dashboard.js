// /js/dashboard.js - CONSOLIDATED SCRIPT

// 1. SUPABASE CLIENT INITIALIZATION
// ====================================================================
// !!! Tiyakin na TAMA ang iyong Keys !!!
const SUPABASE_URL = 'https://pheupnmnisguenfqaphs.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZXVwbm1uaXNndWVuZnFhcGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMzY2ODcsImV4cCI6MjA3OTgxMjY4N30.CYN8o3ilyeRY1aYLy7Vut47pLskF6gIcBv4zE3kOUqM';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ====================================================================

let activeUser = null;
let activeProfile = null;

// Pages that only Admin/Manager can view
const hrOnlyPages = [
    "dashboard.html", "employee.html", "employee_add.html", 
    "employee_edit.html", "employee_view.html", "payroll.html", "reports.html"
];
const currentPage = window.location.pathname.split("/").pop();


// 2. AUTHENTICATION AND PROFILE CHECK (Gagamit ng Supabase imbes na Local Storage)
// ====================================================================
async function checkAuthAndFetchProfile() {
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();

    if (sessionError || !user) {
        console.error('No active session. Redirecting to login.');
        return window.location.href = 'index.html'; 
    }

    activeUser = user;

    // I-fetch ang user profile kasama ang role
    const { data: profileData, error: profileError } = await supabase
        .from('employees')
        .select(`
            id, 
            first_name, 
            email, 
            positions(role_id, roles(role_name)) 
        `)
        .eq('id', activeUser.id)
        .single();

    if (profileError || !profileData || !profileData.positions || !profileData.positions.roles) {
        // Ito ang magre-resolve ng 'User profile not linked' issue kung wala pang profile
        console.error('Error fetching user profile or profile not found:', profileError || 'Profile data is null.');
        alert('User profile not linked. Please contact HR.'); 
        return window.location.href = 'index.html'; 
    }

    activeProfile = {
        ...profileData,
        roleName: profileData.positions.roles.role_name
    };

    // Tiyakin ang Role-Based Redirect bago mag-load ng UI
    handleRoleRedirect(activeProfile.roleName);
    
    // I-update ang UI
    updateUI();
    handleRoleVisibility(activeProfile.roleName);
}


// 3. ROLE-BASED REDIRECT CHECK
// ====================================================================
function handleRoleRedirect(userRole) {
    if (userRole === "Employee" && hrOnlyPages.includes(currentPage)) {
        console.log(`Employee role detected. Redirecting from ${currentPage} to attendance.html.`);
        window.location.href = "attendance.html";
        return true;
    }
    return false;
}

// 4. UI UPDATES
// ====================================================================
function updateUI() {
    if (activeProfile) {
        const userEmail = activeProfile.email || 'N/A';
        const userRole = activeProfile.roleName || 'N/A';
        const firstName = activeProfile.first_name || 'User';

        // 1. Welcome Text sa taas ng nav
        document.getElementById('welcomeText').textContent = `Welcome, ${firstName}! (Role: ${userRole})`;
        
        // 2. User Menu Display (Lower Left)
        const userEmailDisplay = document.getElementById("userEmailDisplay");
        if (userEmailDisplay) {
             userEmailDisplay.textContent = userEmail;
        }
        
        // (Dito ilalagay ang logic para i-fetch at i-update ang stats data)
    }
}

// 5. ROLE-BASED VISIBILITY (I-hide ang nav links)
// ====================================================================
function handleRoleVisibility(userRole) {
    const hiddenLinkIds = ["navEmployees", "navPayroll", "navReports"];

    // Ipakita lahat muna (Default)
    hiddenLinkIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "";
    });

    // Itago kung Employee lang
    if (userRole === "Employee") {
        hiddenLinkIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = "none";
        });
    }
}

// 6. LOGOUT FUNCTION
// ====================================================================
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Logout Error:', error);
            } else {
                // Clear any leftover local storage data
                localStorage.clear(); 
                window.location.href = 'index.html';
            }
        });
    }
}


// 7. SIDEBAR ANIMATION AND DROPDOWN SETUP (Galing sa embedded script mo)
// ====================================================================
function setupUIListeners() {
    const sidebar = document.querySelector(".sidebar");
    const navItems = document.querySelectorAll(".nav-item");
    const userIcon = document.getElementById("userIcon");
    const dropdownMenu = document.getElementById("dropdownMenu");

    // --- Hamburger/Sidebar Setup ---
    if (!document.querySelector(".hamburger-btn")) {
        const hamburger = document.createElement("button");
        hamburger.className = "hamburger-btn";
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        sidebar.appendChild(hamburger);
    }
    const hamburger = document.querySelector(".hamburger-btn");
    let isExpanded = false;
    let hoverTimeout;

    // Sidebar Toggling Logic
    hamburger?.addEventListener("click", (e) => {
        e.stopPropagation();
        isExpanded = !isExpanded;
        sidebar.classList.toggle("expanded", isExpanded);
    });

    // Sidebar Hover Logic
    sidebar.addEventListener("mouseenter", () => {
        clearTimeout(hoverTimeout);
        sidebar.classList.add("expanded");
    });

    sidebar.addEventListener("mouseleave", () => {
        if (!isExpanded) {
            hoverTimeout = setTimeout(() => {
                sidebar.classList.remove("expanded");
            }, 300);
        }
    });

    // --- Nav Item Structure and Active State ---
    navItems.forEach(item => {
        const text = item.textContent.trim();
        const icon = text.split(" ")[0]; // Kukunin ang emoji
        const label = text.substring(icon.length).trim();
        item.innerHTML = `<span class="nav-item-icon">${icon}</span><span class="nav-item-text">${label}</span>`;

        // Set active nav item
        if (item.getAttribute("href") === currentPage) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // --- User Icon Dropdown Logic (Lower Left) ---
    userIcon?.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".user-menu-sidebar")) {
            dropdownMenu.classList.remove("show");
        }
    });
}


// 8. INITIALIZATION
// ====================================================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. I-setup ang lahat ng UI listeners (Sidebar, Dropdown, Nav)
    setupUIListeners(); 
    
    // 2. I-setup ang Logout
    setupLogout();

    // 3. I-check ang Auth at i-load ang data
    checkAuthAndFetchProfile(); 
});