document.addEventListener("DOMContentLoaded", () => {

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

    if (!loginForm) {
        console.error("⚠ loginForm not found — Check index.html ID");
        return;
    }

    // LOGIN HANDLER
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const empId = document.getElementById("employeeId").value.trim();
        const pwd = document.getElementById("password").value.trim();

        // Find user in sample list
        const user = sampleUsers.find(u => u.id === empId);

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

    // CREATE ACCOUNT BUTTON
    if (createBtn) {
        createBtn.addEventListener("click", () => {
            window.location.href = "createaccount.html";
        });
    }

    // Clear error on input
    document.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", () => {
            errorMessage.style.display = "none";
        });
    });
});