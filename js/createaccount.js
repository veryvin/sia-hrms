// createaccount.js

// 1. SUPABASE CLIENT INITIALIZATION
// ====================================================================
// !!! PALITAN ng iyong TAMA at AKTIBONG Keys !!!
const SUPABASE_URL = 'https://pheupnmnisguenfqaphs.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZXVwbm1uaXNndWVuZnFhcGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMzY2ODcsImV4cCI6MjA3OTgxMjY4N30.CYN8o3ilyeRY1aYLy7Vut47pLskF6gIcBv4zE3kOUqM';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ====================================================================


const createAccountForm = document.getElementById('createAccountForm');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');

function showMessage(type, message) {
    const msgElement = type === 'success' ? successMessage : errorMessage;
    const otherElement = type === 'success' ? errorMessage : successMessage;

    if (msgElement) {
        msgElement.textContent = (type === 'success' ? "✅ " : "❌ ") + message;
        msgElement.style.display = "block";
    }
    if (otherElement) otherElement.style.display = "none";
}


if (createAccountForm) {
    createAccountForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Kuhanin ang form data
        const firstName = document.getElementById('firstName')?.value.trim();
        const lastName = document.getElementById('lastName')?.value.trim();
        const employeeId = document.getElementById('employeeId')?.value.trim(); 
        const roleId = document.getElementById('roleId')?.value; 
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value || '';
        const confirmPassword = document.getElementById('confirmPassword')?.value || '';
        const submitButton = createAccountForm.querySelector('button[type="submit"]');

        // Validation checks
        if (!firstName || !lastName || !employeeId || !email || !password || !confirmPassword || !roleId) {
            return showMessage('error', 'Please fill out all fields, including selecting a Role.');
        }

        const employeeIdPattern = /^[A-Z]{3}-\d{3}$/; 
        if (!employeeIdPattern.test(employeeId)) {
            return showMessage('error', 'Employee ID must be in the format e.g., RMT-001 (3 letters-3 numbers).');
        }

        if (password !== confirmPassword) {
            return showMessage('error', 'Passwords do not match.');
        }
        
        if (submitButton) {
            submitButton.textContent = 'Creating...';
            submitButton.disabled = true;
        }

        let authSuccess = false;
        let profileSuccess = false;
        let finalMessage = 'An unknown error occurred during registration.';
        let positionName = null;
        let positionId = null; 

        // --- HAKBANG A: TUKUYIN ANG FIXED POSITION AT HANAPIN ANG ID NITO ---
        if (roleId === '3') {
            positionName = 'HR Manager'; 
        } else if (roleId === '2') {
            positionName = 'Software Developer'; 
        } 
        
        if (positionName) {
            try {
                // Look up Position ID
                const { data, error } = await supabase
                    .from('positions')
                    .select('id')
                    .eq('position_name', positionName)
                    .single();
                
                if (error || !data) {
                     finalMessage = `Configuration Error: The fixed position "${positionName}" (Role ID ${roleId}) was not found or access is blocked. Please contact HR.`; 
                } else {
                    positionId = data.id; 
                }
            } catch (e) {
                console.error('Position Lookup Failed:', e);
                finalMessage = 'An internal database lookup failed. Please try again.';
            }
        }
        
        if (!positionId) {
             showMessage('error', finalMessage);
             if (submitButton) { submitButton.textContent = 'Create Account'; submitButton.disabled = false; }
             return; 
        }

// --- STEP 1: SUPABASE AUTHENTICATION SIGN-UP ---
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password
        });
        
        if (authError) {
            finalMessage = `Registration failed (Auth): ${authError.message}.`;
        } else if (authData.user) {
            authSuccess = true;
            
            // --- STEP 2: PROFILE INSERTION (Gumamit ng RPC Function) ---
            // Tatawagin natin ang database function na 'create_employee_profile'
            const { error: insertError } = await supabase.rpc('create_employee_profile', {
                p_employee_id: employeeId,
                p_first_name: firstName,
                p_last_name: lastName,
                p_position_id: positionId
            });

            if (insertError) {
                console.error('Profile Insert Error (RPC):', insertError);
                finalMessage = `Account created! Profile save failed (DB Conflict): ${insertError.message}. Please contact HR.`;
            } else {
                profileSuccess = true;
                finalMessage = 'Account created and profile saved! Check your email for a **confirmation link** to activate your account.';
            }
        }


        // --- STEP 3: FINAL STATUS AND REDIRECTION ---
        
        if (authSuccess && profileSuccess) {
            showMessage('success', `${finalMessage} Redirecting to login in 5 seconds...`);
        } else {
            showMessage('error', finalMessage);
        }

        createAccountForm.reset();
        
        if (authSuccess && profileSuccess) {
            setTimeout(() => { 
                window.location.href = 'index.html'; 
            }, 5000); 
        }

        if (submitButton) { 
            submitButton.textContent = 'Create Account'; 
            submitButton.disabled = false; 
        }
    });
}