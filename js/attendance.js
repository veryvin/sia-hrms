document.addEventListener("DOMContentLoaded", () => {
    // 1. Supabase Initialization
    // *** REPLACE WITH YOUR ACTUAL KEYS ***
    const SUPABASE_URL = 'https://kfsjewtfpeohdbxyrlcz.supabase.co'; 
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmc2pld3RmcGVvaGRieHlybGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzU5NjQsImV4cCI6MjA3OTIxMTk2NH0.wrszJi_YC74iYE7oaHvbWBo5JmfY_Enc8VQg5wwggrw';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // ***********************************

function getRecords() {
    try {
        return JSON.parse(localStorage.getItem(ATT_KEY)) || [];
    } catch (e) {
        console.error("Failed to parse attendance records:", e);
        return [];
    }
}

function saveRecords(data) {
    localStorage.setItem(ATT_KEY, JSON.stringify(data));
}

/* ===============================
   HELPERS
================================ */
// Parse "08:30:00 AM" → seconds
function parseTimeToSeconds(t) {
    if (!t || t === "--") return null;
    const m = t.match(/(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i);
    if (!m) return null;

    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ss = parseInt(m[3], 10);
    const ampm = m[4].toUpperCase();

    if (ampm === "AM") {
        if (hh === 12) hh = 0;
    } else {
        if (hh !== 12) hh += 12;
    }

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

/* ===============================
   PAGE: attendance.html
================================ */
if (window.location.pathname.includes("attendance.html")) {

    const dateInput = document.getElementById("attendanceDate");
    const searchInput = document.getElementById("search");
    const tableElement = document.getElementById("attendanceTable");
    const totalAttendance = document.getElementById("totalAttendance");
    const logAttendanceBtn = document.getElementById("logAttendanceBtn");

    let currentPage = 1;
    const rowsPerPage = 10;
    let filteredData = [];

    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;

    // Get logged in user info
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const userRole = loggedInUser.role || 'Employee';
    const userId = loggedInUser.id || '';

    // Create sample data if empty
    if (getRecords().length === 0) {
        saveRecords([
            {
                id: "hr",
                name: "HR Admin",
                department: "Human Resources",
                position: "HR Manager",
                date: today,
                timeIn: "08:00:00 AM",
                timeOut: "05:00:00 PM"
            },
            {
                id: "emp",
                name: "John Doe",
                department: "Sales",
                position: "Sales Associate",
                date: today,
                timeIn: "08:15:00 AM",
                timeOut: "--"
            }
        ]);
    }

    /* ---------------------------
       ROLE-BASED UI ADJUSTMENTS
    --------------------------- */
    function adjustUIForRole() {
        if (userRole === "Employee") {
            // Hide search box for employees (they only see their own data)
            if (searchInput) {
                searchInput.parentElement.style.display = "none";
            }
            
            // Hide the "Log Attendance" button for employees (optional)
            // Uncomment if you don't want employees to manually log attendance
            // if (logAttendanceBtn) {
            //     logAttendanceBtn.style.display = "none";
            // }
            
            // Change the header text
            const header = document.querySelector("header h1");
            if (header) {
                header.textContent = "My Attendance";
            }
            
            const headerDesc = document.querySelector("header p");
            if (headerDesc) {
                headerDesc.textContent = "View your time and attendance records";
            }
        }
    }

    /* ---------------------------
       MAIN TABLE LOADING (UPDATED)
    --------------------------- */
    function loadTable() {
        const selectedDate = dateInput.value;
        const searchValue = searchInput.value.toLowerCase();

        let all = getRecords();

        // 🔥 FILTER BY ROLE: Employees only see their own records
        if (userRole === "Employee") {
            all = all.filter(r => r.id === userId);
        }

        // Apply date and search filters
        filteredData = all.filter(r =>
            r.date === selectedDate &&
            (
                (r.name || "").toLowerCase().includes(searchValue) ||
                (r.id || "").toLowerCase().includes(searchValue)
            )
        );

        updateTotalAttendance(filteredData.length);
        renderPaginatedTable();
    }

    function updateTotalAttendance(count) {
        if (userRole === "Employee") {
            totalAttendance.textContent = `My Records: ${count}`;
        } else {
            totalAttendance.textContent = `Total Attendance: ${count}`;
        }
    }

    /* ---------------------------
       PAGINATION
    --------------------------- */
    function renderPaginatedTable() {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        renderTable(filteredData.slice(start, end));
        renderPaginationControls();
    }

    /* ---------------------------
       RENDER TABLE ROWS
    --------------------------- */
    function renderTable(list) {
        let html = "";

        if (list.length === 0) {
            html = `<tr><td colspan="8" style="text-align:center;">No records found</td></tr>`;
        } else {
            list.forEach(r => {
                const totalHours = computeHours(r.timeIn, r.timeOut);

                html += `
                    <tr>
                        <td>${r.id}</td>
                        <td>${r.name}</td>
                        <td>${r.department}</td>
                        <td>${r.position}</td>
                        <td>${r.date}</td>
                        <td>${r.timeIn}</td>
                        <td>${r.timeOut}</td>
                        <td>
                            ${
                                r.timeOut === "--" ?
                                `<button 
                                    onclick="goLogout('${r.id}')"
                                    style="
                                        background:#e74c3c;
                                        color:white;
                                        padding:6px 10px;
                                        border:none;
                                        border-radius:4px;
                                        cursor:pointer;
                                        font-weight:bold;
                                    "
                                >Logout</button>` :
                                `<span style="color:gray;font-size:12px;">${totalHours} hrs</span>`
                            }
                        </td>
                    </tr>
                `;
            });
        }

        tableElement.innerHTML = html;
    }

    /* ---------------------------
       PAGINATION BUTTONS
    --------------------------- */
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
            <button 
                style="background:#8e44ad;color:white;padding:6px 12px;border:none;border-radius:3px;"
                ${currentPage === 1 ? "disabled" : ""}
                onclick="prevPage()"
            >Previous</button>

            <span>Page ${currentPage} of ${totalPages}</span>

            <button 
                style="background:#8e44ad;color:white;padding:6px 12px;border:none;border-radius:3px;"
                ${currentPage === totalPages ? "disabled" : ""}
                onclick="nextPage()"
            >Next</button>
        `;
        attendanceList.appendChild(card);
    }

    // 2. 🟢 Function to Fetch Data (JOINING employees table)
    async function fetchAttendanceData() {
        attendanceList.innerHTML = ''; 

            const { data, error } = await supabase
            .from('attendance')
            .select('*, employees:employee_id(first_name, last_name)') // Cleaned up query string
            .order('date', { ascending: false });

    /* ---------------------------
       LOGOUT BUTTON
    --------------------------- */
    window.goLogout = function(empId) {
        const all = getRecords();
        const record = all.find(r => r.id === empId && r.timeOut === "--");

        if (record) {
            const now = new Date();
            record.timeOut = now.toLocaleTimeString(
                'en-US',
                { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }
            );

            saveRecords(all);
            loadTable();
            alert("Successfully logged out!");
        }
    };

    /* ---------------------------
       LOG ATTENDANCE BUTTON
    --------------------------- */
    if (logAttendanceBtn) {
        logAttendanceBtn.addEventListener("click", () => {
            if (typeof showTimeTracker === 'function') {
                showTimeTracker();
            } else {
                window.location.href = "in&out.html";
            }
        });
    }

    /* ---------------------------
       EVENT LISTENERS
    --------------------------- */
    dateInput.addEventListener("change", () => { currentPage = 1; loadTable(); });
    searchInput.addEventListener("input", () => { currentPage = 1; loadTable(); });

    // Apply role-based UI changes
    adjustUIForRole();
    
    // Initial load
    loadTable();
}
}
});
