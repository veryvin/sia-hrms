import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// --- Global Setup ---
// These variables are provided by the environment for Supabase access
const SUPABASE_URL = typeof __supabase_url !== 'undefined' ? __supabase_url : 'https://kfsjewtfpeohdbxyrlcz.supabase.co';
const SUPABASE_KEY = typeof __supabase_key !== 'undefined' ? __supabase_key : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmc2pld3RmcGVvaGRieHlybGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzU5NjQsImV4cCI6MjA3OTIxMTk2NH0.wrszJi_YC74iYE7oaHvbWBo5JmfY_Enc8VQg5wwggrw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let userId = 'loading...';
let userEmail = 'guest@rms.com';

// Custom Modal (Replacement for alert/confirm)
const errorModal = document.getElementById('errorModal');
const modalErrorMessage = document.getElementById('modalErrorMessage');
const closeModalBtn = document.getElementById('closeModalBtn');

function showModal(message) {
    console.error("Supabase Error:", message);
    modalErrorMessage.textContent = message;
    errorModal.classList.remove('hidden');
    errorModal.classList.add('flex');
}

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        errorModal.classList.add('hidden');
        errorModal.classList.remove('flex');
    });
}

// Mock Data Fetching (Focusing on Auth/UI updates)
function fetchInitialData() {
    console.log(`Fetching dashboard data for user: ${userId}`);
    // In a real application, you would fetch data using supabase.from('table').select('*')
    
    // Mocking data update for demonstration
    const employeeCount = 3;
    const presentCount = 1;

    const totalEmployeesEl = document.querySelector('.stats div:nth-child(1) .number');
    const presentTodayEl = document.querySelector('.stats div:nth-child(2) .number');
    
    if (totalEmployeesEl) totalEmployeesEl.textContent = employeeCount;
    if (presentTodayEl) presentTodayEl.textContent = presentCount;
}


// --- Supabase Authentication and Session Management ---

async function initializeSupabase() {
    try {
        // Listen for auth state changes to update the UI
        supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                const user = session.user;
                userId = user.id;
                userEmail = user.email || 'Supabase User';
                
                // Update Sidebar and Profile Menu with user info
                document.getElementById('welcomeText').textContent = `Welcome, User ID: ${userId.substring(0, 8)}...`;
                document.getElementById('userEmailDisplay').textContent = userEmail;
                
                const menuUserEmailEl = document.getElementById('menuUserEmail');
                if (menuUserEmailEl) {
                    menuUserEmailEl.textContent = userEmail;
                }
                
                console.log(`User Authenticated. UID: ${userId}, Event: ${event}`);
                fetchInitialData();

            } else {
                // User is signed out or no active session
                userId = 'unauthenticated';
                userEmail = 'Not Signed In';
                document.getElementById('welcomeText').textContent = 'Welcome, please sign in.';
                document.getElementById('userEmailDisplay').textContent = userEmail;
                
                const menuUserEmailEl = document.getElementById('menuUserEmail');
                if (menuUserEmailEl) {
                    menuUserEmailEl.textContent = userEmail;
                }
                console.warn("No active Supabase session. Redirecting to login/index page.");
                
                // For a complete app, you would redirect here:
                // window.location.href = 'index.html'; 
            }
        });
        
    } catch (error) {
        showModal(`Initialization Error: ${error.message}`);
    }
}


// --- Dropdown Menu Logic (Makes the icon clickable) ---

const userIcon = document.getElementById('userIcon');
const dropdownMenu = document.getElementById('dropdownMenu');

function toggleDropdown() {
    if (dropdownMenu) {
        dropdownMenu.classList.toggle('active');
    }
}

// 1. Add click listener to the profile icon
if (userIcon) {
    userIcon.addEventListener('click', (event) => {
        event.stopPropagation(); 
        toggleDropdown();
    });
}

// 2. Close the dropdown if the user clicks anywhere outside of it
document.addEventListener('click', function(event) {
    const isClickInside = userIcon && userIcon.contains(event.target) || dropdownMenu && dropdownMenu.contains(event.target);
    
    if (dropdownMenu && !isClickInside && dropdownMenu.classList.contains('active')) {
        dropdownMenu.classList.remove('active');
    }
});


// --- Logout Functionality ---

const logoutBtn = document.getElementById('logoutBtn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            // The onAuthStateChange listener handles UI cleanup/redirect
        } catch (error) {
            showModal(`Logout Failed: ${error.message}`);
        }
    });
}


// --- Kick off initialization ---
window.onload = initializeSupabase;