// /js/employee.js
import { supabase, supabaseHelper } from './supabaseClient.js';

document.addEventListener("DOMContentLoaded", async () => {

    // =====================
    // 1. Security / User Check
    // =====================
    const loggedInUserString = localStorage.getItem('loggedInUser');
    const welcomeText = document.getElementById("welcomeText");
    const userEmailDisplay = document.getElementById("userEmailDisplay");

    if (loggedInUserString) {
        const loggedInUser = JSON.parse(loggedInUserString);
        welcomeText.textContent = `Welcome, ${loggedInUser.first_name || "Admin"} (Role: ${loggedInUser.role})`;
        userEmailDisplay.textContent = loggedInUser.email;
    } else {
        welcomeText.textContent = "Welcome, Guest";
        userEmailDisplay.textContent = "";
    }

    // =====================
    // 2. Sidebar UI
    // =====================
    const logoutBtn = document.getElementById("logoutBtn");
    logoutBtn?.addEventListener("click", async () => {
        await supabaseHelper.logout();
        localStorage.removeItem("loggedInUser");
        window.location.href = "index.html";
    });

    // =====================
    // 3. Add Employee Button
    // =====================
    const gotoAddBtn = document.getElementById('gotoAdd');
    if (gotoAddBtn) {
        gotoAddBtn.addEventListener('click', () => {
            window.location.href = "employee_add.html";
        });
    } else {
        console.error('Add Employee button not found!');
    }

    // =====================
    // 4. Fetch Departments & Employees
    // =====================
    const departmentFilter = document.getElementById("departmentFilter");
    const searchInput = document.getElementById("search");
    const employeeTable = document.getElementById("employeeTable");
    const totalEmployees = document.getElementById("totalEmployees");

    async function fetchDepartments() {
        const { data, error } = await supabaseHelper.getDepartments();
        if (error) return console.error(error);
        data.forEach(dept => {
            const option = document.createElement("option");
            option.value = dept.id;
            option.textContent = dept.department_name;
            departmentFilter.appendChild(option);
        });
    }

    async function fetchEmployees(search = "", departmentId = "") {
        employeeTable.innerHTML = `<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>`;
        const { data: allEmployees, error } = await supabaseHelper.getEmployees();
        if (error) {
            employeeTable.innerHTML = `<tr><td colspan="6" style="color:red;text-align:center;">Error loading data</td></tr>`;
            return console.error(error);
        }

        let filtered = allEmployees;
        if (search) {
            const lower = search.toLowerCase();
            filtered = filtered.filter(emp =>
                emp.first_name.toLowerCase().includes(lower) ||
                emp.last_name.toLowerCase().includes(lower) ||
                emp.email.toLowerCase().includes(lower)
            );
        }
        if (departmentId) filtered = filtered.filter(emp => emp.department_id === departmentId);

        totalEmployees.textContent = `${filtered.length} total employees`;

        employeeTable.innerHTML = filtered.length
            ? filtered.map(emp => {
                const fullName = `${emp.last_name}, ${emp.first_name}`;
                const departmentName = emp.departments?.department_name || "N/A";
                const positionName = emp.positions?.position_name || "N/A";
                const salary = `₱${Number(emp.monthly_salary || 0).toLocaleString("en-PH", {minimumFractionDigits:2})}`;
                let statusClass = "status-inactive", statusText = emp.status || "Inactive";
                if (emp.status === "Active" || emp.status === "Regular") statusClass = "status-active";
                else if (emp.status === "Probationary") statusClass = "status-warning";
                else if (emp.status === "On Leave") statusClass = "status-leave";

                return `<tr>
                    <td><strong>${fullName}</strong><br><small>${emp.email}</small></td>
                    <td>${positionName}</td>
                    <td>${departmentName}</td>
                    <td><span class="status ${statusClass}">${statusText}</span></td>
                    <td>${salary}</td>
                    <td>
                        <button class="btn-action view" onclick="viewEmployee('${emp.id}')">View</button>
                        <button class="btn-action edit" onclick="editEmployee('${emp.id}')">Edit</button>
                        <button class="btn-action delete" onclick="deleteEmployee('${emp.id}', '${fullName}')">Delete</button>
                    </td>
                </tr>`;
            }).join('')
            : `<tr><td colspan="6" style="text-align:center;">No employees found</td></tr>`;
    }

    await fetchDepartments();
    await fetchEmployees();

    // =====================
    // 5. Search & Filter
    // =====================
    let searchTimeout;
    searchInput?.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            fetchEmployees(searchInput.value.trim(), departmentFilter.value);
        }, 300);
    });
    departmentFilter?.addEventListener("change", () => {
        fetchEmployees(searchInput.value.trim(), departmentFilter.value);
    });

    // =====================
    // 6. Global Action Functions
    // =====================
    window.viewEmployee = id => window.location.href = `employee_view.html?id=${id}`;
    window.editEmployee = id => window.location.href = `employee_edit.html?id=${id}`;
    window.deleteEmployee = async (id, name) => {
        if (!confirm(`Delete ${name}?`)) return;
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (error) alert(`Failed: ${error.message}`);
        else fetchEmployees();
    };
});
