SUPABASE_URL= 'https://kfsjewtfpeohdbxyrlcz.supabase.co';
SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmc2pld3RmcGVvaGRieHlybGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzU5NjQsImV4cCI6MjA3OTIxMTk2NH0.wrszJi_YC74iYE7oaHvbWBo5JmfY_Enc8VQg5wwggrw'

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const loginForm = document.getElementById('loginForm');
const createAccountBtn = document.querySelector('.btn-secondary');

// Forgot Password Modal Elements
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const closeModal = document.querySelector('.modal-content .close');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');


// ====================================================================
// 2. LOGIN FORM SUBMISSION HANDLER
// ====================================================================

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); 
    
    // Get input values (IDs match your HTML: 'email' and 'password')
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const loginButton = document.querySelector('.btn-primary'); // Assumes first primary button is login
    loginButton.textContent = 'Logging In...';
    loginButton.disabled = true;

    // Call Supabase Sign In API
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    loginButton.textContent = 'Log In';
    loginButton.disabled = false;

    if (error) {
        console.error('Login Error:', error);
        alert('Login Error: ' + error.message);
    } else if (data.session) {
        // Successful Login - Data contains session
        alert('Login Successful! Redirecting to Dashboard.');
        window.location.href = 'dashboard.html'; 
    } else {
        // Handle case where user is created but email not confirmed
        alert("Authentication failed. Check your email for a confirmation link.");
    }
});


// ====================================================================
// 3. CREATE ACCOUNT REDIRECT
// ====================================================================

createAccountBtn.addEventListener('click', function(event) {
    event.preventDefault(); 
    window.location.href = "createaccount.html";
});


// ====================================================================
// 4. FORGOT PASSWORD MODAL & LOGIC
// ====================================================================

// Open Modal
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    forgotPasswordModal.style.display = 'block';
});

// Close Modal
closeModal.addEventListener('click', () => {
    forgotPasswordModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === forgotPasswordModal) {
        forgotPasswordModal.style.display = 'none';
    }
});

// Reset Password Form Submission
forgotPasswordForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const resetEmail = document.getElementById('resetEmail').value.trim();
    const submitButton = forgotPasswordForm.querySelector('.btn-primary');

    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;
    
    // Call Supabase Password Recovery API
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        // The URL the user is redirected to after clicking the reset link in their email
        redirectTo: 'http://your-live-domain.com/resetpassword.html' 
    });

    submitButton.textContent = 'Send Reset Link';
    submitButton.disabled = false;
    
    if (error) {
        console.error('Password Reset Error:', error);
        alert('Error sending link: ' + error.message);
    } else {
        alert('Password reset link sent! Check your email.');
        forgotPasswordModal.style.display = 'none'; // Close modal on success
    }
});