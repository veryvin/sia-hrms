/* ===============================
   GLOBAL STORAGE KEYS
================================ */
const ATT_KEY = "attendance_records";

function getRecords() {
    return JSON.parse(localStorage.getItem(ATT_KEY)) || [];
}
function saveRecords(data) {
    localStorage.setItem(ATT_KEY, JSON.stringify(data));
}

/* ===============================
   PAGE: attendance.html
================================ */
if (window.location.pathname.includes("attendance.html")) {

    const dateInput = document.getElementById("attendanceDate");
    const searchInput = document.getElementById("search");
    const tableElement = document.querySelector("table");
    const totalAttendance = document.getElementById("totalAttendance");

    // Pagination state
    let currentPage = 1;
    const rowsPerPage = 10;
    let filteredData = [];

    // Set today’s date
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;

    /* -----------------------------------
       MAIN LOADING FUNCTION
    ----------------------------------- */
    function loadTable() {
        const selectedDate = dateInput.value;
        const searchValue = searchInput.value.toLowerCase();

        const all = getRecords();

        // Filter by date + search
        filteredData = all.filter(r =>
            r.date === selectedDate &&
            r.name.toLowerCase().includes(searchValue)
        );

        updateTotalAttendance(filteredData.length);
        renderPaginatedTable();
    }

    /* -----------------------------------
       Update total attendance label
    ----------------------------------- */
    function updateTotalAttendance(count) {
        totalAttendance.textContent = `Total Attendance: ${count}`;
    }

    /* -----------------------------------
       Render Pagination Table
    ----------------------------------- */
    function renderPaginatedTable() {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        const paginatedRows = filteredData.slice(start, end);

        renderTable(paginatedRows);
        renderPaginationControls();
    }

    /* -----------------------------------
       Render Table Rows
    ----------------------------------- */
    function renderTable(list) {
    let html = `
    <thead>
        <tr>
          <th>EMPLOYEE ID</th>
          <th>EMPLOYEE NAME</th>
          <th>DEPARTMENT</th>
          <th>POSITION</th>
          <th>DATE</th>
          <th>TIME IN</th>
          <th>TIME OUT</th>
          <th>ACTIONS</th>
        </tr>
    </thead>
    <tbody>
    `;

    if (list.length === 0) {
        html += `<tr><td colspan="8" style="text-align:center;">No records found</td></tr>`;
    } else {
        list.forEach(r => {
            const showLogout = r.timeOut === "--";

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
                        showLogout
                        ? `<button 
                                onclick="goLogout('${r.id}')"
                                style="
                                    background: #e74c3c;
                                    color: white;
                                    border: none;
                                    padding: 6px 10px;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    font-weight: bold;
                                "
                           >Logout</button>`
                        : `<span style="color: gray; font-size: 12px;">Completed</span>`
                    }
                </td>
            </tr>`;
        });
    }

    html += `</tbody>`;
    tableElement.innerHTML = html;
}


    /* -----------------------------------
       Pagination Buttons
    ----------------------------------- */
    function renderPaginationControls() {
        let paginationDiv = document.getElementById("paginationControls");

        if (!paginationDiv) {
            paginationDiv = document.createElement("div");
            paginationDiv.id = "paginationControls";
            paginationDiv.style.marginTop = "10px";
            paginationDiv.style.display = "flex";
            paginationDiv.style.justifyContent = "center";
            paginationDiv.style.gap = "10px";
            tableElement.insertAdjacentElement("afterend", paginationDiv);
        }

        const totalPages = Math.ceil(filteredData.length / rowsPerPage);

        paginationDiv.innerHTML = `
            <button style ="background: #8e44ad; color: white; border: none; padding: 6px; border-radius: 3px;" ${currentPage === 1 ? "disabled" : ""} onclick="prevPage()">Previous</button>
            <span>Page ${currentPage} of ${totalPages || 1}</span>
            <button style ="background: #8e44ad; color: white; border: none; padding: 6px; border-radius: 3px;" ${currentPage === totalPages ? "disabled" : ""} onclick="nextPage()">Next</button>
        `;
    }

    window.prevPage = function() {
        if (currentPage > 1) {
            currentPage--;
            renderPaginatedTable();
        }
    };

    window.nextPage = function() {
        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderPaginatedTable();
        }
    };

    /* -----------------------------------
       Logout navigation
    ----------------------------------- */
    window.goLogout = function(empId) {
        localStorage.setItem("logout_id", empId);
        window.location.href = "attendance_logout.html";
    };

    /* EVENT LISTENERS */
    dateInput.addEventListener("change", () => { currentPage = 1; loadTable(); });
    searchInput.addEventListener("input", () => { currentPage = 1; loadTable(); });

    document.querySelector(".btn-green").addEventListener("click", () => {
        window.location.href = "attendance_login.html";
    });

    loadTable();
}

/* ===============================
   PAGE: attendance_login.html
================================ */
if (window.location.pathname.includes("attendance_login.html")) {

    const form = document.querySelector("form");

    form.addEventListener("submit", e => {
        e.preventDefault();

        const inputs = form.querySelectorAll("input");

        const id = inputs[0].value;
        const name = inputs[1].value;
        const department = inputs[2].value;
        const position = inputs[3].value;

        if (!id || !name) {
            alert("Please fill in Employee ID and Name");
            return;
        }

        const now = new Date();
        const date = now.toISOString().split("T")[0];
        const time = now.toLocaleTimeString();

        const all = getRecords();

        // PREVENT DUPLICATE LOGIN ON SAME DAY
        const alreadyLoggedIn = all.some(r =>
            r.id === id &&
            r.date === date &&
            r.timeOut === "--"
        );

        if (alreadyLoggedIn) {
            alert("This employee already logged in today and has not logged out!");
            return;
        }

        const newRecord = {
            id,
            name,
            department,
            position,
            date,
            timeIn: time,
            timeOut: "--"
        };

        all.push(newRecord);
        saveRecords(all);

        alert("Attendance Logged Successfully!");
        window.location.href = "attendance.html";
    });
}

/* ===============================
   PAGE: attendance_logout.html
================================ */
if (window.location.pathname.includes("attendance_logout.html")) {

    const form = document.querySelector("form");
    const inputs = form.querySelectorAll("input");

    const logoutId = localStorage.getItem("logout_id");

    // Auto-fill logout form
    if (logoutId) {
        const all = getRecords();
        const rec = [...all].reverse().find(r =>
            r.id === logoutId && r.timeOut === "--"
        );

        if (rec) {
            inputs[0].value = rec.id;
            inputs[1].value = rec.name;
            inputs[2].value = rec.department;
            inputs[3].value = rec.position;
        }
    }

    form.addEventListener("submit", e => {
        e.preventDefault();

        const enteredId = inputs[0].value.trim();

        const all = getRecords();

        // Find an employee who is currently logged in (timeOut == "--")
        const rec = [...all].reverse().find(r =>
            r.id === enteredId && r.timeOut === "--"
        );

        if (!rec) {
            alert("No active login found for this Employee ID!");
            return;
        }

        // If auto-fill is used, still ensure matched properly
        if (logoutId && enteredId !== logoutId) {
            alert("Employee ID does not match the auto-filled record!");
            return;
        }

        // Process logout
        const now = new Date();
        rec.timeOut = now.toLocaleTimeString();

        saveRecords(all);

        alert("Successfully Logged Out!");

        localStorage.removeItem("logout_id");
        window.location.href = "attendance.html";
    });
}

