// ===================================================
// FORGOT PASSWORD - SUPABASE READY
// ===================================================

const supabase = window.supabaseClient;

let currentEmail = null;

const stepEmail = document.getElementById('stepEmail');
const stepReset = document.getElementById('stepReset');

const forgotForm = document.getElementById('forgotForm');
const resetForm = document.getElementById('resetForm');

const resetEmailInput = document.getElementById('resetEmail');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const resetError = document.getElementById('resetError');

// Step 1: Send password reset email
forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = resetEmailInput.value.trim().toLowerCase();

    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';

    try {
        // Check if email exists in employees table
        const { data: employee, error: checkError } = await supabase
            .from('employees')
            .select('email')
            .eq('email', email)
            .single();

        if (checkError || !employee) {
            errorMessage.textContent = '❌ Email not found in our system!';
            errorMessage.style.display = 'block';
            return;
        }

        // Send password reset email using Supabase Auth
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });

        if (resetError) throw resetError;

        currentEmail = email;
        successMessage.textContent = '✅ Password reset link sent to your email!';
        successMessage.style.display = 'block';

        // Show instruction message
        setTimeout(() => {
            alert('Check your email for the password reset link. Click the link to set a new password.');
        }, 1000);

    } catch (error) {
        console.error('Error:', error);
        errorMessage.textContent = '❌ ' + error.message;
        errorMessage.style.display = 'block';
    }
});

// Handle reset password from email link (if on reset-password.html page)
if (window.location.pathname.includes('reset-password.html')) {
    // Check for access token from email link
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (accessToken && type === 'recovery') {
        // Show password reset form
        if (stepEmail) stepEmail.style.display = 'none';
        if (stepReset) stepReset.style.display = 'block';

        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            resetError.style.display = 'none';

            const newPass = newPasswordInput.value.trim();
            const confirmPass = confirmPasswordInput.value.trim();

            if (newPass.length < 6) {
                resetError.textContent = '❌ Password must be at least 6 characters.';
                resetError.style.display = 'block';
                return;
            }

            if (newPass !== confirmPass) {
                resetError.textContent = '❌ Passwords do not match.';
                resetError.style.display = 'block';
                return;
            }

            try {
                // Update password
                const { error } = await supabase.auth.updateUser({
                    password: newPass
                });

                if (error) throw error;

                alert('✅ Password reset successful! Redirecting to login page...');
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Error resetting password:', error);
                resetError.textContent = '❌ ' + error.message;
                resetError.style.display = 'block';
            }
        });
    } else {
        // No valid token, redirect to forgot password page
        window.location.href = 'forgot-password.html';
    }
}