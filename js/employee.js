import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'; // Import ang function

// ** KRITIKAL: SUPABASE INITIALIZATION **
// Palitan ang mga ito ng inyong aktwal na Supabase credentials!
const SUPABASE_URL = 'https://pheupnmnisguenfqaphs.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZXVwbm1uaXNndWVuZnFhcGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMzY2ODcsImV4cCI6MjA3OTgxMjY4N30.CYN8o3ilyeRY1aYLy7Vut47pLskF6gIcBv4zE3kOUqM';

// I-EXPORT ang supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

import { supabase } from './dashboard.js';

/* ====================================================================
   I. UTILITIES (Para sa redirects)
==================================================================== */

function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}


/* ====================================================================
   II. UI UTILITIES (Sidebar & Logout)
==================================================================== */

/**
 * Initializes the Sidebar UI behavior and user menu.
 */
function initSidebarUI() {
    const sidebar = document.querySelector(".sidebar");
    const navItems = document.querySelectorAll(".nav-item");
    const userIcon = document.getElementById("userIcon");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const logoutBtn = document.getElementById("logoutBtn");
    const userEmailDisplay = document.getElementById("userEmailDisplay");
    
    // FETCHING USER INFO (Ito ang nawawala sa inyong snippet, idinagdag ko ulit)
    const loggedInUserString = localStorage.getItem('loggedInUser');
    let userEmail = '';
    
    if (loggedInUserString) {
        const loggedInUser = JSON.parse(loggedInUserString);
        userEmail = loggedInUser.email;
        
        // Welcome Text
        const welcomeText = document.getElementById('welcomeText');
        if (welcomeText) welcomeText.textContent = `Welcome, ${loggedInUser.first_name || 'Admin'} (Role: ${loggedInUser.role})`;
    }

    if (userEmailDisplay && userEmail) {
        userEmailDisplay.textContent = userEmail;
    }
    
    // --- SIDEBAR ANIMATION LOGIC (Mula sa inyong bagong snippet) ---
    
    // Walang need gumawa ng hamburger button, dahil naka-run na ito sa inyong full DCL code.
    // Ngunit, para hindi mag-error, gagamitin ko ang logic na may conditional check.

    // 1. Create Hamburger Button (Kung hindi pa ito nasa HTML)
    if (sidebar && !document.querySelector(".hamburger-btn")) {
        const hamburger = document.createElement("button");
        hamburger.className = "hamburger-btn";
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        sidebar.appendChild(hamburger);
    }
    
    const hamburger = document.querySelector(".hamburger-btn");
    let isExpanded = false;
    let hoverTimeout;

    // 2. Click Toggle
    hamburger?.addEventListener("click", (e) => {
        e.stopPropagation();
        isExpanded = !isExpanded;
        sidebar?.classList.toggle("expanded", isExpanded);
    });

    // 3. Mouse Enter/Hover Expand
    sidebar?.addEventListener("mouseenter", () => {
        clearTimeout(hoverTimeout);
        sidebar?.classList.add("expanded");
    });

    // 4. Mouse Leave/Hover Collapse
    sidebar?.addEventListener("mouseleave", () => {
        if (!isExpanded) {
            hoverTimeout = setTimeout(() => {
                sidebar?.classList.remove("expanded");
            }, 300);
        }
    });


    // --- NAV ITEM FORMATTING (Mula sa inyong bagong snippet) ---
    navItems.forEach(item => {
        const text = item.textContent.trim();
        const icon = text.split(" ")[0];
        const label = text.substring(icon.length).trim();
        item.innerHTML = `<span class="nav-item-icon">${icon}</span><span class="nav-item-text">${label}</span>`;
    });

    // --- ACTIVE NAV ITEM (Mula sa inyong bagong snippet) ---
    const currentPage = window.location.pathname.split("/").pop();
    navItems.forEach(item => {
        if (item.getAttribute("href") === currentPage) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // --- LOGOUT & DROPDOWN MENU (Mula sa inyong bagong snippet) ---
    userIcon?.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownMenu?.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".user-menu-sidebar")) {
            dropdownMenu?.classList.remove("show");
        }
    });

    logoutBtn?.addEventListener("click", () => {
        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("userEmail"); // Idinagdag base sa inyong snippet
        // Add Supabase sign out if implemented: supabase.auth.signOut();
        window.location.href = "index.html";
    });
}

/* ====================================================================
   III. RENDER LOGIC (LIST PAGE)
==================================================================== */

/**
 * Renders the fetched data into the employee list table, matching the screenshot design.
 */
function renderEmployeeTable(employees) {
    const employeeListBody = document.getElementById('employeeListBody');
    if (!employeeListBody) return;

    employeeListBody.innerHTML = ''; 
    
    if (employees.length === 0) {
        employeeListBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No employee records found.</td></tr>';
        return;
    }

    employees.forEach(emp => {
        const row = document.createElement('tr');
        
        const fullName = `${emp.last_name}, ${emp.first_name}`;
        const departmentName = emp.departments?.name || 'N/A';
        const positionName = emp.positions?.name || 'N/A';
        
        // I-format ang sweldo
        const salaryFormatted = `₱${Number(emp.salary || 0).toLocaleString('en-PH', {minimumFractionDigits: 2})}`;
        
        let statusClass = '';
        let statusText = emp.status;

        if (emp.status === 'Regular' || emp.status === 'Active') {
            statusClass = 'status-active';
        } else if (emp.status === 'Probationary') {
            statusClass = 'status-warning';
        } else if (emp.status === 'On Leave') {
            statusClass = 'status-leave';
        } else {
            statusClass = 'status-inactive';
            statusText = 'Inactive';
        }

        row.innerHTML = `
            <td class="employee-details-cell">
                <strong>${fullName}</strong><br>
                <small>${emp.email}</small>
            </td>
            <td>${positionName}</td>
            <td>${departmentName}</td>
            <td><span class="status ${statusClass}">${statusText}</span></td>
            <td>${salaryFormatted}</td>
            <td>
                <button onclick="viewEmployee('${emp.id}')" class="btn-action view">View</button>
                <button onclick="editEmployee('${emp.id}')" class="btn-action edit">Edit</button>
                <button onclick="deleteEmployee('${emp.id}', '${fullName}')" class="btn-action delete">Delete</button>
            </td>
        `;
        employeeListBody.appendChild(row);
    });
}

// Action Handlers (Redirects)
function viewEmployee(id) {
    window.location.href = `employee_view.html?id=${id}`;
}

function editEmployee(id) {
    window.location.href = `employee_edit.html?id=${id}`;
}


/* ====================================================================
   IV. INITIALIZATION
==================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    // KRITIKAL: Tawagin ang function dito
    // 1. Initialize Sidebar/UI (Sidebar, Dropdown, Logout)
    initSidebarUI(); 
    
    // 2. Employee List Page Initialization
    const employeeTableBody = document.getElementById('employeeTable'); 
    const employeeSearch = document.getElementById('search');          
    const gotoAddBtn = document.getElementById('gotoAdd');
    const departmentFilter = document.getElementById('departmentFilter');

    if (employeeTableBody) {
        // Initial data load at filter population
        await fetchDepartmentsForFilter();
        await fetchEmployees(); 

        // Set up Event Listeners
        if (employeeSearch) {
             let searchTimeout;
             employeeSearch.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    fetchEmployees(employeeSearch.value.trim(), departmentFilter.value);
                }, 500); // 500ms debounce
             });
        }
        
        if (departmentFilter) {
            departmentFilter.addEventListener('change', () => {
                 fetchEmployees(employeeSearch.value.trim(), departmentFilter.value);
            });
        }
        
        if (gotoAddBtn) {
            gotoAddBtn.addEventListener('click', () => {
                window.location.href = 'employee_add.html';
            });
        }
        
        // Gawing available ang action functions sa global scope
        window.viewEmployee = viewEmployee;
        window.editEmployee = editEmployee;
        window.deleteEmployee = deleteEmployee;
    }
});