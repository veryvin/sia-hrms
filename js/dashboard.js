import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = 'https://kfsjewtfpeohdbxyrlcz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmc2pld3RmcGVvaGRieHlybGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzU5NjQsImV4cCI6MjA3OTIxMTk2NH0.wrszJi_YC74iYE7oaHvbWBo5JmfY_Enc8VQg5wwggrw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let userId = 'loading...';
let userEmail = 'guest@rms.com';

// Error Modal
const errorModal = document.getElementById('errorModal');
const modalErrorMessage = document.getElementById('modalErrorMessage');
const closeModalBtn = document.getElementById('closeModalBtn');

function showModal(message) {
    console.error("Supabase Error:", message);
    modalErrorMessage.textContent = message;
    errorModal.classList.add('flex');
}

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        errorModal.classList.remove('flex');
    });
}

// Initial Data Fetch (mock for now)
async function fetchInitialData() {
    try {
        const { data: employees, error } = await supabase.from('employees').select('*');
        if (error) throw error;

        const employeeCount = employees.length;
        const presentCount = employees.filter(emp => emp.is_present).length;

        document.querySelector('.stats div:nth-child(1) .number').textContent = employeeCount;
        document.querySelector('.stats div:nth-child(2) .number').textContent = presentCount;
    } catch (error) {
        showModal(error.message);
    }
}

// Supabase Auth
async function initializeSupabase() {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                const user = session.user;
                userId = user.id;
                userEmail = user.email || 'Supabase User';

                document.getElementById('welcomeText').textContent = `Welcome, ${userEmail}`;
                document.getElementById('userEmailDisplay').textContent = userEmail;

                fetchInitialData();
            } else {
                userId = 'unauthenticated';
                userEmail = 'Not Signed In';
                document.getElementById('welcomeText').textContent = 'Welcome, please sign in.';
                document.getElementById('userEmailDisplay').textContent = userEmail;
            }
        });

        // Initialize UI with current session
        if (session) {
            const user = session.user;
            userId = user.id;
            userEmail = user.email;
            document.getElementById('welcomeText').textContent = `Welcome, ${userEmail}`;
            document.getElementById('userEmailDisplay').textContent = userEmail;
            fetchInitialData();
        }

    } catch (error) {
        showModal(`Initialization Error: ${error.message}`);
    }
}

// Dropdown Logic
const userIcon = document.getElementById('userIcon');
const dropdownMenu = document.getElementById('dropdownMenu');

userIcon.addEventListener('click', e => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('active');
});

document.addEventListener('click', e => {
    if (!dropdownMenu.contains(e.target) && !userIcon.contains(e.target)) {
        dropdownMenu.classList.remove('active');
    }
});

// Logout
const logoutBtn = document.getElementById('logoutBtn');
logoutBtn.addEventListener('click', async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = 'index.html';
    } catch (error) {
        showModal(`Logout Failed: ${error.message}`);
    }
});

window.onload = initializeSupabase;
