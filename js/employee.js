const SUPABASE_URL = 'https://giuklazjcvfkpyylmtrm.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdWtsYXpqY3Zma3B5eWxtdHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MjcyMDUsImV4cCI6MjA3ODUwMzIwNX0.vEOtSgr4rMUxNlfAunhNvG2L0oMloV9x4thi3vz0EPc';

// 2. Initialization: The createClient function is globally available via the CDN.
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const search = document.getElementById('search');
const tableRows = document.querySelectorAll('#employeeTable tr');

search.addEventListener('keyup', function () {
  const term = this.value.toLowerCase();
  tableRows.forEach(row => {
    const name = row.querySelector('td').innerText.toLowerCase();
    row.style.display = name.includes(term) ? '' : 'none';
  });
});
// Modal Elements
const modal = document.getElementById("addEmployeeModal");
const openBtn = document.querySelector(".add-btn");
const closeBtn = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const form = document.getElementById("addEmployeeForm");
const table = document.getElementById("employeeTable");

// Open Modal
openBtn.addEventListener("click", () => {
  modal.style.display = "flex";
});

// Close Modal
closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});
cancelBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// Add New Employee (sample data only)
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const firstName = document.getElementById("firstName").value;
  const lastName = document.getElementById("lastName").value;
  const email = document.getElementById("empEmail").value;
  const position = document.getElementById("position").value;
  const status = document.getElementById("status").value;
  const salary = document.getElementById("salary").value;

  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td><strong>${lastName}, ${firstName}</strong><br><span>${email}</span></td>
    <td>${position}</td>
    <td><span class="status ${status.toLowerCase()}">${status}</span></td>
    <td>₱${salary}</td>
    <td><button class="edit">✏️</button> <button class="delete">🗑️</button></td>
  `;

  table.appendChild(newRow);
  modal.style.display = "none";
  form.reset();
});
