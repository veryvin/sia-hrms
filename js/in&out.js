// ==================== TIME TRACKER - SUPABASE READY ====================

// Safety check for Supabase
if (!window.supabaseClient) {
    console.error('Supabase client not initialized! Check script loading order.');
}

const supabase = window.supabaseClient;
let currentEmployee = null;

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

async function getTodayRecord(empId) {
    if (!supabase) {
        console.error('Supabase not available');
        return null;
    }
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        console.log('Fetching today record for:', empId, 'Date:', today);
        
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('employee_id', empId)
            .eq('date', today)
            .order('time_in', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error in getTodayRecord:', error);
            throw error;
        }
        
        console.log('Today record result:', data);
        
        // Return the first record if it exists, or null
        return data && data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('Error fetching today record:', error);
        return null;
    }
}

async function getTodayActiveRecord(empId) {
    if (!supabase) {
        console.error('Supabase not available');
        return null;
    }
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('employee_id', empId)
            .eq('date', today)
            .is('time_out', null)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        return data || null;
    } catch (error) {
        console.error('Error fetching active record:', error);
        return null;
    }
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

function showLoginModal() {
    document.getElementById('loginModal').classList.add('show');
    document.getElementById('clockModal').classList.remove('show');
}

async function showClockModal(empId) {
    const employee = await getEmployeeById(empId);
    
    if (!employee) {
        showAlert('Employee ID not found', 'error', 'alertBox');
        return;
    }

    currentEmployee = employee;

    const fullName = `${employee.firstName} ${employee.lastName}`;
    const position = employee.position;
    const department = employee.department;
    const photo = employee.photo || createInitialAvatar(employee.firstName, employee.lastName);

    document.getElementById('profileImg').src = photo;
    document.getElementById('displayName').textContent = fullName;
    document.getElementById('displayPosition').textContent = position;
    document.getElementById('displayId').textContent = employee.empId;

    document.getElementById('detailId').textContent = employee.empId;
    document.getElementById('detailName').textContent = fullName;
    document.getElementById('detailPosition').textContent = position;
    document.getElementById('detailDept').textContent = department;

    const today = await getTodayRecord(employee.empId);
    updateRecordsDisplay(today);

    document.getElementById('loginModal').classList.remove('show');
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

function updateRecordsDisplay(today) {
    const timeInDisplay = document.getElementById("timeInDisplay");
    const timeOutDisplay = document.getElementById("timeOutDisplay");

    if (today && today.time_in) {
        timeInDisplay.textContent = formatTimeFromISO(today.time_in);
    } else {
        timeInDisplay.textContent = "--:--:--";
    }

    if (today && today.time_out) {
        timeOutDisplay.textContent = formatTimeFromISO(today.time_out);
    } else {
        timeOutDisplay.textContent = "--:--:--";
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
        showAlert('No employee logged in', 'error');
        return;
    }

    if (!supabase) {
        showAlert('Database connection error', 'error');
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    try {
        // Check if already logged in today with active session
        const existing = await getTodayActiveRecord(currentEmployee.empId);
        
        if (existing) {
            showAlert('Already clocked in today!', 'warning');
            return;
        }

        console.log('Inserting time in for:', currentEmployee.empId);

        // Insert new attendance record
        const { data, error } = await supabase
            .from('attendance')
            .insert({
                employee_id: currentEmployee.empId,
                date: today,
                time_in: now.toISOString(),
                time_out: null
            })
            .select()
            .single();

        if (error) throw error;

        console.log('Time in recorded:', data);

        showAlert('✓ Clocked In Successfully!', 'success');
        updateRecordsDisplay(data);
    } catch (error) {
        console.error('Error clocking in:', error);
        showAlert('Error recording time in: ' + error.message, 'error');
    }
}

async function handleTimeOut() {
    if (!currentEmployee) {
        showAlert('No employee logged in', 'error');
        return;
    }

    if (!supabase) {
        showAlert('Database connection error', 'error');
        return;
    }

    try {
        const todayRecord = await getTodayActiveRecord(currentEmployee.empId);

        if (!todayRecord) {
            showAlert('You need to clock in first!', 'error');
            return;
        }

        console.log('Clocking out record:', todayRecord);

        const now = new Date();

        // Update time_out
        const { data, error } = await supabase
            .from('attendance')
            .update({ time_out: now.toISOString() })
            .eq('id', todayRecord.id)
            .select()
            .single();

        if (error) throw error;

        console.log('Time out recorded:', data);

        showAlert('✓ Clocked Out Successfully!', 'success');
        updateRecordsDisplay(data);
    } catch (error) {
        console.error('Error clocking out:', error);
        showAlert('Error recording time out: ' + error.message, 'error');
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

    document.getElementById('currentDate').textContent = formatDate();

    const inputEmpId = document.getElementById("inputEmpId");
    const btnLogin = document.getElementById("btnLogin");
    const btnLogout = document.getElementById("btnLogout");
    const btnClockInOut = document.getElementById("btnClockInOut");

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

        await showClockModal(empId);
        inputEmpId.value = '';
    });

    inputEmpId.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            btnLogin.click();
        }
    });

    btnLogout.addEventListener('click', () => {
        currentEmployee = null;
        showLoginModal();
    });

    btnClockInOut.addEventListener('click', async () => {
        if (!currentEmployee) return;
        
        // Check if there's an active record (no time_out)
        const activeRecord = await getTodayActiveRecord(currentEmployee.empId);
        
        if (!activeRecord) {
            // No active record, so clock in
            await handleTimeIn();
        } else {
            // Active record exists, so clock out
            await handleTimeOut();
        }
    });

    startClock();
    showLoginModal();
});