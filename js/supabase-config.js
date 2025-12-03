// ===================================================
// SUPABASE CONFIGURATION
// ===================================================

const SUPABASE_URL = 'https://iwaibzskwxkonojilfhg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YWlienNrd3hrb25vamlsZmhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjkyMDY1MCwiZXhwIjoyMDc4NDk2NjUwfQ.9pTCt8OxOlTv4wUUY2Fg8T8zRCmL4bf4Jkh43yEOm8E';

// Initialize Supabase client
let supabaseClient;
if (typeof supabase !== 'undefined') {
  const { createClient } = supabase;
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  window.supabaseClient = supabaseClient;
  console.log('✅ Supabase client initialized successfully');
} else {
  console.error('❌ Supabase library not loaded. Make sure to include the Supabase CDN script before this file.');
}

// ===================================================
// HELPER FUNCTIONS
// ===================================================

function handleSupabaseError(error, context) {
  console.error(`Supabase Error (${context}):`, error);
  return null;
}

function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = '<tr><td colspan="10" class="empty">Loading...</td></tr>';
  }
}

window.handleSupabaseError = handleSupabaseError;
window.showLoading = showLoading;

// ===================================================
// ROLE DEFINITIONS - Positions with Limited Access
// ===================================================
const RESTRICTED_POSITIONS = [
  'Employee',
  'Driver', 
  'Dispatcher',
  'employee',
  'driver',
  'dispatcher'
];

// Check if position has limited access (case-insensitive)
function isRestrictedPosition(position) {
  if (!position) return false;
  const normalizedPosition = position.toLowerCase().trim();
  return RESTRICTED_POSITIONS.some(p => p.toLowerCase() === normalizedPosition);
}

// ===================================================
// LOGIN PAGE - WITH ROLE RESTRICTIONS
// ===================================================

document.addEventListener("DOMContentLoaded", () => {
    
    const supabase = supabaseClient;

    if (!supabase) {
        console.error("⚠️ Supabase client not initialized");
        return;
    }

    const ADMIN_PIN = "123456";

    const loginForm = document.getElementById("loginForm");
    const createBtn = document.getElementById("createBtn");
    const errorMessage = document.getElementById("errorMessage");

    if (!loginForm) {
        console.error("⚠ loginForm not found — Check index.html ID");
        return;
    }

    // ===================================================
    // LOGIN HANDLER - WITH POSITION-BASED RESTRICTIONS
    // ===================================================
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const employeeId = document.getElementById("employeeId").value.trim();
        const pwd = document.getElementById("password").value.trim();

        console.log("🔍 Attempting login with employee_id:", employeeId);
        errorMessage.style.display = "none";

        try {
            // Get Employee Record
            const { data: employees, error: empError } = await supabase
                .from('employees')
                .select('*')
                .eq('employee_id', employeeId);

            if (empError) {
                console.log("❌ Database error:", empError);
                errorMessage.textContent = "❌ Database error. Please try again.";
                errorMessage.style.display = "block";
                return;
            }

            if (!employees || employees.length === 0) {
                console.log("⚠️ Employee not found in database");
                errorMessage.textContent = "❌ Invalid Employee ID or Password.";
                errorMessage.style.display = "block";
                return;
            }

            const employee = employees[0];
            console.log("📊 Employee found:", employee);

            // Verify Password
            if (employee.password !== pwd) {
                console.log("⚠️ Password mismatch!");
                errorMessage.textContent = "❌ Invalid Employee ID or Password.";
                errorMessage.style.display = "block";
                return;
            }

            console.log("✅ Password correct! Fetching position data...");

            // Get Position, Department, and Role
            let role = 'Employee';
            let positionName = 'Employee';
            let departmentName = 'Unassigned';

            if (employee.position_id) {
                console.log("🔍 Fetching position for position_id:", employee.position_id);

                const { data: positions, error: posError } = await supabase
                    .from('positions')
                    .select('position_name, department_id, role_id')
                    .eq('id', employee.position_id);

                if (posError) {
                    console.log("❌ Position error:", posError);
                } else if (positions && positions.length > 0) {
                    const position = positions[0];
                    console.log("📊 Position data:", position);
                    positionName = position.position_name || 'Employee';

                    // Get department name
                    if (position.department_id) {
                        const { data: depts, error: deptError } = await supabase
                            .from('departments')
                            .select('department_name')
                            .eq('id', position.department_id);
                        
                        if (deptError) {
                            console.log("❌ Department error:", deptError);
                        } else if (depts && depts.length > 0) {
                            console.log("📊 Department data:", depts[0]);
                            departmentName = depts[0].department_name;
                        }
                    }

                    // Get role name
                    if (position.role_id) {
                        const { data: roles, error: roleError } = await supabase
                            .from('roles')
                            .select('role_name')
                            .eq('id', position.role_id);
                        
                        if (roleError) {
                            console.log("❌ Role error:", roleError);
                        } else if (roles && roles.length > 0) {
                            console.log("📊 Role data:", roles[0]);
                            role = roles[0].role_name;
                        }
                    }
                } else {
                    console.warn("⚠️ Position not found for position_id:", employee.position_id);
                }
            } else {
                console.warn("⚠️ Employee has no position_id assigned");
            }

            console.log("📊 Final extracted data:");
            console.log("   - Role:", role);
            console.log("   - Position:", positionName);
            console.log("   - Department:", departmentName);

            // CRITICAL: Check if position has restricted access
            const hasRestrictedAccess = isRestrictedPosition(positionName);
            console.log("🔒 Restricted access:", hasRestrictedAccess);

            // Build User Session with all necessary fields
            const userSession = {
                id: employee.id,
                employee_id: employee.employee_id,
                empId: employee.employee_id,
                email: employee.email,
                first_name: employee.first_name,
                last_name: employee.last_name,
                firstName: employee.first_name,
                lastName: employee.last_name,
                role: role,
                position: positionName,
                department: departmentName,
                // Add flag for restricted positions
                isRestricted: hasRestrictedAccess
            };

            console.log("👤 User session created:", userSession);

            localStorage.setItem("loggedInUser", JSON.stringify(userSession));
            
            // REDIRECT LOGIC BASED ON ROLE AND POSITION
            if (role === "Admin" || role === "HR" || role === "Manager") {
                // Full access roles go to dashboard
                console.log("🎯 Redirecting to dashboard (Admin/HR/Manager)...");
                window.location.href = "dashboard.html";
            } else if (hasRestrictedAccess) {
                // Restricted positions (Employee, Driver, Dispatcher) go to attendance
                console.log("🎯 Redirecting to attendance (Restricted Position: " + positionName + ")...");
                window.location.href = "attendance.html";
            } else {
                // Other roles go to attendance by default
                console.log("🎯 Redirecting to attendance (Default)...");
                window.location.href = "attendance.html";
            }

        } catch (error) {
            console.error('❌ Unexpected login error:', error);
            errorMessage.textContent = "❌ An error occurred. Please try again.";
            errorMessage.style.display = "block";
        }
    });

    // ===================================================
    // CREATE ACCOUNT BUTTON
    // ===================================================
    if (createBtn) {
        createBtn.addEventListener("click", () => {
            showPinModal();
        });
    }

    // Clear error on input
    document.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", () => {
            errorMessage.style.display = "none";
        });
    });

    // ===================================================
    // PIN MODAL FUNCTIONS
    // ===================================================
    function showPinModal() {
        const modalHTML = `
            <div id="pinModal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            ">
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    max-width: 400px;
                    width: 90%;
                ">
                    <h2 style="margin-top: 0; color: #333; text-align: center;">🔒 Authorization Required</h2>
                    <p style="color: #666; text-align: center; margin-bottom: 20px;">
                        Enter 6-digit PIN to access account creation
                    </p>
                    
                    <div style="margin-bottom: 20px;">
                        <input 
                            type="password" 
                            id="pinInput" 
                            maxlength="6" 
                            placeholder="Enter 6-digit PIN"
                            style="
                                width: 100%;
                                padding: 12px;
                                font-size: 18px;
                                text-align: center;
                                border: 2px solid #ddd;
                                border-radius: 5px;
                                box-sizing: border-box;
                                letter-spacing: 5px;
                            "
                        >
                    </div>
                    
                    <div id="pinError" style="
                        color: #d32f2f;
                        text-align: center;
                        margin-bottom: 15px;
                        display: none;
                        font-size: 14px;
                    "></div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button id="pinSubmit" style="
                            flex: 1;
                            padding: 12px;
                            background: #4CAF50;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: bold;
                        ">Verify</button>
                        
                        <button id="pinCancel" style="
                            flex: 1;
                            padding: 12px;
                            background: #f44336;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: bold;
                        ">Cancel</button>
                    </div>
                    
                    <p style="
                        margin-top: 15px;
                        font-size: 12px;
                        color: #999;
                        text-align: center;
                    ">
                        Only HR and Managers can create accounts
                    </p>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById("pinModal");
        const pinInput = document.getElementById("pinInput");
        const pinSubmit = document.getElementById("pinSubmit");
        const pinCancel = document.getElementById("pinCancel");
        const pinError = document.getElementById("pinError");

        pinInput.focus();

        // Only allow numbers in PIN input
        pinInput.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            pinError.style.display = "none";
        });

        // Submit on Enter key
        pinInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                verifyPin();
            }
        });

        pinSubmit.addEventListener("click", verifyPin);

        function verifyPin() {
            const enteredPin = pinInput.value.trim();

            if (enteredPin.length !== 6) {
                pinError.textContent = "PIN must be exactly 6 digits";
                pinError.style.display = "block";
                pinInput.focus();
                return;
            }

            if (enteredPin === ADMIN_PIN) {
                console.log("✅ PIN verified successfully");
                modal.remove();
                window.location.href = "createaccount.html";
            } else {
                console.log("❌ Incorrect PIN entered");
                pinError.textContent = "❌ Incorrect PIN. Access denied.";
                pinError.style.display = "block";
                pinInput.value = "";
                pinInput.focus();
            }
        }

        pinCancel.addEventListener("click", () => {
            console.log("❌ PIN modal cancelled");
            modal.remove();
        });

        // Close modal when clicking outside
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
});