// Sample existing users (mock database)
const existingUsers = [
  { email: 'admin@rmt.com', employeeId: 'EMP001' },
  { email: 'juan.delacruz@rmt.com', employeeId: 'EMP002' },
];

const form = document.getElementById('createAccountForm');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  // Collect inputs
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const employeeId = document.getElementById('employeeId').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // Reset messages
  successMessage.style.display = 'none';
  errorMessage.style.display = 'none';

  // Validation
  if (!firstName || !lastName || !employeeId || !email || !password || !confirmPassword) {
    showError('Please fill out all fields.');
    return;
  }

  if (password.length < 6) {
    showError('Password must be at least 6 characters long.');
    return;
  }

  if (password !== confirmPassword) {
    showError('Passwords do not match.');
    return;
  }

  const userExists = existingUsers.some(user => user.email.toLowerCase() === email.toLowerCase());
  if (userExists) {
    showError('Email already exists. Try logging in.');
    return;
  }

  // Simulate creating new user
  const newUser = { firstName, lastName, employeeId, email };
  existingUsers.push(newUser);

  console.log('✅ New User Created:', newUser);

  // After showing success message
showSuccess('Account created successfully!');

// Redirect back to login page after 2 seconds
setTimeout(() => {
  window.location.href = 'index.html';  // Adjust path if needed
}, 2000); // 2000ms = 2 seconds delay


  // Reset form
  form.reset();
});

function showError(message) {
  errorMessage.textContent = '❌ ' + message;
  errorMessage.style.display = 'block';
}

function showSuccess(message) {
  successMessage.textContent = '✅ ' + message;
  successMessage.style.display = 'block';
}
// Redirect "Create an Account" button to createaccount.html
document.addEventListener('DOMContentLoaded', () => {
  const createAccountBtn = document.getElementById('createAccountBtn');
  if (createAccountBtn) {
    createAccountBtn.addEventListener('click', () => {
      window.location.href = 'createaccount.html'; // adjust if your file is in another folder
    });
  }
});
}
