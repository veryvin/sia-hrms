// auth.js

// --------------------------
// Get logged-in user safely
// --------------------------
export function getLoggedInUser() {
    const stored = localStorage.getItem('loggedInUser');
    if (!stored) return null;

    try {
        return JSON.parse(stored);
    } catch (error) {
        console.error("Error parsing loggedInUser:", error);
        return null;
    }
}

// --------------------------------------
// Initialize page UI (optional to call)
// --------------------------------------
export function initAuthUI(roleLabel = "Admin") {
    const user = getLoggedInUser();

    const welcomeText = document.getElementById('welcomeText');
    const userEmailDisplay = document.getElementById('userEmailDisplay');

    if (!user) {
        // Show as guest
        if (welcomeText) welcomeText.textContent = `Welcome, Guest`;
        if (userEmailDisplay) userEmailDisplay.textContent = ``;
        return null;
    }

    // Display logged-in user info
    if (welcomeText) {
        welcomeText.textContent = `Welcome, ${user.first_name || user.email} (${roleLabel})`;
    }

    if (userEmailDisplay) {
        userEmailDisplay.textContent = user.email;
    }

    return user;
}

// --------------------------------------
// Require login (redirect if no user)
// --------------------------------------
export function requireLogin(redirectTo = "index.html") {
    const user = getLoggedInUser();

    if (!user) {
        window.location.href = redirectTo;
        return null;
    }

    return user;
}
