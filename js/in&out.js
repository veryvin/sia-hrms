// ==================== TIME TRACKER - NO LOGIN REQUIRED ====================

// Safety check for Supabase
if (!window.supabaseClient) {
    console.error('Supabase client not initialized! Check script loading order.');
}

const supabase = window.supabaseClient;
let currentEmployee = null;

// ==================== IMPROVED DATE FUNCTIONS ====================

// Get current date in YYYY-MM-DD format (LOCAL timezone)
function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Get current timestamp in ISO format
function getCurrentTimestamp() {
    return new Date().toISOString();
}

// ==================== FETCH EMPLOYEE FROM SUPABASE ====================

async function getEmployeeById(empId) {
    if (!supabase) {
        console.error('Supabase not available');
        return null;
    }
    
    try {
        const { data, error } = await supabase
            .from('employees')
            .select(`
                *,
                positions(
                    position_name,
                    departments(department_name)
                )
            `)
            .eq('employee_id', empId)
            .single();

        if (error) throw error;

        return {
            id: data.id,
            empId: data.employee_id,
            firstName: data.first_name,
            lastName: data.last_name,
            position: data.positions?.position_name || 'N/A',
            department: data.positions?.departments?.department_name || 'N/A',
            photo: data.photo_url
        };
    } catch (error) {
        console.error('Error fetching employee:', error);
        return null;
    }
}

// ==================== ATTENDANCE FUNCTIONS ====================

async function getAllTodayRecords(empId) {
    if (!supabase) {
        console.error('Supabase not available');
        return [];
    }
    
    try {
        const today = getCurrentDate();
        console.log('📅 Fetching records for date:', today);
        
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('employee_id', empId)
            .eq('date', today)
            .order('time_in', { ascending: true });

        if (error) throw error;
        
        console.log('Found records:', data);
        return data || [];
    } catch (error) {
        console.error('Error fetching today records:', error);
        return [];
    }
}

async function getTodayActiveRecord(empId) {
    if (!supabase) {
        console.error('Supabase not available');
        return null;
    }
    
    try {
        const today = getCurrentDate();
        
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('employee_id', empId)
            .eq('date', today)
            .is('time_out', null)
            .order('time_in', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        
        return data || null;
    } catch (error) {
        console.error('Error fetching active record:', error);
        return null;
    }
}

// ==================== TIME CALCULATION ====================

function calculateHoursBetween(timeIn, timeOut) {
    if (!timeIn || !timeOut) return 0;
    
    const start = new Date(timeIn);
    const end = new Date(timeOut);
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return Math.max(0, diffHours);
}

function formatHours(hours) {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
}

// ==================== FORMATTING HELPERS ====================

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

function formatTimeFromISO(isoString) {
    if (!isoString) return "--:--:--";
    const date = new Date(isoString);
    return formatTime(date);
}

// ==================== MODAL MANAGEMENT ====================

function showClockModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('clockModal').classList.add('show');
}

function createInitialAvatar(firstName, lastName) {
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#0f9e5e';
    ctx.fillRect(0, 0, 120, 120);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, 60, 60);
    
    return canvas.toDataURL();
}

// ==================== UI UPDATES ====================

async function refreshRecordsDisplay() {
    if (!currentEmployee) {
        // Clear display when no employee
        document.querySelector('.records-grid').innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #999;">
                Enter Employee ID to view records
            </div>
        `;
        return;
    }
    
    const records = await getAllTodayRecords(currentEmployee.empId);
    const activeRecord = await getTodayActiveRecord(currentEmployee.empId);
    
    updateRecordsDisplay(records, activeRecord);
    updateClockButton(activeRecord);
    updateDateDisplay();
}

function updateDateDisplay() {
    const dateElement = document.getElementById('currentDate');
    const today = getCurrentDate();
    
    dateElement.textContent = formatDate();
    console.log('📅 Current date:', today);
}

function updateRecordsDisplay(records, activeRecord) {
    const recordsGrid = document.querySelector('.records-grid');
    
    if (!records || records.length === 0) {
        recordsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #999;">
                No time entries yet today
            </div>
        `;
        return;
    }
    
    // Show single in/out record
    const record = records[0];
    const timeIn = formatTimeFromISO(record.time_in);
    const timeOut = record.time_out ? formatTimeFromISO(record.time_out) : '--:--:--';
    const isActive = record.time_out === null;
    const hours = record.time_out ? calculateHoursBetween(record.time_in, record.time_out) : 0;
    
    let html = `
        <div class="time-record in ${isActive ? 'active' : ''}">
            <span class="record-label">TIME IN</span>
            <span class="record-time">${timeIn}</span>
        </div>
        <div class="time-record out ${isActive ? 'active' : ''}">
            <span class="record-label">TIME OUT</span>
            <span class="record-time">${timeOut}</span>
            ${record.time_out ? `<span class="record-duration">${formatHours(hours)}</span>` : '<span class="record-duration" style="color:#f39c12;">Active</span>'}
        </div>
    `;
    
    // Add total hours row if clocked out
    if (record.time_out) {
        html += `
            <div class="time-record total" style="grid-column: 1 / -1; background: #e8f5e9; border: 2px solid #4caf50;">
                <span class="record-label" style="font-weight: bold; font-size: 16px;">TOTAL HOURS TODAY</span>
                <span class="record-time" style="font-weight: bold; font-size: 20px; color: #2e7d32;">${formatHours(hours)}</span>
            </div>
        `;
    }
    
    recordsGrid.innerHTML = html;
}

function updateClockButton(activeRecord) {
    const btn = document.getElementById('btnClockInOut');
    
    if (activeRecord) {
        // Currently clocked in
        btn.innerHTML = '<span class="icon">🔴</span> CLOCK OUT';
        btn.style.background = '#e74c3c';
    } else {
        // Not clocked in
        btn.innerHTML = '<span class="icon">🟢</span> CLOCK IN';
        btn.style.background = '#27ae60';
    }
}

function showAlert(message, type = 'success', alertId = 'alertBox2') {
    const alertBox = document.getElementById(alertId);
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `alert show ${type}`;
    setTimeout(() => alertBox.classList.remove('show'), 3000);
}

// ==================== TIME IN/OUT HANDLERS ====================

async function handleTimeIn() {
    if (!currentEmployee) {
        showAlert('No employee loaded. Please enter Employee ID first.', 'error');
        return;
    }

    if (!supabase) {
        showAlert('Database connection error', 'error');
        return;
    }

    const today = getCurrentDate();
    const now = getCurrentTimestamp();

    console.log('🟢 CLOCK IN ATTEMPT');
    console.log('Employee:', currentEmployee.empId);
    console.log('Date:', today);
    console.log('Timestamp:', now);

    try {
        // Check if ANY attendance record exists for today
        const allTodayRecords = await getAllTodayRecords(currentEmployee.empId);
        
        if (allTodayRecords && allTodayRecords.length > 0) {
            showAlert('⚠️ You already have attendance record(s) for today! Cannot clock in again.', 'warning');
            return;
        }

        // Insert new attendance record (only ONE per day allowed)
        const { data, error } = await supabase
            .from('attendance')
            .insert({
                employee_id: currentEmployee.empId,
                employee_uuid: currentEmployee.id,
                date: today,
                time_in: now,
                time_out: null
            })
            .select()
            .single();

        if (error) throw error;

        console.log('✅ Time in recorded:', data);

        showAlert('✅ Clocked In Successfully!', 'success');
        await refreshRecordsDisplay();
    } catch (error) {
        console.error('❌ Error clocking in:', error);
        showAlert('❌ Error recording time in: ' + error.message, 'error');
    }
}

async function handleTimeOut() {
    if (!currentEmployee) {
        showAlert('No employee loaded. Please enter Employee ID first.', 'error');
        return;
    }

    if (!supabase) {
        showAlert('Database connection error', 'error');
        return;
    }

    const now = getCurrentTimestamp();
    
    console.log('🔴 CLOCK OUT ATTEMPT');
    console.log('Employee:', currentEmployee.empId);
    console.log('Timestamp:', now);

    try {
        const activeRecord = await getTodayActiveRecord(currentEmployee.empId);

        if (!activeRecord) {
            showAlert('⚠️ No active session! Clock in first.', 'warning');
            return;
        }

        // Update time_out for the active record
        const { data, error } = await supabase
            .from('attendance')
            .update({ time_out: now })
            .eq('id', activeRecord.id)
            .select()
            .single();

        if (error) throw error;

        const duration = calculateHoursBetween(activeRecord.time_in, now);
        console.log('✅ Time out recorded:', data);

        showAlert(`✅ Clocked Out! Session: ${formatHours(duration)}`, 'success');
        await refreshRecordsDisplay();
    } catch (error) {
        console.error('❌ Error clocking out:', error);
        showAlert('❌ Error recording time out: ' + error.message, 'error');
    }
}

// ==================== CLOCK ====================

function startClock() {
    document.getElementById('currentTime').textContent = formatTime();
    setInterval(() => {
        document.getElementById('currentTime').textContent = formatTime();
    }, 1000);
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    // Check if Supabase is ready
    if (!supabase) {
        alert('Database connection failed. Please refresh the page or check your internet connection.');
        console.error('Supabase client not available on page load');
        return;
    }

    console.log('✅ Time In/Out System Initialized');
    console.log('📅 Current Date:', getCurrentDate());

    document.getElementById('currentDate').textContent = formatDate();

    const inputEmpId = document.getElementById("inputEmpId");
    const btnLogin = document.getElementById("btnLogin");
    const btnLogout = document.getElementById("btnLogout");
    const btnClockInOut = document.getElementById("btnClockInOut");

    // Show clock interface immediately (NO LOGIN REQUIRED)
    showClockModal();
    
    // Update instruction text
    const instructionText = document.querySelector('.login-modal p');
    if (instructionText) {
        instructionText.textContent = 'Enter Employee ID to clock in/out';
    }

    // Set default display
    document.getElementById('displayName').textContent = '--';
    document.getElementById('displayPosition').textContent = '--';
    document.getElementById('displayId').textContent = '--';
    document.getElementById('detailId').textContent = '--';
    document.getElementById('detailName').textContent = '--';
    document.getElementById('detailPosition').textContent = '--';
    document.getElementById('detailDept').textContent = '--';

    btnLogin.addEventListener('click', async () => {
        const empId = inputEmpId.value.trim();
        
        if (!empId) {
            showAlert('Please enter Employee ID', 'error', 'alertBox');
            return;
        }

        const employee = await getEmployeeById(empId);
        
        if (!employee) {
            showAlert('Employee ID not found in system', 'error', 'alertBox');
            return;
        }

        // Set current employee and update display
        currentEmployee = employee;
        const fullName = `${employee.firstName} ${employee.lastName}`;
        const photo = employee.photo || createInitialAvatar(employee.firstName, employee.lastName);

        document.getElementById('profileImg').src = photo;
        document.getElementById('displayName').textContent = fullName;
        document.getElementById('displayPosition').textContent = employee.position;
        document.getElementById('displayId').textContent = employee.empId;

        document.getElementById('detailId').textContent = employee.empId;
        document.getElementById('detailName').textContent = fullName;
        document.getElementById('detailPosition').textContent = employee.position;
        document.getElementById('detailDept').textContent = employee.department;

        await refreshRecordsDisplay();
        inputEmpId.value = '';
        showAlert(`✅ Employee loaded: ${fullName}`, 'success', 'alertBox2');
    });

    inputEmpId.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            btnLogin.click();
        }
    });

    btnLogout.addEventListener('click', () => {
        currentEmployee = null;
        
        // Clear employee display
        document.getElementById('displayName').textContent = '--';
        document.getElementById('displayPosition').textContent = '--';
        document.getElementById('displayId').textContent = '--';
        
        // Clear details
        document.getElementById('detailId').textContent = '--';
        document.getElementById('detailName').textContent = '--';
        document.getElementById('detailPosition').textContent = '--';
        document.getElementById('detailDept').textContent = '--';
        
        // Clear records
        document.querySelector('.records-grid').innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #999;">
                Enter Employee ID to view records
            </div>
        `;
        
        // Reset button
        const btn = document.getElementById('btnClockInOut');
        btn.innerHTML = '<span class="icon">🟢</span> CLOCK IN';
        btn.style.background = '#27ae60';
        
        showAlert('Employee cleared. Enter new ID to continue.', 'success', 'alertBox2');
        
        // Focus back to input
        inputEmpId.focus();
    });

    btnClockInOut.addEventListener('click', async () => {
        if (!currentEmployee) {
            showAlert('Please enter Employee ID first', 'warning', 'alertBox2');
            inputEmpId.focus();
            return;
        }
        
        // Check if there's an active record (no time_out)
        const activeRecord = await getTodayActiveRecord(currentEmployee.empId);
        
        if (!activeRecord) {
            // No active session, so clock in
            await handleTimeIn();
        } else {
            // Active session exists, so clock out
            await handleTimeOut();
        }
    });

    startClock();
    
    // Initial display refresh
    refreshRecordsDisplay();
    
    // Auto-refresh records every 30 seconds if logged in
    setInterval(async () => {
        if (currentEmployee) {
            await refreshRecordsDisplay();
        }
    }, 30000);
});