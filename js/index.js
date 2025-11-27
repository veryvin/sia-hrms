// In /js/index.js

// 1. SUPABASE CLIENT INITIALIZATION
// ====================================================================
// USE THESE CREDENTIALS
const SUPABASE_URL = 'https://pheupnmnisguenfqaphs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZXVwbm1uaXNndWVuZnFhcGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMzY2ODcsImV4cCI6MjA3OTgxMjY4N30.CYN8o3ilyeRY1aYLy7Vut47pLskF6gIcBv4zE3kOUqM';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ====================================================================

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

// 4. FORGOT PASSWORD LOGIC (Modal interaction)
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const closeButton = forgotPasswordModal?.querySelector('.close');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');

if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        forgotPasswordModal.style.display = 'block';
    });
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