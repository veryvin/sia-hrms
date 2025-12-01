document.addEventListener("DOMContentLoaded", () => {
  const supabase = window.supabaseClient;
  
  // Check if Supabase client is initialized
  if (!supabase) {
    console.error("Supabase client is not initialized on the window object.");
    const leaveList = document.getElementById('leaveList');
    if (leaveList) {
      leaveList.innerHTML = `<p class="no-leave" style="color: red;">ERROR: Supabase connection failed. Please check your configuration.</p>`;
    }
    return;
  }
  
  console.log("✅ Supabase client loaded successfully");
  
  // ===================================================
  // DISPLAY LOGGED IN USER
  // ===================================================
  const welcomeText = document.getElementById('welcomeText');
  const userEmailDisplay = document.getElementById('userEmailDisplay');
  
  const loggedInUserString = localStorage.getItem('loggedInUser');
  if (loggedInUserString) {
    try {
      const loggedInUser = JSON.parse(loggedInUserString);
      const displayName = loggedInUser.email || loggedInUser.first_name || loggedInUser.username || 'User';
      
      if (welcomeText) {
        welcomeText.textContent = `Welcome, ${displayName}`;
      }
      if (userEmailDisplay) {
        userEmailDisplay.textContent = displayName;
      }
      
      console.log("👤 Logged in user:", loggedInUser);
    } catch (e) {
      console.error("Error parsing logged in user:", e);
      if (welcomeText) welcomeText.textContent = "Welcome, User";
    }
  } else {
    console.warn("⚠️ No logged in user found in localStorage");
    if (welcomeText) welcomeText.textContent = "Welcome, Guest";
  }
  
  // ===================================================
  // FETCH DATA FROM SUPABASE
  // ===================================================
  async function fetchLeaves() {
    try {
      console.log("🔍 Fetching leave requests...");
      
      // First, let's try a simpler query to debug
      const { data, error } = await supabase
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
        .ilike('status', 'pending')
        .order('created_at', { ascending: false });
      
      console.log("📊 Query result:", { data, error });
      
      if (error) {
        console.error("❌ Supabase query error:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn("⚠️ No pending leave requests found");
        return [];
      }

      console.log(`✅ Found ${data.length} pending leave request(s)`);

      return (data || []).map(leave => {
        const employeeData = leave.employees;
        const firstName = employeeData?.first_name || 'Unknown';
        const lastName = employeeData?.last_name || '';
        const department = employeeData?.positions?.departments?.department_name || '-';
        const position = employeeData?.positions?.position_name || '-';
        
        console.log("Processing leave:", {
          id: leave.id,
          employeeData,
          department,
          position
        });
        
        return {
          id: leave.id,
          employeeId: leave.employee_id,
          employeeName: `${firstName} ${lastName}`.trim(),
          department,
          position,
          leaveType: leave.leave_type,
          startDate: leave.start_date,
          endDate: leave.end_date,
          numberOfDays: leave.number_of_days,
          reason: leave.comments || '-',
          status: leave.status
        };
      });
    } catch (error) {
      console.error('❌ Error fetching leaves:', error);
      return [];
    }
  }

  async function updateLeaveStatus(id, status) {
    try {
      const loggedInUserString = localStorage.getItem('loggedInUser');
      let updateData = { 
        status: status,
        updated_at: new Date().toISOString()
      };

      if (status === 'Approved' && loggedInUserString) {
        try {
          const loggedInUser = JSON.parse(loggedInUserString);
          // Use the UUID id field, not employee_id which is text like "EMP-100"
          updateData.approved_by = loggedInUser.id;
          updateData.approved_date = new Date().toISOString();
          console.log("Approver UUID:", loggedInUser.id);
        } catch (parseError) {
          console.warn("Could not parse logged in user:", parseError);
        }
      }

      console.log("Updating leave status:", { id, updateData });

      const { error } = await supabase
        .from('leave_requests')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      console.log("✅ Leave status updated successfully");
      return true;
    } catch (error) {
      console.error('❌ Error updating leave status:', error);
      alert('❌ Error updating leave: ' + error.message);
      return false;
    }
  }

  async function fetchLeaveBalance(employeeId) {
    try {
      console.log("Fetching balance for employee:", employeeId);
      
      const { data, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', employeeId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching balance:", error);
        throw error;
      }
      
      const balance = data ? data.balance : 12;
      console.log("Employee balance:", balance);
      return balance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 12;
    }
  }

  async function updateLeaveBalance(employeeId, newBalance) {
    try {
      console.log("Updating balance for employee:", employeeId, "to:", newBalance);
      
      const { data: existing } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', employeeId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('leave_balances')
          .update({ balance: newBalance })
          .eq('employee_id', employeeId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('leave_balances')
          .insert([{ 
            employee_id: employeeId, 
            balance: newBalance,
            year: new Date().getFullYear()
          }]);
        
        if (error) throw error;
      }
      
      console.log("✅ Balance updated successfully");
      return true;
    } catch (error) {
      console.error('❌ Error updating balance:', error);
      return false;
    }
  }

  // ===================================================
  // DOM ELEMENTS
  // ===================================================
  const leaveList = document.getElementById('leaveList');
  const dateFilter = document.getElementById('dateFilter');

  // ===================================================
  // FILTER HELPERS
  // ===================================================
  function inThisWeek(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0,0,0,0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23,59,59,999);
    return d >= start && d <= end;
  }

  function inThisMonth(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }

  function applyDateFilter(leaves, filter) {
    if (filter === 'this_week') {
      return leaves.filter(l => inThisWeek(l.startDate) || inThisWeek(l.endDate));
    } else if (filter === 'this_month') {
      return leaves.filter(l => inThisMonth(l.startDate) || inThisMonth(l.endDate));
    } else {
      return leaves;
    }
  }

  // ===================================================
  // RENDER TABLE
  // ===================================================
  async function renderManagerTable(filter = 'all') {
    console.log("🎨 Rendering table with filter:", filter);
    leaveList.innerHTML = '<p class="no-leave">Loading...</p>';
    
    const leaves = await fetchLeaves();
    console.log("Leaves fetched:", leaves.length);
    
    const filtered = applyDateFilter(leaves, filter);
    console.log("After filter:", filtered.length);

    if (!filtered || filtered.length === 0) {
      leaveList.innerHTML = `<p class="no-leave">No pending leave requests</p>`;
      return;
    }

    const tableHTML = `
      <div class="table-responsive">
        <table class="leaves-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Employee ID</th>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Position</th>
              <th>Type</th>
              <th>Dates</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(r => {
              return `
                <tr>
                  <td>${r.id}</td>
                  <td>${r.employeeId}</td>
                  <td>${r.employeeName}</td>
                  <td>${r.department}</td>
                  <td>${r.position}</td>
                  <td>${r.leaveType}</td>
                  <td>${r.startDate} → ${r.endDate}</td>
                  <td>${r.numberOfDays}</td>
                  <td>${r.reason}</td>
                  <td>
                    <button class="action-btn btn-approve" data-id="${r.id}" data-days="${r.numberOfDays}" data-emp="${r.employeeId}">Approve</button>
                    <button class="action-btn btn-reject" data-id="${r.id}" style="background:#b91c1c;">Reject</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
    leaveList.innerHTML = tableHTML;
    console.log("✅ Table rendered successfully");
  }

  // ===================================================
  // APPROVE / REJECT HANDLERS
  // ===================================================
  // leaveList.addEventListener (Around lines 305-314)

leaveList.addEventListener('click', async (e) => {
  if (e.target.classList.contains('btn-approve')) {
    const id = e.target.dataset.id;
    const days = parseInt(e.target.dataset.days);
    const empId = e.target.dataset.emp;
    await handleDecision(id, 'Approved', days, empId);
  } else if (e.target.classList.contains('btn-reject')) {
    const id = e.target.dataset.id;
    // FIX: Explicitly pass 0 for days and null for empId 
    await handleDecision(id, 'Rejected', 0, null); 
  }
});

async function handleDecision(id, decision, days = 0, empId = null) {
  if (decision === 'Approved') {
    if (!confirm(`Approve this leave request for ${days} day(s)?`)) return; // <-- ERROR LINE 332

      const currentBalance = await fetchLeaveBalance(empId);
      
      if (currentBalance < days) {
        alert(`❌ Insufficient leave balance! Employee has ${currentBalance} days, but ${days} days requested.`);
        return;
      }
      
      const newBalance = currentBalance - days;
      const balanceUpdated = await updateLeaveBalance(empId, newBalance);
      
      if (balanceUpdated) {
        const statusUpdated = await updateLeaveStatus(id, 'Approved');
        
        if (statusUpdated) {
          alert(`✅ Leave request approved! New balance: ${newBalance} days (${days} days deducted)`);
          await renderManagerTable(dateFilter.value);
        }
      }
    } else if (decision === 'Rejected') {
      if (!confirm('Reject this leave request?')) return;
      
      const statusUpdated = await updateLeaveStatus(id, 'Rejected');
      
      if (statusUpdated) {
        alert('❌ Leave request rejected');
        await renderManagerTable(dateFilter.value);
      }
    }
  }

  // ===================================================
  // INITIAL RENDER AND FILTER BINDING
  // ===================================================
  console.log("🚀 Starting initial render...");
  renderManagerTable('all');

  dateFilter.addEventListener('change', () => {
    console.log("Filter changed to:", dateFilter.value);
    renderManagerTable(dateFilter.value);
  });

  // ===================================================
  // REALTIME SUBSCRIPTION
  // ===================================================
  console.log("📡 Setting up realtime subscription...");
  supabase
    .channel('leave-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, (payload) => {
      console.log("📨 Realtime update received:", payload);
      renderManagerTable(dateFilter.value);
    })
    .subscribe((status) => {
      console.log("Subscription status:", status);
    });

});