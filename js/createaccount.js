// Mock Database
const existingUsers = [
  { email: 'admin@rmt.com' },
  { email: 'juan.delacruz@rmt.com' }
];

// DOM Elements
const form = document.getElementById('createAccountForm');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const employeeIdInput = document.getElementById('employeeId');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const successModal = document.getElementById('successModal');

// Password Toggle Function
function togglePassword(fieldId, icon) {
  const input = document.getElementById(fieldId);
  if (input.type === "password") {
    input.type = "text";
    icon.src = "../images/hide.png";  // hide icon
  } else {
    input.type = "password";
    icon.src = "../images/view.png";  // show icon
  }
}

// Form Submission
form.addEventListener('submit', (e) => {
  e.preventDefault();

  successMessage.style.display = "none";
  errorMessage.style.display = "none";

  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();
  const employeeId = employeeIdInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (!firstName || !lastName || !employeeId || !email || !password || !confirmPassword) {
    return showError("Please fill out all fields.");
  }

  if (password.length < 6) return showError("Password must be at least 6 characters.");
  if (password !== confirmPassword) return showError("Passwords do not match.");

  const exists = existingUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return showError("Email already exists.");

  existingUsers.push({ firstName, lastName, employeeId, email });

  showModal();
});

// Inline error/success
function showError(message) {
  errorMessage.textContent = "❌ " + message;
  errorMessage.style.display = "block";
  successMessage.style.display = "none";
}

function showSuccess(message) {
  successMessage.textContent = "✅ " + message;
  successMessage.style.display = "block";
  errorMessage.style.display = "none";
}

// Show Popup Modal + Redirect
function showModal() {
  const modalMessage = document.getElementById('modalMessage');
  successModal.style.display = "flex";
  modalMessage.textContent = 'Account created successfully! Redirecting...';

  setTimeout(() => {
    // Optional fade-out
    successModal.classList.add('fade-out');
    setTimeout(() => {
      window.location.href = "index.html";
    }, 300); // match fade-out duration
  }, 2000);
}


// Hide error on input
document.querySelectorAll("input").forEach(input => {
  input.addEventListener("input", () => {
    errorMessage.style.display = "none";
  });
});

// Optional: Password toggle for multiple fields
document.querySelectorAll('.toggle-password').forEach(icon => {
  icon.addEventListener('click', () => {
    const targetId = icon.getAttribute('data-target');
    togglePassword(targetId, icon);
  });
});
