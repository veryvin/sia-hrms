SUPABASE_URL= 'https://kfsjewtfpeohdbxyrlcz.supabase.co';
SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmc2pld3RmcGVvaGRieHlybGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzU5NjQsImV4cCI6MjA3OTIxMTk2NH0.wrszJi_YC74iYE7oaHvbWBo5JmfY_Enc8VQg5wwggrw'

    // Sample default accounts for testing
    const sampleUsers = [
        { 
            id: "hr", 
            role: "Admin", 
            password: "hr",
            email: "hr@rmt.com",
            firstName: "HR",
            lastName: "Admin",
            department: "Human Resources",
            position: "HR Manager"
        },
        { 
            id: "emp", 
            role: "Employee", 
            password: "emp",
            email: "employee@rmt.com",
            firstName: "John",
            lastName: "Doe",
            department: "Sales",
            position: "Sales Associate"
        },
    ];

    const loginForm = document.getElementById("loginForm");
    const createBtn = document.getElementById("createBtn");
    const errorMessage = document.getElementById("errorMessage");

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

        if (!user || user.password !== pwd) {
            errorMessage.textContent = "❌ Invalid Employee ID or Password.";
            errorMessage.style.display = "block";
            return;
        }

        // Store login session with complete user data
        localStorage.setItem("loggedInUser", JSON.stringify(user));
        localStorage.setItem("userEmail", user.email);

        // Redirect based on role
        if (user.role === "Admin") {
            window.location.href = "dashboard.html";
        } else {
            window.location.href = "attendance.html";
        }
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

    // Clear error on input
    document.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", () => {
            errorMessage.style.display = "none";
        });
    });


