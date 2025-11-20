const SUPABASE_URL = 'https://giuklazjcvfkpyylmtrm.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdWtsYXpqY3Zma3B5eWxtdHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MjcyMDUsImV4cCI6MjA3ODUwMzIwNX0.vEOtSgr4rMUxNlfAunhNvG2L0oMloV9x4thi3vz0EPc';

// 2. Initialization: The createClient function is globally available via the CDN.
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {
  const openModalBtn = document.getElementById("openModalBtn");
  const modal = document.getElementById("attendanceModal");
  const closeModal = document.getElementById("closeModal");
  const cancelBtn = document.getElementById("cancelBtn");
  const attendanceForm = document.getElementById("attendanceForm");
  const attendanceList = document.querySelector(".employee-list");

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
  attendanceForm.addEventListener("submit", (e) => {
    e.preventDefault(); // prevent page reload

    const employee = document.getElementById("employee").value;
    const date = document.getElementById("date").value;
    const timeIn = document.getElementById("timeIn").value;
    const timeOut = document.getElementById("timeOut").value;
    const status = document.getElementById("status").value || "Present";
    const notes = document.getElementById("notes").value || "None";

    if (!employee || !date) {
      alert("Please fill in at least employee name and date.");
      return;
    }

    // Create new attendance card
    const card = document.createElement("div");
    card.classList.add("employee-card");
    card.innerHTML = `
      <h3>${employee}</h3>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time In:</strong> ${timeIn}</p>
      <p><strong>Time Out:</strong> ${timeOut}</p>
      <p><strong>Status:</strong> ${status}</p>
      <p><strong>Notes:</strong> ${notes}</p>
    `;

    attendanceList.appendChild(card);

    hideModal();
    alert("Attendance logged successfully!");
  });

  // 🟢 Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === modal) hideModal();
  });
});
