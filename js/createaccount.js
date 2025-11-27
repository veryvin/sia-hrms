

// Get existing users from localStorage
function getExistingUsers() {
  return JSON.parse(localStorage.getItem('registered_users')) || [];
}

// Save users to localStorage
function saveUsers(users) {
  localStorage.setItem('registered_users', JSON.stringify(users));
}

// Initialize Supabase client (assumes global constants are set)
const supabase = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements for form and messages
const createAccountForm = document.getElementById('createAccountForm');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');

// Password Toggle Function
document.querySelectorAll('.toggle-password').forEach(icon => {
  icon.addEventListener('click', function() {
    const targetId = this.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (!input) return;

    if (input.type === "password") {
      input.type = "text";
      this.src = "../images/view.png";
    } else {
      input.type = "password";
      this.src = "../images/hide.png";
    }
  });
});

// FORM SUBMISSION HANDLER
if (createAccountForm) {
  createAccountForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const firstName = document.getElementById('firstName')?.value.trim();
    const lastName = document.getElementById('lastName')?.value.trim();
    const employeeId = document.getElementById('employeeId')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';
    const submitButton = createAccountForm.querySelector('button[type="submit"]');

    // Basic validation
    if (!firstName || !lastName || !employeeId || !email || !password || !confirmPassword) {
      return showMessage('error', 'Please fill out all fields.');
    }

    if (password.length < 6) {
      return showMessage('error', 'Password must be at least 6 characters.');
    }

    if (password !== confirmPassword) {
      return showMessage('error', 'Passwords do not match.');
    }

    if (submitButton) {
      submitButton.textContent = 'Creating...';
      submitButton.disabled = true;
    }

    // Check if email or employee ID already exists (local storage)
    const existingUsers = getExistingUsers();
    const emailExists = existingUsers.some(u => u.email && u.email.toLowerCase() === (email || '').toLowerCase());
    const idExists = existingUsers.some(u => u.employeeId === employeeId);

    if (emailExists) {
      if (submitButton) { submitButton.textContent = 'Create Account'; submitButton.disabled = false; }
      return showMessage('error', 'Email already exists.');
    }

    if (idExists) {
      if (submitButton) { submitButton.textContent = 'Create Account'; submitButton.disabled = false; }
      return showMessage('error', 'Employee ID already registered.');
    }

    // Create new user locally
    const newUser = {
      firstName,
      lastName,
      employeeId,
      email,
      password, // In production, hash this!
      role: "Employee",
      createdAt: new Date().toISOString(),
    };

    existingUsers.push(newUser);
    saveUsers(existingUsers);

    // Prepare insert payload for Supabase - keep nullable / safe defaults
    const insertData = {
      auth_uid: null,
      first_name: firstName,
      last_name: lastName,
      employee_id: employeeId,
      email: email,
      phone: null,
      hire_date: null,
      department_id: null,
      role_id: null,
    };

    // Attempt to insert profile to Supabase if client is available
    if (supabase) {
      try {
        const { error: profileError } = await supabase
          .from('employees')
          .insert(insertData);

        if (profileError) {
          console.error('Profile Insert Error:', profileError);
          showMessage('error', 'Account created, but profile failed to save. Error: ' + (profileError.message || profileError));

          if (submitButton) {
            submitButton.textContent = 'Create Account';
            submitButton.disabled = false;
          }
          return;
        }
      } catch (err) {
        console.error('Supabase insert exception:', err);
        showMessage('error', 'Account created locally, but an error occurred saving profile.');

        if (submitButton) {
          submitButton.textContent = 'Create Account';
          submitButton.disabled = false;
        }
        return;
      }
    }

    // Success
    showMessage('success', 'Account created! Redirecting...');
    setTimeout(() => { window.location.href = 'index.html'; }, 3000);

    if (submitButton) { submitButton.textContent = 'Create Account'; submitButton.disabled = false; }
    createAccountForm.reset();
  });
}

// =========================
// UI helper functions
// =========================
function showError(message) {
  if (errorMessage) {
    errorMessage.textContent = "❌ " + message;
    errorMessage.style.display = "block";
  }
  if (successMessage) successMessage.style.display = "none";
}

function showSuccess(message) {
  if (successMessage) {
    successMessage.textContent = "✅ " + message;
    successMessage.style.display = "block";
  }
  if (errorMessage) errorMessage.style.display = "none";
}

function showMessage(type, message) {
  if (type === 'error') return showError(message);
  return showSuccess(message);
}

// Hide error on input
document.querySelectorAll("input").forEach(input => {
  input.addEventListener("input", () => {
    if (errorMessage) errorMessage.style.display = "none";
  });
});
