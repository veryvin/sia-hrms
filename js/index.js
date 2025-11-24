document.addEventListener("DOMContentLoaded", () => {

    // 🛑 FIX APPLIED: Removed localStorage.clear() 
    // The previous line was causing the Admin account to fail by wiping its session immediately.

    // Sample accounts
    const sampleUsers = [
        { id: "hr", role: "Admin", password: "hr" },
        { id: "emp",role: "Employee", password: "emp"},
    ];

    const loginForm = document.getElementById("loginForm");
    // NOTE: If you are using a button with ID "createBtn", ensure it exists in your HTML.
    const createBtn = document.getElementById("createBtn"); 

    if (!loginForm) {
        console.error("loginForm not found! Check your index.html file.");
        return;
    }

    // --- LOGIN EVENT ---
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const empId = document.getElementById("employeeId").value.trim();
        const pwd = document.getElementById("password").value.trim();

        const user = sampleUsers.find(u => u.id === empId);

        if (!user || user.password !== pwd) {
            alert("Invalid Employee ID or Password.");
            return;
        }

        // Save session (This correctly sets the key needed for the next page)
        localStorage.setItem("loggedInUser", JSON.stringify(user));

        const redirect = user.role === "Admin"
            ? "dashboard.html"  // Admin goes to dashboard.html
            : "attendance.html"; // Employee goes to attendance.html

        // The instant redirect should now succeed for both roles.
        window.location.href = redirect;
    });

    // --- CREATE ACCOUNT BUTTON ---
    if (createBtn) { // Safety check added
        createBtn.addEventListener("click", () => {
            window.location.href = "createaccount.html";
        });
    }
});