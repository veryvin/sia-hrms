// index.js (Continuing from Initialization)

async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('employees') // IMPORTANT: Ensure 'employees' is the correct table name
      .select('id')      
      .limit(1);         
    
    if (error) {
      console.error('❌ Supabase Connection Check FAILED:', error.message);
      return false;
    }
    
    if (data) {
      console.log('✅ Supabase Connection SUCCESSFUL! Data received:', data);
      return true;
    }
  } catch (e) {
    console.error('❌ Supabase Client Initialization Error:', e.message);
    return false;
  }
}

// EXECUTE the check when the script loads
checkSupabaseConnection();
// Get modal elements
const modal = document.getElementById('forgotPasswordModal');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const closeBtn = document.getElementsByClassName('close')[0];
const loginForm = document.getElementById('loginForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');

// Sample email for demo
const demoEmail = "earvinjohnlopez01@gmail.com";

// Open modal when "Forgot Password?" is clicked
forgotPasswordLink.addEventListener('click', function(e) {
    e.preventDefault();
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
});

// Close modal when X is clicked
closeBtn.addEventListener('click', function() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

// Close modal when clicking outside of it
window.addEventListener('click', function(e) {
    if (e.target === modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Handle login form submission (demo only)
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    console.log('Login attempt:', { email, password });

    // ✅ Demo login check (no database yet)
    // You can replace this email with any sample you want
    const demoEmail = "earvinjohnlopez01@gmail.com";

    if (email === demoEmail && password !== "") {

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userEmail", email);

    showLoginSuccess();

   // Unified Success Popup
function showLoginSuccess() {
    const modal = document.getElementById("loginSuccessModal");
    const title = document.getElementById("successTitle");
    const message = document.getElementById("successMessage");

    title.textContent = "Login Successful";
    message.textContent = "Redirecting...";

    modal.classList.remove("hidden");

    setTimeout(() => {
        modal.classList.add("fade-out");
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 300);
    }, 1500);
}


} else {
    alert('Invalid credentials. Please use the demo email.');
}

});

/// Handle login form submission
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    const demoEmail = "earvinjohnlopez01@gmail.com";

    if (email === demoEmail && password !== "") {
        // Save session
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);

        // Show login success modal
        const modal = document.getElementById('loginSuccessModal');
        modal.style.display = 'flex';

        // Countdown text
        let countdown = 2;
        const msg = modal.querySelector('p');
        msg.textContent = `Login successful! Redirecting in ${countdown}...`;

        const interval = setInterval(() => {
            countdown--;
            msg.textContent = `Login successful! Redirecting in ${countdown}...`;
            if (countdown <= 0) {
                clearInterval(interval);
                modal.classList.add('fade-out');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 300);
            }
        }, 1000);

    } else {
        alert('Invalid credentials. Please use the demo email.');
    }
});

// Handle Create Account button
document.querySelector('.btn-secondary').addEventListener('click', function() {
    window.location.href = "createaccount.html";
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.style.display === 'block') {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});
