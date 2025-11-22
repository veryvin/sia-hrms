const SUPABASE_URL = 'https://kfsjewtfpeohdbxyrlcz.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmc2pld3RmcGVvaGRieHlybGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzU5NjQsImV4cCI6MjA3OTIxMTk2NH0.wrszJi_YC74iYE7oaHvbWBo5JmfY_Enc8VQg5wwggrw';

// 2. Initialization: The createClient function is globally available via the CDN.
// Initialize the client using the global access from the CDN
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements for form and messages
const createAccountForm = document.getElementById('createAccountForm');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');

// Hide messages initially
if (successMessage) successMessage.style.display = 'none';
if (errorMessage) errorMessage.style.display = 'none';

/**
 * Helper function to display messages
 */
function showMessage(type, message) {
    if (!successMessage || !errorMessage) return;

    if (type === 'success') {
        successMessage.textContent = '✅ ' + message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    } else {
        errorMessage.textContent = '❌ Error: ' + message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }
}

// ====================================================================
// 2. FORM SUBMISSION HANDLER
// ====================================================================

if (createAccountForm) {
    createAccountForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        
        // 1. Get all input values
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const employeeId = document.getElementById('employeeId').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // 2. Client-Side Validation
        if (password !== confirmPassword) {
            showMessage('error', 'Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            showMessage('error', 'Password must be at least 6 characters long.');
            return;
        }

        if (successMessage) successMessage.style.display = 'none';
        if (errorMessage) errorMessage.style.display = 'none';
        
        const submitButton = document.querySelector('.btn-primary');
        if (submitButton) {
            submitButton.textContent = 'Signing Up...';
            submitButton.disabled = true;
        }

        // ====================================================================
        // 3. Supabase Sign Up (Auth)
        // ====================================================================
        
        // Create the user in the 'auth.users' table
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (authError) {
            showMessage('error', authError.message);
            if (submitButton) {
                submitButton.textContent = 'Create Account';
                submitButton.disabled = false;
            }
            return;
        }
        
        const newUser = authData.user;

        // ====================================================================
        // 4. Insert Profile Data into 'employees' Table (CORRECTED)
        // ====================================================================
        
        if (newUser) {
            // FIX: Format hire_date as YYYY-MM-DD for the database 'date' type
            const today = new Date();
            const hireDateFormatted = today.toISOString().slice(0, 10);

            const insertData = {
                // REQUIRED AUTH LINK
               auth_id: newUser.id, 
                
                // FORM DATA (MUST NOT BE NULL)
                first_name: firstName,
                last_name: lastName,
                employee_id: employeeId,
                email: email,
                
                // OPTIONAL/DEFAULT FIELDS (Match the clean table schema)
                phone: null, 
                hire_date: hireDateFormatted, // Use corrected date format
                department_id: null, 
                role_id: null, 
                
                // created_at and updated_at are handled automatically by Supabase
            };
            
            // Perform the insert
            const { error: profileError } = await supabase
                .from('employees') 
                .insert(insertData);

            if (profileError) {
                console.error('Profile Insert Error:', profileError);
                // The RLS violation should now be fixed by the database drop/recreate steps.
                showMessage('error', 'Account created, but profile failed to save. Error: ' + profileError.message);
                
                if (submitButton) {
                    submitButton.textContent = 'Create Account';
                    submitButton.disabled = false;
                }
                return;
            }
        }

        // ====================================================================
        // 5. Success and Redirect
        // ====================================================================

        showMessage('success', 'Account created! Please check your email to confirm your address before logging in.');
        
        setTimeout(() => {
            window.location.href = 'index.html'; 
        }, 4000); 
        
        if (submitButton) {
            submitButton.textContent = 'Create Account';
            submitButton.disabled = false;
        }
        createAccountForm.reset();
    });
}