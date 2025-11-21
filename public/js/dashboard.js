// ====================================================================
// 1. SUPABASE CLIENT INITIALIZATION (Your code)
// ====================================================================
const SUPABASE_URL = 'https://kfsjewtfpeohdbxyrlcz.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmc2pld3RmcGVvaGRieHlybGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzU5NjQsImV4cCI6MjA3OTIxMTk2NH0.wrszJi_YC74iYE7oaHvbWBo5JmfY_Enc8VQg5wwggrw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const userEmailDisplay = document.getElementById('userEmailDisplay');
const logoutBtn = document.getElementById('logoutBtn');

// ====================================================================
// 2. SESSION CHECK & DATA FETCH (NEW REQUIRED LOGIC) 🚀
// ====================================================================

async function checkUserSessionAndLoadData() {
    // 1. Check if a user session exists
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();

    if (sessionError || !user) {
        // No active session found. Redirect to login and clear old localStorage flags.
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        console.log('No active Supabase session found. Redirecting to login.');
        window.location.href = 'index.html'; 
        return;
    }

    // Update the email display using the official Auth email
    userEmailDisplay.textContent = user.email;
    localStorage.setItem('userEmail', user.email); // Update localStorage

    // 2. Fetch the user's profile data from the 'employees' table
    const { data: employeeData, error: dbError } = await supabase
        .from('employees')
        // Select the necessary fields (matching your employees table)
        .select('first_name, last_name, employee_id, department_id, role_id')
        .eq('id', user.id)
        .single(); 

    if (dbError) {
        console.error('Error fetching employee data:', dbError.message);
        // Display a warning on the dashboard if data fetch fails (e.g., RLS missing)
        alert('Warning: Could not load full employee profile data.');
        return;
    }
    
    // 3. Display the data on the dashboard page
    // (Requires corresponding IDs on your dashboard.html, e.g., #userName, #employeeId, etc.)
    document.getElementById('userName').textContent = `${employeeData.first_name} ${employeeData.last_name}`;
    document.getElementById('employeeId').textContent = employeeData.employee_id;
    // Add logic here to display Department/Role if those elements exist
    // document.getElementById('departmentName').textContent = employeeData.department_id; 
}


// ====================================================================
// 3. LOGOUT HANDLER (Updated to use Supabase signOut)
// ====================================================================

logoutBtn.addEventListener('click', async () => {
    // Clear client-side flags first
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    
    // Call Supabase to invalidate the session token
    const { error } = await supabase.auth.signOut();
    
    if (error) {
        console.error('Supabase Logout Error:', error);
        alert('Could not log out. Please try again.');
    }
    
    // Always redirect to login page after logout attempt
    window.location.href = 'index.html';
});


// ====================================================================
// 4. EXISTING CODE INTEGRATION (Your navigation and dropdown logic)
// ====================================================================

// Nav active state (Your original code)
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});

// Employee link redirect (Your original code)
document.addEventListener("DOMContentLoaded", () => {
  const employeeLink = document.querySelector(".nav-item:nth-child(2)"); // 👥 Employees
  if(employeeLink) {
    employeeLink.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "employee.html"; // redirect to employee page
    });
  }
  
  // Start the session check when the DOM is ready
  checkUserSessionAndLoadData(); 
});


// --- User Menu Dropdown --- (Your original code)
window.addEventListener('DOMContentLoaded', () => {
  const userIcon = document.getElementById('userIcon');
  const dropdownMenu = document.getElementById('dropdownMenu');
  
  // Toggle dropdown
  if (userIcon && dropdownMenu) {
        userIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.style.display = (dropdownMenu.style.display === 'block') ? 'none' : 'block';
        });
  }

  // Hide dropdown when clicking outside
  window.addEventListener('click', () => {
    if (dropdownMenu) {
        dropdownMenu.style.display = 'none';
    }
  });

// Note: Logout is handled by the dedicated listener above (logoutBtn)
});