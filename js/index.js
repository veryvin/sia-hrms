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
   

    // Save simple session data in localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);

    // Redirect to dashboard.html
    window.location.href = "dashboard.html";
} else {
    alert('Invalid credentials. Please use the demo email.');
}

});

// Handle forgot password form submission
forgotPasswordForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const resetEmail = document.getElementById('resetEmail').value;
    
    console.log('Password reset requested for:', resetEmail);

    if (resetEmail === demoEmail) {
        // Store demo code and email in localStorage
        const demoCode = "123456";
        localStorage.setItem('resetEmail', resetEmail);
        localStorage.setItem('verificationCode', demoCode);

        // Simulate sending reset link and go to verify-code page
        alert('Password reset link sent! (Demo mode)\nYour code: ' + demoCode);
        window.location.href = "verify-code.html"; // redirect to code verification page
    } else {
        alert('Email not found in sample data.');
    }

    // Reset form and close modal
    forgotPasswordForm.reset();
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
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
