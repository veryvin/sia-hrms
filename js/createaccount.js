// Get existing users from localStorage
function getExistingUsers() {
  return JSON.parse(localStorage.getItem('registered_users')) || [];
}

// Save users to localStorage
function saveUsers(users) {
  localStorage.setItem('registered_users', JSON.stringify(users));
}

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
document.querySelectorAll('.toggle-password').forEach(icon => {
  icon.addEventListener('click', function() {
    const targetId = this.getAttribute('data-target');
    const input = document.getElementById(targetId);
    
    if (input.type === "password") {
      input.type = "text";
      this.src = "../images/view.png";
    } else {
      input.type = "password";
      this.src = "../images/hide.png";
    }
  });
});

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

  // Validation
  if (!firstName || !lastName || !employeeId || !email || !password || !confirmPassword) {
    return showError("Please fill out all fields.");
  }

  if (password.length < 6) {
    return showError("Password must be at least 6 characters.");
  }
  
  if (password !== confirmPassword) {
    return showError("Passwords do not match.");
  }

  // Check if email or employee ID already exists
  const existingUsers = getExistingUsers();
  const emailExists = existingUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
  const idExists = existingUsers.some(u => u.employeeId === employeeId);

  if (emailExists) {
    return showError("Email already exists.");
  }

  if (idExists) {
    return showError("Employee ID already registered.");
  }

  // Create new user
  const newUser = {
    firstName,
    lastName,
    employeeId,
    email,
    password, // In production, hash this!
    role: "Employee", // Default role
    createdAt: new Date().toISOString()
  };

  existingUsers.push(newUser);
  saveUsers(existingUsers);

  showModal();
});

// Error display
function showError(message) {
  errorMessage.textContent = "❌ " + message;
  errorMessage.style.display = "block";
  successMessage.style.display = "none";
}

// Success display
function showSuccess(message) {
  successMessage.textContent = "✅ " + message;
  successMessage.style.display = "block";
  errorMessage.style.display = "none";
}

// Show Success Modal
function showModal() {
  const modalMessage = document.getElementById('modalMessage');
  successModal.style.display = "flex";
  modalMessage.textContent = 'Account created successfully! Redirecting...';

  setTimeout(() => {
    successModal.classList.add('fade-out');
    setTimeout(() => {
      window.location.href = "index.html";
    }, 300);
  }, 2000);
}

// Hide error on input
document.querySelectorAll("input").forEach(input => {
  input.addEventListener("input", () => {
    errorMessage.style.display = "none";
  });
});