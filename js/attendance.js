import supabase from './supabaseClient.js';
import { initAuthUI } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize authentication and get logged-in user (may be null for guests)
    const loggedInUser = initAuthUI();
    const userRole = loggedInUser?.role || 'Guest';
    const userId = loggedInUser?.id || null;

    // DOM elements
    const dateInput = document.getElementById("attendanceDate");
    const searchInput = document.getElementById("search");
    const tableElement = document.getElementById("attendanceTable");
    const totalAttendance = document.getElementById("totalAttendance");
    const logAttendanceBtn = document.getElementById("logAttendanceBtn");

    // Pagination
    let currentPage = 1;
    const rowsPerPage = 10;
    let filteredData = [];

    // Set today's date as default
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;

    // -------------------------
    // Fetch Attendance Records
    // -------------------------
    async function fetchAttendance() {
        try {
            let { data, error } = await supabase
                .from('attendance')
                .select(`
                    id,
                    employee_id,
                    date,
                    hours_worked,
                    status,
                    created_at,
                    updated_at,
                    employees(first_name,last_name,department,position)
                `)
                .order('date', { ascending: false });

            if (error) throw error;

            // Map records with employee info
            return data.map(record => ({
                ...record,
                name: record.employees ? `${record.employees.first_name} ${record.employees.last_name}` : "N/A",
                department: record.employees?.department || "",
                position: record.employees?.position || "",
                timeIn: record.status === "Present" ? "08:00:00 AM" : "--", // placeholder
                timeOut: record.status === "LoggedOut" ? "05:00:00 PM" : "--" // placeholder
            }));
        } catch (e) {
            console.error("Error fetching attendance:", e);
            alert("Failed to load attendance records from database.");
            return [];
        }
    }

    // -------------------------
    // Compute total hours
    // -------------------------
    function parseTimeToSeconds(t) {
        if (!t || t === "--") return null;
        const m = t.match(/(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i);
        if (!m) return null;
        let hh = parseInt(m[1], 10);
        const mm = parseInt(m[2], 10);
        const ss = parseInt(m[3], 10);
        const ampm = m[4].toUpperCase();
        if (ampm === "AM" && hh === 12) hh = 0;
        if (ampm === "PM" && hh !== 12) hh += 12;
        return hh * 3600 + mm * 60 + ss;
    }

    function computeHours(timeIn, timeOut) {
        if (!timeIn || !timeOut || timeOut === "--") return "--";
        const s1 = parseTimeToSeconds(timeIn);
        const s2 = parseTimeToSeconds(timeOut);
        if (s1 === null || s2 === null) return "--";
        let diffSec = s2 - s1;
        if (diffSec < 0) diffSec += 24 * 3600;
        return (diffSec / 3600).toFixed(2);
    }

    // -------------------------
    // Load table with filters
    // -------------------------
    async function loadTable() {
        const selectedDate = dateInput.value;
        const searchValue = searchInput.value.toLowerCase();

        let allData = await fetchAttendance();

        // Filter by date
        filteredData = allData.filter(r => r.date === selectedDate);

        // Filter by search
        if (searchValue) {
            filteredData = filteredData.filter(r =>
                r.name.toLowerCase().includes(searchValue) ||
                r.employee_id.toLowerCase().includes(searchValue)
            );
        }

        updateTotalAttendance(filteredData.length);
        renderPaginatedTable();
    }

    function updateTotalAttendance(count) {
        totalAttendance.textContent = userRole === "Employee"
            ? `My Records: ${count}`
            : `Total Attendance: ${count}`;
    }

    // -------------------------
    // Render table
    // -------------------------
    function renderTable(list) {
        let html = "";
        if (list.length === 0) {
            html = `<tr><td colspan="8" style="text-align:center;">No records found</td></tr>`;
        } else {
            list.forEach(r => {
                const totalHours = computeHours(r.timeIn, r.timeOut);
                html += `
                    <tr>
                        <td>${r.employee_id}</td>
                        <td>${r.name}</td>
                        <td>${r.department}</td>
                        <td>${r.position}</td>
                        <td>${r.date}</td>
                        <td>${r.timeIn}</td>
                        <td>${r.timeOut}</td>
                        <td>
                            ${r.timeOut === "--"
                                ? `<button onclick="logTimeOut('${r.id}')"
                                    style="background:#e74c3c;color:white;padding:6px 10px;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">
                                    Logout</button>`
                                : `<span style="color:gray;font-size:12px;">${totalHours} hrs</span>`}
                        </td>
                    </tr>
                `;
            });
        }
        tableElement.innerHTML = html;
    }

    // -------------------------
    // Pagination
    // -------------------------
    function renderPaginatedTable() {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        renderTable(filteredData.slice(start, end));
        renderPaginationControls();
    }

    function renderPaginationControls() {
        let paginationDiv = document.getElementById("paginationControls");
        if (!paginationDiv) {
            paginationDiv = document.createElement("div");
            paginationDiv.id = "paginationControls";
            paginationDiv.style.marginTop = "10px";
            paginationDiv.style.display = "flex";
            paginationDiv.style.justifyContent = "center";
            paginationDiv.style.gap = "10px";
            document.querySelector(".main").appendChild(paginationDiv);
        }
        const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
        paginationDiv.innerHTML = `
            <button style="background:#8e44ad;color:white;padding:6px 12px;border:none;border-radius:3px;"
                ${currentPage === 1 ? "disabled" : ""} onclick="prevPage()">Previous</button>
            <span>Page ${currentPage} of ${totalPages}</span>
            <button style="background:#8e44ad;color:white;padding:6px 12px;border:none;border-radius:3px;"
                ${currentPage === totalPages ? "disabled" : ""} onclick="nextPage()">Next</button>
        `;
    }

    window.prevPage = function() { if (currentPage > 1) { currentPage--; renderPaginatedTable(); } };
    window.nextPage = function() { const totalPages = Math.ceil(filteredData.length / rowsPerPage); if (currentPage < totalPages) { currentPage++; renderPaginatedTable(); } };

    // -------------------------
    // Log time out
    // -------------------------
    window.logTimeOut = async function(recordId) {
        try {
            const now = new Date().toISOString();
            const { error } = await supabase
                .from('attendance')
                .update({ status: 'LoggedOut', updated_at: now })
                .eq('id', recordId);

            if (error) throw error;

            alert("Successfully logged out!");
            loadTable();
        } catch (e) {
            console.error("Logout error:", e);
            alert("Failed to log out.");
        }
    };

    // -------------------------
    // Event Listeners
    // -------------------------
    dateInput.addEventListener("change", () => { currentPage = 1; loadTable(); });
    searchInput.addEventListener("input", () => { currentPage = 1; loadTable(); });

    if (logAttendanceBtn) {
        logAttendanceBtn.addEventListener("click", () => {
            window.location.href = "in&out.html";
        });
    }

    // Initial load
    loadTable();
});
