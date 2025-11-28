// /js/dashboard.js - FINAL CLEAN VERSION

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
    }

    const total = data.reduce((sum, row) => sum + (row.amount || 0), 0);

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
        }
    });

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
