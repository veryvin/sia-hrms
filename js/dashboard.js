// --- Highlight Active Navigation Based on Current Page ---
document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop();

  document.querySelectorAll(".nav-item").forEach(link => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
});


// --- Restrict Sidebar Based on User Role ---
document.addEventListener("DOMContentLoaded", () => {
  const userRole = localStorage.getItem("userRole");

  const navDashboard = document.getElementById("navDashboard");
  const navEmployees = document.getElementById("navEmployees");
  const navAttendance = document.getElementById("navAttendance");
  const navLeave = document.getElementById("navLeave");
  const navPayroll = document.getElementById("navPayroll");
  const navReports = document.getElementById("navReports");

  if (userRole === "employee") {
    // Employee only sees Attendance + Leave
    navDashboard.style.display = "none";
    navEmployees.style.display = "none";
    navPayroll.style.display = "none";
    navReports.style.display = "none";
  }
});


// --- User Menu Dropdown ---
window.addEventListener("DOMContentLoaded", () => {
  const userIcon = document.getElementById("userIcon");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const userEmailDisplay = document.getElementById("userEmailDisplay");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!userIcon || !dropdownMenu || !userEmailDisplay || !logoutBtn) return;

  // Display logged in email
  const userEmail = localStorage.getItem("userEmail") || "Demo User";
  userEmailDisplay.textContent = userEmail;

  // Toggle dropdown
  userIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.style.display =
      dropdownMenu.style.display === "block" ? "none" : "block";
  });

  // Hide dropdown when clicking outside
  window.addEventListener("click", () => {
    dropdownMenu.style.display = "none";
  });

  // Logout button
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    window.location.href = "index.html";
  });
});
