// ==================== CLEANED TIME TRACKER LOGIC ====================

const ATT_KEY = "attendance_records";

// Get all attendance records
function getRecords() {
    try {
        return JSON.parse(localStorage.getItem(ATT_KEY)) || [];
    } catch {
        return [];
    }
}

function saveRecords(records) {
    localStorage.setItem(ATT_KEY, JSON.stringify(records));
}

// Get today's record for employee
function getTodayRecord(empId) {
    if (!empId) return null;
    const today = new Date().toISOString().split("T")[0];
    return getRecords().find(r => r.id === empId && r.date === today) || null;
}

// Formatting helpers
function formatTime(date = new Date()) {
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });
}

function formatDate(date = new Date()) {
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}

// Check if all fields filled
function allFieldsFilled() {
    return ["inputEmpId", "inputName", "inputDepartment", "inputPosition"]
        .every(id => document.getElementById(id).value.trim() !== "");
}

// Update button state
function updateButtonState() {
    const empId = document.getElementById("inputEmpId").value.trim();
    const today = getTodayRecord(empId);
    const btnIn = document.getElementById("btnTimeIn");
    const btnOut = document.getElementById("btnTimeOut");
    const status = document.querySelector(".status-badge") || document.createElement('div');

    const checkedIn = today && today.timeOut === null;

    if (btnIn) btnIn.disabled = !allFieldsFilled() || checkedIn;
    if (btnOut) btnOut.disabled = !allFieldsFilled() || !checkedIn;

    // If there is a status-badge in DOM update it (in your HTML it's present in render HTML, but we keep safe guard)
    if (document.querySelector('.status-badge')) {
        const statusBadge = document.querySelector('.status-badge');
        if (checkedIn) {
            statusBadge.className = 'status-badge active';
            statusBadge.textContent = '● Clocked In';
        } else {
            statusBadge.className = 'status-badge inactive';
            statusBadge.textContent = '○ Clocked Out';
        }
    }
}

// Auto-fill based on Employee ID
function autoFillFields() {
    const empId = document.getElementById("inputEmpId").value.trim();
    const name = document.getElementById("inputName");
    const dept = document.getElementById("inputDepartment");
    const pos = document.getElementById("inputPosition");

    if (!empId) return updateButtonState();

    const today = getTodayRecord(empId);
    const previous = getRecords().slice().reverse().find(r => r.id === empId);

    // Use today’s record > previous record
    const data = today || previous;

    if (data) {
        name.value = data.name || "";
        dept.value = data.department || "";
        pos.value = data.position || "";
    }

    const locked = today && today.timeOut === null;
    [name, dept, pos, document.getElementById("inputEmpId")]
        .forEach(el => el.disabled = locked);

    updateButtonState();
}

// Alerts
function showAlert(message, type = 'success') {
    const alertBox = document.getElementById('alertBox');
    if (!alertBox) {
        alert(message);
        return;
    }
    alertBox.textContent = message;
    alertBox.className = `alert show ${type}`;
    setTimeout(() => alertBox.classList.remove('show'), 3000);
}

// Get current employee data from inputs
function getCurrentEmployeeData() {
    return {
        id: document.getElementById('inputEmpId').value.trim(),
        name: document.getElementById('inputName').value.trim(),
        department: document.getElementById('inputDepartment').value.trim(),
        position: document.getElementById('inputPosition').value.trim()
    };
}

// Time In
function handleTimeIn() {
    const employee = getCurrentEmployeeData();
    if (!employee.id || !employee.name) {
        showAlert('Please fill required fields', 'error');
        return;
    }
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const records = getRecords();

    // Prevent duplicate login for same employee on same date
    const alreadyLoggedIn = records.some(r =>
        r.id === employee.id &&
        r.date === today &&
        r.timeOut === null
    );

    if (alreadyLoggedIn) {
        showAlert('This employee already timed in and didn\'t time out yet.', 'warning');
        return;
    }

    records.push({
        id: employee.id,
        name: employee.name,
        department: employee.department,
        position: employee.position,
        date: today,
        timeIn: formatTime(now),
        timeOut: null // store as null initially
    });

    saveRecords(records);

    // Optionally store minimal last-known user (not used by attendance page)
    localStorage.setItem('loggedInUser', JSON.stringify(employee));

    showAlert('Time In recorded successfully! Refreshing...', 'success');

    setTimeout(() => {
        location.reload();
    }, 1000);
}

// Time Out
function handleTimeOut() {
    const employee = getCurrentEmployeeData();
    const todayRecord = getTodayRecord(employee.id);

    if (!todayRecord || todayRecord.timeOut !== null) {
        showAlert('You need to Time In first!', 'error');
        return;
    }

    const now = new Date();
    const records = getRecords();

    // find index of active record (timeOut === null)
    const index = records.findIndex(r =>
        r.id === employee.id &&
        r.date === todayRecord.date &&
        r.timeOut === null
    );

    if (index !== -1) {
        records[index].timeOut = formatTime(now);
        saveRecords(records);

        // Clear logged in user data (optional)
        localStorage.setItem('loggedInUser', JSON.stringify({}));

        showAlert('Time Out recorded successfully! Refreshing...', 'success');

        setTimeout(() => {
            location.reload();
        }, 1000);
    } else {
        showAlert('No active Time In found for that ID', 'error');
    }
}

// Live Clock
function startClock() {
    setInterval(() => {
        const el = document.getElementById('currentTime');
        if (el) el.textContent = formatTime();
    }, 1000);
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('currentDate').textContent = formatDate();

    const inputEmpId = document.getElementById("inputEmpId");
    const inputName = document.getElementById("inputName");
    const inputDepartment = document.getElementById("inputDepartment");
    const inputPosition = document.getElementById("inputPosition");
    const btnTimeIn = document.getElementById("btnTimeIn");
    const btnTimeOut = document.getElementById("btnTimeOut");

    // Attach listeners
    if (inputEmpId) inputEmpId.addEventListener('input', autoFillFields);
    [inputName, inputDepartment, inputPosition].forEach(input => {
        if (input) input.addEventListener('input', updateButtonState);
    });

    if (btnTimeIn) btnTimeIn.addEventListener('click', handleTimeIn);
    if (btnTimeOut) btnTimeOut.addEventListener('click', handleTimeOut);

    startClock();
    updateButtonState();
});

// Load attendance from localStorage
function loadAttendance() {
    return JSON.parse(localStorage.getItem("attendance")) || [];
}

function saveAttendance(data) {
    localStorage.setItem("attendance", JSON.stringify(data));
}

// Format date / time
function getCurrentTime() {
    return new Date().toLocaleTimeString("en-US", { hour12: true });
}

function getCurrentDate() {
    return new Date().toLocaleDateString("en-US");
}

// Validate fields first
function validateInputs() {
    if (!empId.value || !empName.value || !empDept.value || !empPos.value) {
        showAlert("error", "Please complete all fields.");
        return false;
    }
    return true;
}

/* ===============================
   TIME IN
================================ */
btnIn.addEventListener("click", () => {

    if (!validateInputs()) return;

    let data = loadAttendance();
    let date = getCurrentDate();

    // Check if there's already a Time In for this ID today
    let existing = data.find(
        r => r.id === empId.value && r.date === date
    );

    if (existing && existing.timeIn !== null) {
        showAlert("warning", "You already have TIME IN today. Use TIME OUT.");
        return;
    }

    if (!existing) {
        // Create new record
        data.push({
            id: empId.value,
            name: empName.value,
            department: empDept.value,
            position: empPos.value,
            date: date,
            timeIn: getCurrentTime(),
            timeOut: null,
            totalHours: ""
        });
    } else {
        existing.timeIn = getCurrentTime();
    }

    saveAttendance(data);
    showAlert("success", "TIME IN recorded successfully!");
});


/* ===============================
   TIME OUT
================================ */
btnOut.addEventListener("click", () => {

    if (!validateInputs()) return;

    let data = loadAttendance();
    let date = getCurrentDate();

    let record = data.find(
        r => r.id === empId.value && r.date === date
    );

    if (!record) {
        showAlert("error", "No TIME IN found. Please TIME IN first.");
        return;
    }

    if (record.timeOut !== null) {
        showAlert("warning", "You already have TIME OUT today.");
        return;
    }

    record.timeOut = getCurrentTime();

    // Calculate hours
    let tIn = new Date(`${record.date} ${record.timeIn}`);
    let tOut = new Date(`${record.date} ${record.timeOut}`);

    let diff = (tOut - tIn) / 3600000;
    record.totalHours = diff.toFixed(2) + " hrs";

    saveAttendance(data);
    showAlert("success", "TIME OUT recorded successfully!");
});

