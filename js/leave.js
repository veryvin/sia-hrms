const SUPABASE_URL = 'https://giuklazjcvfkpyylmtrm.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdWtsYXpqY3Zma3B5eWxtdHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MjcyMDUsImV4cCI6MjA3ODUwMzIwNX0.vEOtSgr4rMUxNlfAunhNvG2L0oMloV9x4thi3vz0EPc';

// 2. Initialization: The createClient function is globally available via the CDN.
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {
  // ===== User Menu =====
  const userIcon = document.getElementById('userIcon');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const userEmailDisplay = document.getElementById('userEmailDisplay');

  userIcon.addEventListener('click', () => {
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
  });

  userEmailDisplay.textContent = localStorage.getItem('userEmail') || "";

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    window.location.href = 'index.html';
  });

  // ===== Tabs =====
  const tabs = document.querySelectorAll('.tab');
  const leaveList = document.getElementById('leaveList');

  let leaveRequests = JSON.parse(localStorage.getItem('leaveRequests')) || [];

  // Render leave requests
  function renderLeaves(filter = 'all') {
    const filtered =
      filter === 'all'
        ? leaveRequests
        : leaveRequests.filter(l => l.status === filter);

    if (filtered.length === 0) {
      leaveList.innerHTML = `<p class="no-leave">No ${filter} leave requests found</p>`;
      return;
    }

    leaveList.innerHTML = filtered
      .map(l => `
        <div class="leave-card ${l.status}">
          <div class="leave-info">
            <h4>${l.employee} <span class="status ${l.status}">${l.status}</span></h4>
            <p><strong>Type:</strong> ${l.leaveType}</p>
            <p><strong>Dates:</strong> ${l.startDate} → ${l.endDate}</p>
            <p><strong>Reason:</strong> ${l.reason}</p>
          </div>
          ${l.status === 'pending' ? `
            <div class="actions">
              <button class="btn-approve" data-id="${l.id}">Approve</button>
              <button class="btn-reject" data-id="${l.id}">Reject</button>
            </div>` : ''}
        </div>
      `)
      .join("");
  }

  // ===== Tab switching =====
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabType = tab.getAttribute('data-tab');
      renderLeaves(tabType);
    });
  });

  // ===== Modal Logic =====
  const leaveModal = document.getElementById('leaveModal');
  const newLeaveBtn = document.getElementById('newLeaveBtn');
  const closeModal = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const leaveForm = document.getElementById('leaveForm');

  newLeaveBtn.addEventListener('click', () => {
    leaveModal.style.display = 'flex';
  });

  closeModal.addEventListener('click', () => {
    leaveModal.style.display = 'none';
  });

  cancelBtn.addEventListener('click', () => {
    leaveModal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === leaveModal) {
      leaveModal.style.display = 'none';
    }
  });

  // ===== Submit Form =====
  leaveForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newLeave = {
      id: Date.now(),
      employee: document.getElementById('employee').value,
      leaveType: document.getElementById('leaveType').value,
      startDate: document.getElementById('startDate').value,
      endDate: document.getElementById('endDate').value,
      reason: document.getElementById('reason').value,
      status: 'pending'
    };

    leaveRequests.push(newLeave);
    localStorage.setItem('leaveRequests', JSON.stringify(leaveRequests));

    leaveForm.reset();
    leaveModal.style.display = 'none';
    renderLeaves('all');
  });

  // ===== Approve/Reject Buttons =====
  leaveList.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-approve')) {
      const id = parseInt(e.target.dataset.id);
      updateStatus(id, 'approved');
    }
    if (e.target.classList.contains('btn-reject')) {
      const id = parseInt(e.target.dataset.id);
      updateStatus(id, 'rejected');
    }
  });

  function updateStatus(id, status) {
    const index = leaveRequests.findIndex(l => l.id === id);
    if (index !== -1) {
      leaveRequests[index].status = status;
      localStorage.setItem('leaveRequests', JSON.stringify(leaveRequests));
      const activeTab = document.querySelector('.tab.active').dataset.tab;
      renderLeaves(activeTab);
    }
  }

  // ===== Initial render =====
  renderLeaves('all');
});
