// ===================================================
// LEAVE REQUEST - EMPLOYEE RESTRICTED VIEW
// ===================================================

document.addEventListener("DOMContentLoaded", () => {
  const supabase = window.supabaseClient;

  if (!supabase) {
    console.error("Supabase client is not initialized on the window object.");
    document.getElementById('leaveList').innerHTML = `<p class="no-leave" style="color: red;">ERROR: Supabase connection failed to initialize.</p>`;
    return;
  }

  // Get logged in user info
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
  const userRole = loggedInUser.role || 'Employee';
  const userId = loggedInUser.empId || loggedInUser.employee_id || '';

  console.log('🔍 User Role:', userRole);
  console.log('🔍 User ID:', userId);

  /* ========== SUPABASE FUNCTIONS ========== */
  async function fetchLeaves() {
    try {
      let query = supabase
        .from('leave_requests')
        .select(`
          id,
          employee_id,
          leave_type,
          start_date,
          end_date,
          number_of_days,
          comments,
          status,
          created_at,
          employees(
            employee_id,
            first_name,
            last_name,
            positions(
              position_name,
              departments(department_name)
            )
          )
        `)
        .order('created_at', { ascending: false });

      // CRITICAL: Filter by employee_id for Employee role
      if (userRole === "Employee" && userId) {
        console.log('🔒 Filtering leaves for employee:', userId);
        query = query.eq('employee_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(leave => ({
        id: leave.id,
        employeeId: leave.employee_id,
        employeeName: `${leave.employees.first_name} ${leave.employees.last_name}`,
        department: leave.employees.positions?.departments?.department_name || '-',
        position: leave.employees.positions?.position_name || '-',
        leaveType: leave.leave_type,
        startDate: leave.start_date,
        endDate: leave.end_date,
        numberOfDays: leave.number_of_days,
        reason: leave.comments,
        status: leave.status,
        createdAt: leave.created_at
      }));
    } catch (error) {
      console.error('Error fetching leaves:', error);
      return [];
    }
  }

  async function fetchEmployees() {
    try {
      let query = supabase
        .from('employees')
        .select(`
          id,
          employee_id,
          first_name,
          last_name,
          positions(
            position_name,
            departments(department_name)
          )
        `);

      // CRITICAL: Filter by employee_id for Employee role
      if (userRole === "Employee" && userId) {
        console.log('🔒 Filtering employees for:', userId);
        query = query.eq('employee_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(emp => ({
        id: emp.id,
        empId: emp.employee_id,
        firstName: emp.first_name,
        lastName: emp.last_name,
        department: emp.positions?.departments?.department_name || '',
        position: emp.positions?.position_name || ''
      }));
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  }

  async function fetchLeaveBalance(employeeId) {
    try {
      const { data, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', employeeId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? data.balance : 12;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 12;
    }
  }

  async function ensureLeaveBalance(employeeId) {
    try {
      const { data: existing } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', employeeId)
        .single();

      if (!existing) {
        await supabase
          .from('leave_balances')
          .insert({
            employee_id: employeeId,
            balance: 12,
            year: new Date().getFullYear()
          });
      }
    } catch (error) {
      console.error('Error ensuring balance:', error);
    }
  }

  async function insertLeaveRequest(leaveData) {
    const days = daysBetweenInclusive(leaveData.startDate, leaveData.endDate);

    try {
      const currentBalance = await fetchLeaveBalance(leaveData.employeeId);
      
      if (currentBalance < days) {
        alert(`❌ Insufficient leave balance! You have ${currentBalance} days available, but requesting ${days} days.`);
        return false;
      }

      const { error } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: leaveData.employeeId,
          leave_type: leaveData.leaveType,
          start_date: leaveData.startDate,
          end_date: leaveData.endDate,
          number_of_days: days,
          comments: leaveData.reason,
          status: 'Pending'
        });

      if (error) throw error;
      
      alert(`✅ Leave request submitted successfully! Requesting ${days} day(s). Current balance: ${currentBalance} days.`);
      return true;
    } catch (error) {
      console.error('Error inserting leave:', error);
      alert('❌ Error submitting leave request: ' + error.message);
      return false;
    }
  }

  /* ========== HELPERS ========== */
  function daysBetweenInclusive(startStr, endStr) {
    const s = new Date(startStr);
    const e = new Date(endStr);
    s.setHours(0,0,0,0);
    e.setHours(0,0,0,0);
    const msPerDay = 24 * 60 * 60 * 1000;
    const diff = Math.round((e - s) / msPerDay) + 1;
    return diff > 0 ? diff : 0;
  }

  /* ========== DOM ELEMENTS ========== */
  const tabs = document.querySelectorAll('.tab');
  const leaveList = document.getElementById('leaveList');
  const leaveModal = document.getElementById('leaveModal');
  const closeModal = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const leaveForm = document.getElementById('leaveForm');

  const employeeIdInput = document.getElementById('employeeId');
  const employeeNameInput = document.getElementById('employeeName');
  const departmentInput = document.getElementById('department');
  const positionInput = document.getElementById('position');
  const remainingBalance = document.getElementById('remainingBalance');
  const leaveTypeSelect = document.getElementById('leaveType');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const reasonInput = document.getElementById('reason');

  /* ========== RENDER FUNCTIONS ========== */
  async function renderBalancesTable() {
    const employees = await fetchEmployees();

    if (!employees || employees.length === 0) {
      if (userRole === "Employee") {
        leaveList.innerHTML = `<p class="no-leave">Loading your leave balance...</p>`;
      } else {
        leaveList.innerHTML = `<p class="no-leave">No employees found. Add employees from the Employee page first.</p>`;
      }
      return;
    }

    const html = `
      <div class="table-responsive">
        <table class="leaves-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Position</th>
              <th>Available Leaves</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
          ${
            await Promise.all(employees.map(async emp => {
              const fullName = `${emp.firstName} ${emp.lastName}`;
              const balance = await fetchLeaveBalance(emp.empId);
              await ensureLeaveBalance(emp.empId);

              return `
                <tr>
                  <td>${emp.empId}</td>
                  <td>${fullName}</td>
                  <td>${emp.department || '-'}</td>
                  <td>${emp.position || '-'}</td>
                  <td><strong>${balance} days</strong></td>
                  <td>
                    <button 
                      class="action-btn btn-open-request" 
                      data-id="${emp.empId}" 
                      data-name="${fullName}" 
                      data-dept="${emp.department || ''}" 
                      data-pos="${emp.position || ''}">
                      + Leave Request
                    </button>
                  </td>
                </tr>
              `;
            })).then(rows => rows.join(''))
          }
          </tbody>
        </table>
      </div>
    `;
    leaveList.innerHTML = html;
  }

  async function renderLeavesTab(filter) {
    const leaves = await fetchLeaves();
    let filtered = leaves;
    
    const normalizedFilter = filter.charAt(0).toUpperCase() + filter.slice(1).toLowerCase();

    if (filter !== 'all') {
      filtered = leaves.filter(l => l.status === normalizedFilter);
    }

    if (!filtered.length) {
      if (userRole === "Employee") {
        leaveList.innerHTML = `<p class="no-leave">You have no ${normalizedFilter} requests.</p>`;
      } else {
        leaveList.innerHTML = `<p class="no-leave">No ${normalizedFilter} requests found.</p>`;
      }
      return;
    }

    leaveList.innerHTML = filtered.map(l => `
      <div class="leave-card ${l.status.toLowerCase()}">
        <div class="leave-info">
          <h4>${l.employeeName} <span class="status ${l.status.toLowerCase()}">${l.status.toUpperCase()}</span></h4>
          <p><strong>ID:</strong> ${l.employeeId}</p>
          <p><strong>Department:</strong> ${l.department}</p>
          <p><strong>Position:</strong> ${l.position}</p>
          <p><strong>Type:</strong> ${l.leaveType}</p>
          <p><strong>Dates:</strong> ${l.startDate} → ${l.endDate}</p>
          <p><strong>Days:</strong> ${l.numberOfDays}</p>
          <p><strong>Reason:</strong> ${l.reason || '-'}</p>
          <p style="font-size: 0.85rem; color: #6b7280;"><strong>Submitted:</strong> ${new Date(l.createdAt).toLocaleString()}</p>
        </div>
      </div>
    `).join('');
  }

  /* ========== TABS ========== */
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');

      const type = tab.dataset.tab;
      if (type === 'balances') renderBalancesTable();
      else renderLeavesTab(type);
    });
  });

  /* ========== MODAL OPEN ========== */
  document.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('btn-open-request')) return;

    const id = e.target.dataset.id;
    const name = e.target.dataset.name;
    const dept = e.target.dataset.dept;
    const pos = e.target.dataset.pos;

    // For employees, pre-fill with their own data and make fields readonly
    if (userRole === "Employee") {
      employeeIdInput.value = id;
      employeeNameInput.value = name;
      departmentInput.value = dept;
      positionInput.value = pos;
      
      // Make fields readonly for employees
      employeeIdInput.readOnly = true;
      employeeNameInput.readOnly = true;
      departmentInput.readOnly = true;
      positionInput.readOnly = true;
    } else {
      employeeIdInput.value = id;
      employeeNameInput.value = name;
      departmentInput.value = dept;
      positionInput.value = pos;
      
      employeeIdInput.readOnly = false;
      employeeNameInput.readOnly = false;
      departmentInput.readOnly = false;
      positionInput.readOnly = false;
    }

    const balance = await fetchLeaveBalance(id);
    remainingBalance.textContent = `${balance} days`;

    leaveTypeSelect.value = 'Vacation';
    startDateInput.value = '';
    endDateInput.value = '';
    reasonInput.value = '';

    leaveModal.classList.add('show');
  });

  closeModal.addEventListener('click', () => leaveModal.classList.remove('show'));
  cancelBtn.addEventListener('click', () => leaveModal.classList.remove('show'));

  window.addEventListener('click', (e) => {
    if (e.target === leaveModal) leaveModal.classList.remove('show');
  });

  /* ========== SUBMIT LEAVE REQUEST ========== */
  leaveForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const employeeId = employeeIdInput.value.trim();
    const leaveType = leaveTypeSelect.value;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const reason = reasonInput.value.trim();

    if (!startDate || !endDate || !reason) {
      alert('Please fill all required fields (Start Date, End Date, and Reason).');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      alert("End date cannot be earlier than start date.");
      return;
    }

    const success = await insertLeaveRequest({
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason
    });

    if (success) {
      leaveModal.classList.remove('show');
      
      const pendingTab = document.querySelector('.tab[data-tab="pending"]');
      if (pendingTab) {
        tabs.forEach(t=>t.classList.remove('active'));
        pendingTab.classList.add('active');
        renderLeavesTab('pending');
      } else {
        renderLeavesTab('pending');
      }
      
      renderBalancesTable(); 
    }
  });

  /* ========== REALTIME UPDATES ========== */
  supabase
    .channel('leave-request-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => {
      const activeTab = document.querySelector('.tab.active');
      if (activeTab) {
        const type = activeTab.dataset.tab;
        if (type === 'balances') renderBalancesTable();
        else renderLeavesTab(type);
      }
    })
    .subscribe();

  supabase
    .channel('leave-balance-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_balances' }, () => {
      const activeTab = document.querySelector('.tab.active');
      if (activeTab && activeTab.dataset.tab === 'balances') {
        renderBalancesTable();
      }
    })
    .subscribe();

  /* ========== INITIAL RENDER ========== */
  renderBalancesTable();
});