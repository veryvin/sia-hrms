// /js/employee_add.js

// Import ang kailangan natin: supabase (para sa storage) at supabaseHelper (para sa database CRUD)
import supabase, { supabaseHelper } from './supabaseClient.js'; 

const STORAGE_BUCKET = 'hr_documents'; 

/* ====================================================================
   I. UTILITY & SECURITY FUNCTIONS (Hindi na kailangan ang initSidebarUI dito)
   NOTE: initSidebarUI logic is assumed to be handled elsewhere, or re-inserted here if needed.
   For now, let's keep the security and UI setup:
==================================================================== */

/**
 * Nagche-check ng user authentication at role-based access, at nagdi-display ng welcome message.
 */
function checkUserAccess() {
    const hrOnlyPages = [
        "dashboard.html", "employee.html", "employee_add.html", 
        "employee_edit.html", "employee_view.html", "payroll.html", "reports.html"
    ];

    const currentPage = window.location.pathname.split("/").pop();
    const loggedInUserString = localStorage.getItem('loggedInUser');
    const welcomeText = document.getElementById('welcomeText');
    const userEmailDisplay = document.getElementById("userEmailDisplay");

    if (!loggedInUserString) {
        // Allow public access (guest) — do not redirect
        if (welcomeText) welcomeText.textContent = `Welcome, Guest`;
        if (userEmailDisplay) userEmailDisplay.textContent = "";
        return true;
    }

    const loggedInUser = JSON.parse(loggedInUserString);
    const userRole = loggedInUser.role || 'User';

    // Update UI elements
    if (welcomeText) {
        welcomeText.textContent = `Welcome, ${loggedInUser.first_name || loggedInUser.email} (Role: ${userRole})`;
    }

    if (userEmailDisplay) {
        userEmailDisplay.textContent = loggedInUser.email;
    }

    return true;
}


// ** Ang initSidebarUI function ay kailangan pa rin dito para gumana ang sidebar,
// ** I-assume natin na na-paste mo na ang function na ito.
function initSidebarUI() {
    // ... (Your complete initSidebarUI logic from the previous step goes here) ...
    const sidebar = document.querySelector(".sidebar");
    // [I-paste ang buong Sidebar Logic dito]
    
    if (sidebar && !document.querySelector(".hamburger-btn")) {
        const hamburger = document.createElement("button");
        hamburger.className = "hamburger-btn";
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        sidebar.appendChild(hamburger);
    }
    const hamburger = document.querySelector(".hamburger-btn");
    let isExpanded = false;
    let hoverTimeout;
    hamburger?.addEventListener("click", (e) => { e.stopPropagation(); isExpanded = !isExpanded; sidebar?.classList.toggle("expanded", isExpanded); });
    sidebar?.addEventListener("mouseenter", () => { clearTimeout(hoverTimeout); sidebar?.classList.add("expanded"); });
    sidebar?.addEventListener("mouseleave", () => { if (!isExpanded) { hoverTimeout = setTimeout(() => { sidebar?.classList.remove("expanded"); }, 300); } });
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => { const text = item.textContent.trim(); const icon = text.split(" ")[0]; const label = text.substring(icon.length).trim(); item.innerHTML = `<span class="nav-item-icon">${icon}</span><span class="nav-item-text">${label}</span>`; });
    const currentPage = window.location.pathname.split("/").pop();
    navItems.forEach(item => { if (item.getAttribute("href") === currentPage) { item.classList.add("active"); } });
    const userIcon = document.getElementById("userIcon");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const logoutBtn = document.getElementById("logoutBtn");
    userIcon?.addEventListener("click", (e) => { e.stopPropagation(); dropdownMenu?.classList.toggle("show"); });
    document.addEventListener("click", (e) => { if (!e.target.closest(".user-menu-sidebar")) { dropdownMenu?.classList.remove("show"); } });
    logoutBtn?.addEventListener("click", () => { 
        // Ginamit ang helper function para sa Supabase logout
        supabaseHelper.logout(); 
        localStorage.removeItem("loggedInUser");
        window.location.href = "index.html"; 
    });
}


/* ====================================================================
   II. FILE UPLOAD LOGIC
==================================================================== */

/**
 * Nag-uupload ng files sa Supabase Storage at nagbabalik ng public URLs.
 */
async function uploadFiles(folderPath, files, subfolder) {
    const uploadedUrls = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Make sure folderPath ends with '/' and subfolder is valid
        const cleanFolder = folderPath.endsWith('/') ? folderPath : folderPath + '/';
        const filePath = `${cleanFolder}${subfolder}/${file.name}`;

        console.log(`Uploading file to: ${filePath}`); // Debug path

        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file, { upsert: true }); // upsert to overwrite if exists

        if (error) {
            console.error(`Supabase upload error for ${file.name}:`, error);
            throw new Error(`Upload failed for ${file.name}: ${error.message}`);
        }

        const { data: publicUrlData, error: urlError } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath);

        if (urlError) {
            console.error(`Supabase getPublicUrl error for ${file.name}:`, urlError);
            throw new Error(`Could not get public URL for ${file.name}: ${urlError.message}`);
        }

        uploadedUrls.push(publicUrlData.publicUrl);
    }

    return uploadedUrls;
}



/* ====================================================================
   III. FORM SUBMISSION HANDLER
==================================================================== */

async function handleFormSubmit(event) {
    event.preventDefault();
    const saveButton = document.getElementById('saveAdd');
    saveButton.disabled = true;

    const form = event.target;
    
    // 1. Kumuha ng key data
    const empId = form.querySelector('#empId').value.trim();
    const empPhotoFile = form.querySelector('#empPhoto').files[0];
    const empDocFiles = form.querySelector('#empFiles').files;
    
    if (!empId) {
        alert("Employee ID is required.");
        saveButton.disabled = false;
        return;
    }

    let photoUrl = null;
    let documentUrls = [];
    const folderPath = `employees/${empId}/`; 

    try {
        //* 2. FILE UPLOAD
        if (empPhotoFile) {
            const urls = await uploadFiles(folderPath, [empPhotoFile], 'photo');
            photoUrl = urls[0] || null;
        }

        if (empDocFiles.length > 0) {
            documentUrls = await uploadFiles(folderPath, empDocFiles, 'documents');
        }

        // 3. PREPARE DATABASE DATA
        const employeeData = {
            employee_id: empId,
            first_name: form.querySelector('#firstName').value.trim(),
            middle_name: form.querySelector('#middleName').value.trim(),
            last_name: form.querySelector('#lastName').value.trim(),
            email: form.querySelector('#empEmail').value.trim(),
            contact_no: form.querySelector('#phone').value.trim(),
            date_of_birth: form.querySelector('#dob').value,
            gender: form.querySelector('#gender').value,
            address: form.querySelector('#address').value,
            
            position: form.querySelector('#position').value.trim(), 
            department: form.querySelector('#department').value.trim(), 
            date_hired: form.querySelector('#dateHired').value,
            status: form.querySelector('#status').value,
            monthly_salary: parseFloat(form.querySelector('#salary').value),
            
            photo_url: photoUrl,
            document_urls: documentUrls, 
        };
        
        // 4. INSERT TO SUPABASE DATABASE (Ginamit ang helper function)
        const { error: insertError } = await supabaseHelper.createEmployee(employeeData);

        if (insertError) {
            console.error('Database Insert Error:', insertError);
            alert(`Failed to save employee record: ${insertError.message}.`);
            return;
        }

        alert('Employee record successfully added! Files uploaded.');
        window.location.href = 'employee.html';

    } catch (e) {
        alert('An unexpected error occurred during submission. Check if Supabase Storage is configured.');
    } finally {
        saveButton.disabled = false;
    }
}


/* ====================================================================
   IV. INITIALIZATION
==================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. SECURITY AND USER CHECK
    if (!checkUserAccess()) {
        return; 
    }
    
    // 2. SIDEBAR UI
    initSidebarUI(); 

    // 3. Set up Form Submission Handler
    const form = document.getElementById('employeeForm');
    form?.addEventListener('submit', handleFormSubmit);
    
    // 4. Set up Cancel Button
    document.getElementById('cancelAdd')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
            window.location.href = 'employee.html';
        }
    });
});