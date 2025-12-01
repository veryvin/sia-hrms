// ===================================================
// CREATE ACCOUNT - FINAL WORKING VERSION
// All DOM element definitions and helper functions are correctly scoped
// inside the DOMContentLoaded listener.
// ===================================================

document.addEventListener('DOMContentLoaded', () => {

    const supabase = window.supabaseClient;

    // 1. 🛑 DEFINE ALL DOM ELEMENTS HERE FIRST 🛑
    // These variables are available to all functions defined below.
    const form = document.getElementById('createAccountForm');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const employeeIdInput = document.getElementById('employeeId');
    const emailInput = document.getElementById('email');
    const roleSelect = document.getElementById('role');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const successModal = document.getElementById('successModal');

    // **CRITICAL CHECK**
    if (!form) {
        console.error("Initialization Error: The 'createAccountForm' element was not found in the DOM.");
        return; // Stop execution if the main element is missing
    }

    // 2. 🟢 DEFINE ALL HELPER FUNCTIONS HERE 🟢
    // They must be defined here to access the DOM variables above.

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
    
    // 3. 🟡 MAIN LOGIC AND EVENT LISTENERS FOLLOW 🟡

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
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        successMessage.style.display = "none";
        errorMessage.style.display = "none";

        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const employeeId = employeeIdInput.value.trim();
        const email = emailInput.value.trim();
        const role = roleSelect.value;
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Validation
        if (!firstName || !lastName || !employeeId || !email || !password || !confirmPassword || !role) {
            return showError("Please fill out all fields.");
        }
        if (password.length < 6) {
            return showError("Password must be at least 6 characters.");
        }
        if (password !== confirmPassword) {
            return showError("Passwords do not match.");
        }

        try {
            // CALLING THE RPC FUNCTION (Ensure 'create_employee_record' exists in your DB)
            const { error } = await supabase.rpc('create_employee_record', {
                p_first_name: firstName,
                p_last_name: lastName,
                p_employee_id: employeeId,
                p_email: email,
                p_role_name: role,
                p_password: password
            });
            
            if (error) throw error;

            showModal(); // Success path: calls accessible function

        } catch (error) {
            console.error('Error creating account:', error);
            showError(error.message); // Error path: calls accessible function
        }
    });

    // Hide error on input
    document.querySelectorAll("input, select").forEach(input => {
        input.addEventListener("input", () => {
            errorMessage.style.display = "none";
        });
    });

}); // End of DOMContentLoaded