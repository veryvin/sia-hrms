// In /js/index.js

// 1. SUPABASE CLIENT INITIALIZATION
// ====================================================================
// USE THESE CREDENTIALS
const SUPABASE_URL = 'https://pheupnmnisguenfqaphs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZXVwbm1uaXNndWVuZnFhcGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMzY2ODcsImV4cCI6MjA3OTgxMjY4N30.CYN8o3ilyeRY1aYLy7Vut47pLskF6gIcBv4zE3kOUqM';

<<<<<<< HEAD
    // HR/Manager Access PIN (6 digits)
    const ADMIN_PIN = "123456"; // Change this to your desired PIN

    const loginForm = document.getElementById("loginForm");
    const createBtn = document.getElementById("createBtn");
    const errorMessage = document.getElementById("errorMessage");
=======
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ====================================================================
>>>>>>> 8b8df163618e8317ad8cd8d5a93505f44b92961a

// 2. DOM Elements and Utility Functions (Re-declare if they exist in this file)
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

function showErrorMessage(message) {
    if (errorMessage) {
        errorMessage.textContent = "❌ " + message;
        errorMessage.style.display = "block";
    }
}

// 3. LOGIN SUBMISSION HANDLER
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('employeeId')?.value.trim(); // The input is labeled "Employee ID (Must be Email)"
        const password = document.getElementById('password')?.value || '';
        const loginBtn = document.getElementById('loginBtn');
        
        // Basic validation
        if (!email || !password) {
            return showErrorMessage('Please enter both email and password.');
        }

        loginBtn.textContent = 'Logging in...';
        loginBtn.disabled = true;

        // --- SUPABASE LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            showErrorMessage(`Login failed: ${error.message}`);
            console.error('Login Error:', error);
            loginBtn.textContent = 'Log In';
            loginBtn.disabled = false;
        } else {
            // --- SUCCESS: REDIRECT TO DASHBOARD ---
            // Assuming your main protected page is called 'dashboard.html'
            window.location.href = 'dashboard.html'; 
        }
    });
}

<<<<<<< HEAD
    // CREATE ACCOUNT BUTTON - Shows PIN Modal
    if (createBtn) {
        createBtn.addEventListener("click", () => {
            showPinModal();
        });
    }
=======
// 4. FORGOT PASSWORD LOGIC (Modal interaction)
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const closeButton = forgotPasswordModal?.querySelector('.close');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
>>>>>>> 8b8df163618e8317ad8cd8d5a93505f44b92961a

if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        forgotPasswordModal.style.display = 'block';
    });
<<<<<<< HEAD

    // PIN MODAL FUNCTIONS
    function showPinModal() {
        // Create modal overlay
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

        // Focus on input
        pinInput.focus();

        // Only allow numbers
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

        // Verify PIN
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
                // PIN is correct - redirect to create account
                modal.remove();
                window.location.href = "createaccount.html";
            } else {
                // PIN is incorrect
                pinError.textContent = "❌ Incorrect PIN. Access denied.";
                pinError.style.display = "block";
                pinInput.value = "";
                pinInput.focus();
            }
        }

        // Cancel button
        pinCancel.addEventListener("click", () => {
            modal.remove();
        });

        // Close on outside click
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
});
=======
}
if (closeButton) {
    closeButton.addEventListener('click', () => {
        forgotPasswordModal.style.display = 'none';
    });
}
window.onclick = function(event) {
    if (event.target == forgotPasswordModal) {
        forgotPasswordModal.style.display = 'none';
    }
}

if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const resetEmail = document.getElementById('resetEmail').value.trim();
        
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
            redirectTo: 'http://yourdomain.com/updatepassword.html', // IMPORTANT: Replace with your actual live URL path
        });

        if (error) {
            alert('Error sending reset link: ' + error.message);
        } else {
            alert('Password reset link sent to your email.');
            forgotPasswordModal.style.display = 'none';
        }
    });
}
>>>>>>> 8b8df163618e8317ad8cd8d5a93505f44b92961a
