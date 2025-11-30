// ===================================================
// LOGIN PAGE - SUPABASE READY (FIXED INITIALIZATION)
// ===================================================

// ⚠️ REPLACE THESE PLACEHOLDERS WITH YOUR ACTUAL SUPABASE KEYS
const SUPABASE_URL = 'https://pheupnmnisguenfqaphs.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZXVwbm1uaXNndWVuZnFhcGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMzY2ODcsImV4cCI6MjA3OTgxMjY4N30.CYN8o3ilyeRY1aYLy7Vut47pLskF6gIcBv4zE3kOUqM'; 

// Initialize the Supabase Client directly in this file
const { createClient } = supabase; 
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


document.addEventListener("DOMContentLoaded", () => {
    
    // Use the initialized client
    const supabase = supabaseClient;

    // HR/Manager Access PIN (6 digits)
    const ADMIN_PIN = "123456"; // Change this to your desired PIN

    const loginForm = document.getElementById("loginForm");
    const createBtn = document.getElementById("createBtn");
    const errorMessage = document.getElementById("errorMessage");

    if (!loginForm) {
        console.error("⚠ loginForm not found — Check index.html ID");
        return;
    }

// LOGIN HANDLER
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("employeeId").value.trim();
    const pwd = document.getElementById("password").value.trim();

    console.log("🔍 Attempting login with email:", email);
    console.log("🔍 Password length:", pwd.length);

    errorMessage.style.display = "none";

    try {
        // 1. Get employee details - EXPLICITLY specify the foreign key
        const { data: employee, error: empError } = await supabase
            .from('employees')
            .select(`
                id, 
                email, 
                employee_id, 
                first_name, 
                last_name, 
                password,
                position:positions!employees_position_id_fkey(
                    position_name,
                    department:departments(department_name),
                    role:roles(role_name)
                )
            `)
            .eq('email', email)
            .single();

        console.log("📊 Query result - employee:", employee);
        console.log("❌ Query error:", empError);

        if (empError || !employee) {
            console.log("⚠️ Employee not found or query error");
            errorMessage.textContent = "❌ Invalid Email or Password.";
            errorMessage.style.display = "block";
            return;
        }

        console.log("🔑 Stored password in DB:", employee.password);
        console.log("🔑 Entered password:", pwd);
        console.log("🔑 Passwords match:", employee.password === pwd);

        // 2. CHECK PASSWORD DIRECTLY (For Testing Only!)
        if (employee.password !== pwd) {
            console.log("⚠️ Password mismatch!");
            errorMessage.textContent = "❌ Invalid Email or Password.";
            errorMessage.style.display = "block";
            return;
        }

        console.log("✅ Login successful! Redirecting...");

        // 3. Store user session - UPDATED to match new structure
        const userSession = {
            id: employee.id, 
            empId: employee.employee_id,
            email: employee.email,
            firstName: employee.first_name,
            lastName: employee.last_name,
            role: employee.position?.role?.role_name || 'Employee',
            position: employee.position?.position_name || '',
            department: employee.position?.department?.department_name || ''
        };

        console.log("👤 User session:", userSession);

        localStorage.setItem("loggedInUser", JSON.stringify(userSession));
        
        // 4. Redirect based on role
        if (userSession.role === "Admin" || userSession.role === "HR" || userSession.role === "Manager") {
            console.log("🎯 Redirecting to dashboard...");
            window.location.href = "dashboard.html";
        } else {
            console.log("🎯 Redirecting to attendance...");
            window.location.href = "attendance.html";
        }

    } catch (error) {
        console.error('❌ Login error:', error);
        errorMessage.textContent = "❌ An error occurred. Please try again.";
        errorMessage.style.display = "block";
    }
});

    // CREATE ACCOUNT BUTTON - Shows PIN Modal
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

    // PIN MODAL FUNCTIONS
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

        pinInput.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            pinError.style.display = "none";
        });

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
                modal.remove();
                window.location.href = "createaccount.html";
            } else {
                pinError.textContent = "❌ Incorrect PIN. Access denied.";
                pinError.style.display = "block";
                pinInput.value = "";
                pinInput.focus();
            }
        }

        pinCancel.addEventListener("click", () => {
            modal.remove();
        });

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
});