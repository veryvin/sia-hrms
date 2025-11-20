const SUPABASE_URL = 'https://giuklazjcvfkpyylmtrm.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdWtsYXpqY3Zma3B5eWxtdHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MjcyMDUsImV4cCI6MjA3ODUwMzIwNX0.vEOtSgr4rMUxNlfAunhNvG2L0oMloV9x4thi3vz0EPc';

// 2. Initialization: The createClient function is globally available via the CDN.
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Nav active state
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});
// js/dashboard.js
document.addEventListener("DOMContentLoaded", () => {
  const employeeLink = document.querySelector(".nav-item:nth-child(2)"); // 👥 Employees
  employeeLink.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "employee.html"; // redirect to employee page
  });
});


// --- User Menu Dropdown ---
window.addEventListener('DOMContentLoaded', () => {
  const userIcon = document.getElementById('userIcon');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const userEmailDisplay = document.getElementById('userEmailDisplay');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!userIcon || !dropdownMenu || !userEmailDisplay || !logoutBtn) return;

  // Show logged-in email
  const userEmail = localStorage.getItem('userEmail') || "Demo User";
  userEmailDisplay.textContent = userEmail;

  // Toggle dropdown
  userIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.style.display = (dropdownMenu.style.display === 'block') ? 'none' : 'block';
  });

  // Hide dropdown when clicking outside
  window.addEventListener('click', () => {
    dropdownMenu.style.display = 'none';
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    window.location.href = 'index.html';
  });
});
