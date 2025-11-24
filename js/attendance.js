document.addEventListener("DOMContentLoaded", () => {
    // 1. Supabase Initialization
    // *** REPLACE WITH YOUR ACTUAL KEYS ***
    const SUPABASE_URL = 'https://kfsjewtfpeohdbxyrlcz.supabase.co'; 
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmc2pld3RmcGVvaGRieHlybGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzU5NjQsImV4cCI6MjA3OTIxMTk2NH0.wrszJi_YC74iYE7oaHvbWBo5JmfY_Enc8VQg5wwggrw';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // ***********************************

const openModalBtn = document.getElementById("openModalBtn");
    const modal = document.getElementById("attendanceModal");
    const closeModal = document.getElementById("closeModal");
    const cancelBtn = document.getElementById("cancelBtn");
    const attendanceForm = document.getElementById("attendanceForm");
    const attendanceList = document.querySelector(".employee-list");

    // --- Helper Function for Total Hours Calculation ---
    function calculateTotalHours(timeIn, timeOut) {
        if (!timeIn || !timeOut) return 0;
        
        const inParts = timeIn.split(':').map(Number);
        const outParts = timeOut.split(':').map(Number);

        const dateIn = new Date(0, 0, 0, inParts[0], inParts[1]);
        const dateOut = new Date(0, 0, 0, outParts[0], outParts[1]);

        if (dateOut < dateIn) {
            dateOut.setDate(dateOut.getDate() + 1);
        }

        const diffMs = dateOut - dateIn;
        const totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2); 

        return parseFloat(totalHours);
    }

    // --- Helper Function to Render a Single Card ---
    function renderAttendanceCard(record) {
        // Retrieve split names from the joined 'employees' table object
        const firstName = record.employees?.first_name || '';
        const lastName = record.employees?.last_name || `ID: ${record.employee_id}`;
        const employeeName = `${firstName} ${lastName}`.trim();

        const card = document.createElement("div");
        card.classList.add("employee-card");
        card.innerHTML = `
            <h3>${employeeName}</h3>
            <p><strong>Date:</strong> ${record.date}</p>
            <p><strong>Time In:</strong> ${record.time_in}</p>
            <p><strong>Time Out:</strong> ${record.time_out}</p>
            <p><strong>Total Hours:</strong> ${record.total_hours}</p>
            <p><strong>Status:</strong> ${record.status}</p>
            <p><strong>Notes:</strong> ${record.notes || 'None'}</p>
        `;
        attendanceList.appendChild(card);
    }

    // 2. 🟢 Function to Fetch Data (JOINING employees table)
    async function fetchAttendanceData() {
        attendanceList.innerHTML = ''; 

            const { data, error } = await supabase
            .from('attendance')
            .select('*, employees:employee_id(first_name, last_name)') // Cleaned up query string
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching attendance:', error);
            attendanceList.innerHTML = '<p style="color:red; text-align: center;">Error loading attendance records. Check console for table/key issues.</p>';
            return;
        }

        if (data && data.length > 0) {
            data.forEach(renderAttendanceCard);
        } else {
            attendanceList.innerHTML = '<p style="text-align: center; color: #6b7280;">No attendance records found.</p>';
        }
    }
    
    // Initial data load
    fetchAttendanceData(); 

    // 🟢 Open Modal
    openModalBtn.addEventListener("click", () => {
        modal.style.display = "flex";
    });

    // 🟢 Close Modal function
    function hideModal() {
        modal.style.display = "none";
        attendanceForm.reset();
    }

    closeModal.addEventListener("click", hideModal);
    cancelBtn.addEventListener("click", hideModal);

    // 🟢 Submit Form (log attendance)
    attendanceForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fullEmployeeName = document.getElementById("employee").value.trim();
        const date = document.getElementById("date").value;
        const timeIn = document.getElementById("timeIn").value;
        const timeOut = document.getElementById("timeOut").value;
        const status = document.getElementById("status").value || "Present";
        const notes = document.getElementById("notes").value || "None"; 
        
        if (!fullEmployeeName || !date || !timeIn || !timeOut) {
            alert("Please fill in Employee, Date, Time In, and Time Out.");
            return;
        }

        try {
            // Split the input name to search by last name
            const nameParts = fullEmployeeName.split(' ').filter(p => p.length > 0);
            const searchLastName = nameParts[nameParts.length - 1];

            // 1. Look up employee_id using the LAST NAME
            const { data: employeeData, error: employeeError } = await supabase
                .from('employees') 
                .select('employee_id')
                .ilike('last_name', searchLastName) 
                .maybeSingle(); 

            if (employeeError) {
                console.error("Supabase Error during employee search:", employeeError.message);
                alert(`Error during employee search: ${employeeError.message}`);
                return;
            }

            if (!employeeData) {
                alert(`Employee matching "${fullEmployeeName}" not found. Please ensure the name is correct.`);
                return;
            }

            const employeeId = employeeData.employee_id;
            const totalHours = calculateTotalHours(timeIn, timeOut);
            
            // 2. Insert Data into Supabase
            const { error: insertError } = await supabase
                .from('attendance')
                .insert([
                    {
                        employee_id: employeeId,
                        date: date,
                        time_in: timeIn,
                        time_out: timeOut,
                        total_hours: totalHours,
                        status: status
                        // NOTES COLUMN IS EXCLUDED HERE TO PREVENT SCHEMA ERROR
                    }
                ]);

            if (insertError) {
                console.error("Supabase Insert Error:", insertError);
                alert(`Error logging attendance: ${insertError.message}`);
                return;
            }

            hideModal();
            alert("Attendance logged successfully!");

            // 3. Re-fetch data after successful insertion to update the list
            await fetchAttendanceData(); 

        } catch (err) {
            console.error("General Submission Error:", err);
            alert("An unexpected error occurred during submission.");
        }
    });

    // 🟢 Close modal when clicking outside
    window.addEventListener("click", (e) => {
        if (e.target === modal) hideModal();
    });
});