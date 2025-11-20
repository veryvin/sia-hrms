const registeredEmails = [
    'earvinjohnlopez01@gmail.com',
    'delacruz.juan@rmt.com',
    'admin@rmt.com',
    'user@rmt.com'
];

let currentEmail = null;
let verificationCode = null;

const stepEmail = document.getElementById('stepEmail');
const stepCode = document.getElementById('stepCode');
const stepReset = document.getElementById('stepReset');

const forgotForm = document.getElementById('forgotForm');
const codeForm = document.getElementById('codeForm');
const resetForm = document.getElementById('resetForm');

const resetEmailInput = document.getElementById('resetEmail');
const verificationInput = document.getElementById('verificationCode');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const codeError = document.getElementById('codeError');
const resetError = document.getElementById('resetError');

// Step 1: Send verification code
forgotForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = resetEmailInput.value.trim().toLowerCase();

    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';

    if (!registeredEmails.includes(email)) {
        errorMessage.textContent = '❌ Email not found!';
        errorMessage.style.display = 'block';
        return;
    }

    currentEmail = email;
    verificationCode = '123456'; // fixed code for demo
    console.log(`Verification code for ${email}: ${verificationCode}`);

    successMessage.textContent = '✅ Verification code sent! (Demo code: 123456)';
    successMessage.style.display = 'block';

    // Show verification step
    stepEmail.style.display = 'none';
    stepCode.style.display = 'block';
});

// Step 2: Verify code
codeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    codeError.style.display = 'none';

    if (verificationInput.value.trim() === verificationCode) {
        stepCode.style.display = 'none';
        stepReset.style.display = 'block';
    } else {
        codeError.textContent = '❌ Incorrect verification code.';
        codeError.style.display = 'block';
    }
});

// Step 3: Reset password
resetForm.addEventListener('submit', (e) => {
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

    console.log(`Password for ${currentEmail} reset to: ${newPass}`);
    alert('✅ Password reset successful! Redirecting to login page.');
    window.location.href = 'index.html';
});
