// ===================================================
// DASHBOARD.JS - FIXED VERSION
// Matches actual HTML IDs from dashboard.html
// ===================================================

document.addEventListener("DOMContentLoaded", async () => {
  if (!window.supabaseClient) {
    console.error("❌ Supabase client not found!");
    alert("Database connection error. Please check supabase-config.js");
    return;
  }

  const supabase = window.supabaseClient;
  console.log("✅ Dashboard.js loaded with Supabase");

  // ==================== DISPLAY LOGGED IN USER ====================
  const welcomeText = document.getElementById('welcomeText');
  const userEmailDisplay = document.getElementById('userEmailDisplay');
  
  const loggedInUserString = localStorage.getItem('loggedInUser');
  if (loggedInUserString) {
    try {
      const loggedInUser = JSON.parse(loggedInUserString);
      const displayName = loggedInUser.email || loggedInUser.first_name || loggedInUser.username || 'User';
      
      if (welcomeText) welcomeText.textContent = `Welcome, ${displayName}`;
      if (userEmailDisplay) userEmailDisplay.textContent = displayName;
      
      console.log("👤 Logged in user:", loggedInUser);
    } catch (e) {
      console.error("Error parsing logged in user:", e);
    }
  }

  // ==================== FETCH FUNCTIONS ====================
  
  // 1. Fetch all employees with positions and departments
  async function fetchEmployees() {
    try {
      console.log("📊 Fetching employees...");
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          positions!employees_position_id_fkey(
            position_name,
            departments(department_name)
          )
        `);
      
      if (error) throw error;
      console.log(`✅ Found ${data?.length || 0} employees`);
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
      return [];
    }
  }

  // 2. Fetch today's attendance
  async function fetchTodayAttendance() {
    try {
      console.log("📊 Fetching today's attendance...");
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance')
        .select('employee_id')
        .eq('date', today);
      
      if (error) throw error;
      
      // Get unique employee IDs who have attendance today
      const uniqueEmployeeIds = [...new Set(data.map(r => r.employee_id))];
      console.log(`✅ ${uniqueEmployeeIds.length} employees present today`);
      return uniqueEmployeeIds;
    } catch (error) {
      console.error('❌ Error fetching attendance:', error);
      return [];
    }
  }

  // 3. Fetch pending leave requests
  async function fetchPendingLeaves() {
    try {
      console.log("📊 Fetching pending leaves...");
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employees(
            employee_id,
            first_name,
            last_name
          )
        `)
        .ilike('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log(`✅ Found ${data?.length || 0} pending leave requests`);
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching pending leaves:', error);
      return [];
    }
  }

  // 4. Fetch current month payroll
  async function fetchCurrentMonthPayroll() {
    try {
      console.log("📊 Fetching current month payroll...");
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const startDate = `${year}-${month}-01`;
      
      const { data, error } = await supabase
        .from('payroll')
        .select('*, employees(first_name, last_name, employee_id)')
        .gte('pay_period_start', startDate)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log(`✅ Found ${data?.length || 0} payroll records this month`);
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching payroll:', error);
      return [];
    }
  }

  // 5. Fetch recent leave requests (for the list)
  async function fetchRecentLeaveRequests() {
    try {
      console.log("📊 Fetching recent leave requests...");
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
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
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      console.log(`✅ Found ${data?.length || 0} recent leave requests`);
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching recent leaves:', error);
      return [];
    }
  }

  // 6. Fetch department distribution
  async function fetchDepartmentDistribution() {
    try {
      console.log("📊 Fetching department distribution...");
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          positions!employees_position_id_fkey(
            departments(department_name)
          )
        `);
      
      if (error) throw error;
      
      // Count employees per department
      const deptCounts = {};
      let unassignedCount = 0;
      
      data.forEach(emp => {
        const deptName = emp.positions?.departments?.department_name;
        if (deptName) {
          deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
        } else {
          unassignedCount++;
        }
      });
      
      console.log("✅ Department distribution calculated:", deptCounts);
      return { deptCounts, unassignedCount, total: data.length };
    } catch (error) {
      console.error('❌ Error fetching department distribution:', error);
      return { deptCounts: {}, unassignedCount: 0, total: 0 };
    }
  }

  // ==================== UPDATE DASHBOARD CARDS ====================
  
  async function updateDashboardCards() {
    console.log('🔄 Updating dashboard cards...');
    
    // Fetch all data in parallel
    const [
      employees,
      todayAttendance,
      pendingLeaves,
      currentPayroll,
      recentLeaves,
      deptData
    ] = await Promise.all([
      fetchEmployees(),
      fetchTodayAttendance(),
      fetchPendingLeaves(),
      fetchCurrentMonthPayroll(),
      fetchRecentLeaveRequests(),
      fetchDepartmentDistribution()
    ]);

    // 1. Total Employees Card (FIXED IDs)
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => 
      e.employment_status === 'Regular' || e.employment_status === 'Probationary'
    ).length;
    
    const totalEmpElement = document.getElementById('totalEmployees');
    const activeEmpElement = document.getElementById('activeEmployees');
    
    if (totalEmpElement) {
      totalEmpElement.textContent = totalEmployees;
      console.log("✅ Updated Total Employees:", totalEmployees);
    }
    if (activeEmpElement) {
      activeEmpElement.textContent = `${activeEmployees} Active`;
      console.log("✅ Updated Active Employees:", activeEmployees);
    }

    // 2. Present Today Card (FIXED IDs)
    const presentCount = todayAttendance.length;
    
    const presentElement = document.getElementById('presentToday');
    const presentDetailElement = document.getElementById('presentTodayText');
    
    if (presentElement) {
      presentElement.textContent = presentCount;
      console.log("✅ Updated Present Today:", presentCount);
    }
    if (presentDetailElement) {
      presentDetailElement.textContent = `Out of ${totalEmployees}`;
    }

    // 3. Pending Leaves Card (FIXED IDs)
    const pendingCount = pendingLeaves.length;
    
    const pendingElement = document.getElementById('pendingLeaves');
    
    if (pendingElement) {
      pendingElement.textContent = pendingCount;
      console.log("✅ Updated Pending Leaves:", pendingCount);
    }

    // 4. Monthly Payroll Card (FIXED IDs)
    const totalPayroll = currentPayroll.reduce((sum, p) => sum + (parseFloat(p.net_pay) || 0), 0);
    const processedCount = currentPayroll.length;
    
    const payrollElement = document.getElementById('monthlyPayroll');
    const payrollDetailElement = document.getElementById('payrollProcessed');
    
    if (payrollElement) {
      payrollElement.textContent = `₱${totalPayroll.toLocaleString('en-PH', {minimumFractionDigits: 2})}`;
      console.log("✅ Updated Monthly Payroll:", totalPayroll);
    }
    if (payrollDetailElement) {
      payrollDetailElement.textContent = `${processedCount} processed`;
    }

    // 5. Recent Leave Requests (FIXED ID)
    renderRecentLeaveRequests(recentLeaves);

    // 6. Department Distribution (FIXED ID)
    renderDepartmentDistribution(deptData);

    console.log('✅ Dashboard updated successfully!');
  }

  // ==================== RENDER RECENT LEAVE REQUESTS ====================
  
  function renderRecentLeaveRequests(leaves) {
    const container = document.getElementById('leaveRequestsList');
    if (!container) {
      console.warn("⚠️ #leaveRequestsList not found");
      return;
    }

    if (!leaves || leaves.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 20px;">No recent leave requests</p>';
      console.log("ℹ️ No recent leave requests to display");
      return;
    }

    const html = leaves.map(leave => {
      const empName = leave.employees 
        ? `${leave.employees.first_name} ${leave.employees.last_name}` 
        : 'Unknown';
      const empId = leave.employees?.employee_id || leave.employee_id;
      const dept = leave.employees?.positions?.departments?.department_name || 'N/A';
      const position = leave.employees?.positions?.position_name || 'N/A';
      
      let statusClass = '';
      let statusColor = '';
      
      if (leave.status === 'Pending') {
        statusClass = 'pending';
        statusColor = '#f59e0b';
      } else if (leave.status === 'Approved') {
        statusClass = 'approved';
        statusColor = '#10b981';
      } else if (leave.status === 'Rejected') {
        statusClass = 'rejected';
        statusColor = '#ef4444';
      }

      return `
        <div style="padding: 14px; margin-bottom: 12px; border-left: 4px solid ${statusColor}; background: #f9fafb; border-radius: 8px; transition: all 0.2s; cursor: pointer;" onclick="viewLeaveDetails('${leave.id}')">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: #111827;">${empName}</strong>
            <span style="padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; background: ${statusColor}20; color: ${statusColor};">
              ${leave.status.toUpperCase()}
            </span>
          </div>
          <div style="font-size: 0.85rem; color: #6b7280;">
            <p style="margin: 4px 0;">📋 ${empId} • ${dept} • ${position}</p>
            <p style="margin: 4px 0;">📅 ${leave.start_date} to ${leave.end_date}</p>
            <p style="margin: 4px 0;">📝 ${leave.leave_type} • ${leave.number_of_days} day(s)</p>
            ${leave.comments ? `<p style="margin: 4px 0; font-style: italic;">"${leave.comments}"</p>` : ''}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
    console.log("✅ Recent leave requests rendered");
  }

  // ==================== VIEW LEAVE DETAILS MODAL ====================
  
  window.viewLeaveDetails = async function(leaveId) {
    try {
      console.log("🔍 Fetching leave details for ID:", leaveId);
      
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employees(
            employee_id,
            first_name,
            last_name,
            email,
            phone,
            positions(
              position_name,
              departments(department_name)
            )
          )
        `)
        .eq('id', leaveId)
        .single();
      
      if (error) throw error;
      
      const leave = data;
      const emp = leave.employees;
      const empName = emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown';
      const empId = emp?.employee_id || leave.employee_id;
      const dept = emp?.positions?.departments?.department_name || 'N/A';
      const position = emp?.positions?.position_name || 'N/A';
      const email = emp?.email || 'N/A';
      const phone = emp?.phone || 'N/A';
      
      let statusColor = '';
      let statusBg = '';
      
      if (leave.status === 'Pending') {
        statusColor = '#f59e0b';
        statusBg = '#fef3c7';
      } else if (leave.status === 'Approved') {
        statusColor = '#10b981';
        statusBg = '#d1fae5';
      } else if (leave.status === 'Rejected') {
        statusColor = '#ef4444';
        statusBg = '#fee2e2';
      }
      
      const modalHTML = `
        <div id="leaveDetailsModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
          <div style="background: white; border-radius: 16px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2d6e4e 0%, #16a34a 100%); padding: 24px; border-radius: 16px 16px 0 0; color: white;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0; font-size: 1.5rem;">📋 Leave Request Details</h2>
                <button onclick="closeLeaveDetailsModal()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center;">✕</button>
              </div>
            </div>
            
            <!-- Content -->
            <div style="padding: 24px;">
              
              <!-- Status Badge -->
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="display: inline-block; padding: 8px 24px; border-radius: 20px; font-size: 14px; font-weight: 700; background: ${statusBg}; color: ${statusColor};">
                  ${leave.status.toUpperCase()}
                </span>
              </div>
              
              <!-- Employee Info -->
              <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #2d6e4e;">
                <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                  👤 Employee Information
                </h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #6b7280; font-weight: 600;">Employee Name:</span>
                    <span style="color: #111827; font-weight: 600;">${empName}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #6b7280; font-weight: 600;">Employee ID:</span>
                    <span style="color: #111827; font-weight: 600;">${empId}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #6b7280; font-weight: 600;">Department:</span>
                    <span style="color: #111827; font-weight: 600;">${dept}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #6b7280; font-weight: 600;">Position:</span>
                    <span style="color: #111827; font-weight: 600;">${position}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #6b7280; font-weight: 600;">Email:</span>
                    <span style="color: #111827; font-weight: 600;">${email}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #6b7280; font-weight: 600;">Phone:</span>
                    <span style="color: #111827; font-weight: 600;">${phone}</span>
                  </div>
                </div>
              </div>
              
              <!-- Leave Info -->
              <div style="background: #eff6ff; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
                <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                  📅 Leave Information
                </h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #6b7280; font-weight: 600;">Leave Type:</span>
                    <span style="color: #111827; font-weight: 600;">${leave.leave_type}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #6b7280; font-weight: 600;">Start Date:</span>
                    <span style="color: #111827; font-weight: 600;">${leave.start_date}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #6b7280; font-weight: 600;">End Date:</span>
                    <span style="color: #111827; font-weight: 600;">${leave.end_date}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #6b7280; font-weight: 600;">Number of Days:</span>
                    <span style="color: #111827; font-weight: 600;">${leave.number_of_days} day(s)</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #6b7280; font-weight: 600;">Submitted:</span>
                    <span style="color: #111827; font-weight: 600;">${new Date(leave.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <!-- Reason -->
              ${leave.comments ? `
              <div style="background: #fef3c7; padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
                <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                  💬 Reason for Leave
                </h3>
                <p style="margin: 0; color: #374151; line-height: 1.6; font-style: italic;">
                  "${leave.comments}"
                </p>
              </div>
              ` : ''}
              
              <!-- Close Button -->
              <div style="margin-top: 24px; text-align: center;">
                <button onclick="closeLeaveDetailsModal()" style="padding: 12px 32px; background: #2d6e4e; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s;">
                  Close
                </button>
              </div>
              
            </div>
          </div>
        </div>
      `;
      
      // Remove existing modal if any
      const existingModal = document.getElementById('leaveDetailsModal');
      if (existingModal) existingModal.remove();
      
      // Add new modal to body
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      
      console.log("✅ Leave details modal displayed");
      
    } catch (error) {
      console.error("❌ Error fetching leave details:", error);
      alert("Error loading leave details: " + error.message);
    }
  };
  
  window.closeLeaveDetailsModal = function() {
    const modal = document.getElementById('leaveDetailsModal');
    if (modal) {
      modal.remove();
      console.log("✅ Leave details modal closed");
    }
  };

  // ==================== RENDER DEPARTMENT DISTRIBUTION ====================
  
  function renderDepartmentDistribution(deptData) {
    const container = document.getElementById('departmentDistribution');
    if (!container) {
      console.warn("⚠️ #departmentDistribution not found");
      return;
    }

    const { deptCounts, unassignedCount, total } = deptData;
    
    if (total === 0) {
      container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 20px;">No employees found</p>';
      console.log("ℹ️ No employees to display in department distribution");
      return;
    }

    let html = '';

    // Unassigned employees
    if (unassignedCount > 0) {
      const percentage = ((unassignedCount / total) * 100).toFixed(1);
      html += `
        <div class="dept" style="margin-bottom: 16px; padding: 14px; background: #f9fafb; border-radius: 10px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='#f9fafb'">
          <span style="display: block; font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 8px;">
            Unassigned
          </span>
          <div class="bar" style="background: #e5e7eb; border-radius: 8px; height: 8px; overflow: hidden;">
            <div class="fill" style="width: ${percentage}%; height: 100%; background: #94a3b8; border-radius: 8px; transition: width 0.6s ease;"></div>
          </div>
          <span class="count" style="font-size: 0.8rem; color: #6b7280; display: block; margin-top: 4px;">
            ${unassignedCount} employee(s) • ${percentage}%
          </span>
        </div>
      `;
    }

    // Department-wise breakdown
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    let colorIndex = 0;

    Object.entries(deptCounts).forEach(([deptName, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);
      const color = colors[colorIndex % colors.length];
      colorIndex++;

      html += `
        <div class="dept" style="margin-bottom: 16px; padding: 14px; background: #f9fafb; border-radius: 10px; cursor: pointer; transition: all 0.2s;" onclick="viewDepartmentDetails('${deptName}')" onmouseover="this.style.background='#f3f4f6'; this.style.transform='translateX(4px)'" onmouseout="this.style.background='#f9fafb'; this.style.transform='translateX(0)'">
          <span style="display: block; font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 8px;">
            ${deptName}
          </span>
          <div class="bar" style="background: #e5e7eb; border-radius: 8px; height: 8px; overflow: hidden;">
            <div class="fill" style="width: ${percentage}%; height: 100%; background: ${color}; border-radius: 8px; transition: width 0.6s ease;"></div>
          </div>
          <span class="count" style="font-size: 0.8rem; color: #6b7280; display: block; margin-top: 4px;">
            ${count} employee(s) • ${percentage}%
          </span>
        </div>
      `;
    });

    // Summary
    const numDepartments = Object.keys(deptCounts).length;
    html += `
      <div class="note" style="color: #2d6e4e; font-size: 0.9rem; margin-top: 16px; padding: 12px; background: #f0fdf4; border-left: 3px solid #2d6e4e; border-radius: 6px; font-weight: 600;">
        📊 Total: ${total} employees across ${numDepartments} department${numDepartments !== 1 ? 's' : ''}
      </div>
    `;

    container.innerHTML = html;
    console.log("✅ Department distribution rendered");
  }

  // ==================== VIEW DEPARTMENT DETAILS ====================
  
  window.viewDepartmentDetails = async function(departmentName) {
    try {
      console.log("🔍 Fetching employees in department:", departmentName);
      
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          positions!employees_position_id_fkey(
            position_name,
            departments(department_name)
          )
        `);
      
      if (error) throw error;
      
      // Filter employees by department
      const deptEmployees = data.filter(emp => 
        emp.positions?.departments?.department_name === departmentName
      );
      
      if (deptEmployees.length === 0) {
        alert(`No employees found in ${departmentName}`);
        return;
      }
      
      const employeeRows = deptEmployees.map((emp, index) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px; text-align: center;">${index + 1}</td>
          <td style="padding: 12px;">${emp.employee_id}</td>
          <td style="padding: 12px; font-weight: 600;">${emp.first_name} ${emp.last_name}</td>
          <td style="padding: 12px;">${emp.positions?.position_name || 'N/A'}</td>
          <td style="padding: 12px;">${emp.email || 'N/A'}</td>
          <td style="padding: 12px;">${emp.phone || 'N/A'}</td>
          <td style="padding: 12px; text-align: center;">
            <span style="padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; background: ${emp.employment_status === 'Regular' ? '#d1fae5' : '#fef3c7'}; color: ${emp.employment_status === 'Regular' ? '#065f46' : '#92400e'};">
              ${emp.employment_status || 'N/A'}
            </span>
          </td>
        </tr>
      `).join('');
      
      const modalHTML = `
        <div id="deptDetailsModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;">
          <div style="background: white; border-radius: 16px; width: 95%; max-width: 1200px; max-height: 90vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); display: flex; flex-direction: column;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2d6e4e 0%, #16a34a 100%); padding: 24px; color: white;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h2 style="margin: 0; font-size: 1.5rem; display: flex; align-items: center; gap: 10px;">
                    🏢 ${departmentName}
                  </h2>
                  <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 0.95rem;">
                    ${deptEmployees.length} employee${deptEmployees.length !== 1 ? 's' : ''} in this department
                  </p>
                </div>
                <button onclick="closeDeptDetailsModal()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 24px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">✕</button>
              </div>
            </div>
            
            <!-- Table Container -->
            <div style="flex: 1; overflow-y: auto; padding: 24px;">
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 14px; text-align: center; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">#</th>
                    <th style="padding: 14px; text-align: left; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">Employee ID</th>
                    <th style="padding: 14px; text-align: left; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">Name</th>
                    <th style="padding: 14px; text-align: left; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">Position</th>
                    <th style="padding: 14px; text-align: left; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">Email</th>
                    <th style="padding: 14px; text-align: left; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">Phone</th>
                    <th style="padding: 14px; text-align: center; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${employeeRows}
                </tbody>
              </table>
            </div>
            
            <!-- Footer -->
            <div style="padding: 20px 24px; border-top: 1px solid #e5e7eb; background: #f9fafb; text-align: center;">
              <button onclick="closeDeptDetailsModal()" style="padding: 12px 32px; background: #2d6e4e; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s;">
                Close
              </button>
            </div>
            
          </div>
        </div>
      `;
      
      // Remove existing modal if any
      const existingModal = document.getElementById('deptDetailsModal');
      if (existingModal) existingModal.remove();
      
      // Add new modal to body
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      
      console.log(`✅ Department details modal displayed for ${departmentName}`);
      
    } catch (error) {
      console.error("❌ Error fetching department details:", error);
      alert("Error loading department details: " + error.message);
    }
  };
  
  window.closeDeptDetailsModal = function() {
    const modal = document.getElementById('deptDetailsModal');
    if (modal) {
      modal.remove();
      console.log("✅ Department details modal closed");
    }
  };

  // ==================== REALTIME SUBSCRIPTIONS ====================
  
  console.log("📡 Setting up realtime subscriptions...");

  // Subscribe to employee changes
  supabase
    .channel('dashboard-employees')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
      console.log('🔄 Employee data changed - refreshing dashboard');
      updateDashboardCards();
    })
    .subscribe();

  // Subscribe to attendance changes
  supabase
    .channel('dashboard-attendance')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
      console.log('🔄 Attendance data changed - refreshing dashboard');
      updateDashboardCards();
    })
    .subscribe();

  // Subscribe to leave request changes
  supabase
    .channel('dashboard-leaves')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => {
      console.log('🔄 Leave request data changed - refreshing dashboard');
      updateDashboardCards();
    })
    .subscribe();

  // Subscribe to payroll changes
  supabase
    .channel('dashboard-payroll')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'payroll' }, () => {
      console.log('🔄 Payroll data changed - refreshing dashboard');
      updateDashboardCards();
    })
    .subscribe();

  // ==================== INITIAL LOAD ====================
  console.log('🚀 Dashboard initializing...');
  await updateDashboardCards();
  console.log('✅ Dashboard ready!');
  
  // ==================== VIEW ALL BUTTONS ====================
  
  // Add click handlers for "View All" links
  document.addEventListener('click', (e) => {
    // View All for Leave Requests
    if (e.target.classList.contains('view-all') && e.target.closest('.panel')?.querySelector('#leaveRequestsList')) {
      e.preventDefault();
      window.location.href = 'leaverequest.html';
    }
    
    // View Details for Department Distribution
    if (e.target.classList.contains('view-all') && e.target.closest('.panel')?.querySelector('#departmentDistribution')) {
      e.preventDefault();
      viewAllDepartments();
    }
  });
  
  // ==================== VIEW ALL DEPARTMENTS ====================
  
  window.viewAllDepartments = async function() {
    try {
      console.log("🔍 Fetching all departments and employees...");
      
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          positions!employees_position_id_fkey(
            position_name,
            departments(department_name)
          )
        `)
        .order('first_name', { ascending: true });
      
      if (error) throw error;
      
      // Group employees by department
      const deptGroups = {};
      let unassigned = [];
      
      data.forEach(emp => {
        const deptName = emp.positions?.departments?.department_name;
        if (deptName) {
          if (!deptGroups[deptName]) deptGroups[deptName] = [];
          deptGroups[deptName].push(emp);
        } else {
          unassigned.push(emp);
        }
      });
      
      // Generate HTML for each department
      let departmentSections = '';
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
      let colorIndex = 0;
      
      Object.entries(deptGroups).forEach(([deptName, employees]) => {
        const color = colors[colorIndex % colors.length];
        colorIndex++;
        
        const employeeRows = employees.map((emp, index) => `
          <tr style="border-bottom: 1px solid #e5e7eb; transition: background 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
            <td style="padding: 12px; text-align: center; color: #6b7280;">${index + 1}</td>
            <td style="padding: 12px; font-weight: 600; color: #111827;">${emp.employee_id}</td>
            <td style="padding: 12px; font-weight: 600; color: #111827;">${emp.first_name} ${emp.last_name}</td>
            <td style="padding: 12px; color: #374151;">${emp.positions?.position_name || 'N/A'}</td>
            <td style="padding: 12px; color: #374151;">${emp.email || 'N/A'}</td>
            <td style="padding: 12px; color: #374151;">${emp.phone || 'N/A'}</td>
            <td style="padding: 12px; text-align: center;">
              <span style="padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; background: ${emp.employment_status === 'Regular' ? '#d1fae5' : '#fef3c7'}; color: ${emp.employment_status === 'Regular' ? '#065f46' : '#92400e'};">
                ${emp.employment_status || 'N/A'}
              </span>
            </td>
          </tr>
        `).join('');
        
        departmentSections += `
          <div style="margin-bottom: 32px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="background: ${color}; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center;">
              <h3 style="margin: 0; color: white; font-size: 1.2rem; font-weight: 700;">
                🏢 ${deptName}
              </h3>
              <span style="background: rgba(255,255,255,0.2); padding: 6px 16px; border-radius: 20px; color: white; font-weight: 600; font-size: 0.9rem;">
                ${employees.length} employee${employees.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; background: white;">
                <thead>
                  <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 14px; text-align: center; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">#</th>
                    <th style="padding: 14px; text-align: left; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">Employee ID</th>
                    <th style="padding: 14px; text-align: left; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">Name</th>
                    <th style="padding: 14px; text-align: left; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">Position</th>
                    <th style="padding: 14px; text-align: left; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">Email</th>
                    <th style="padding: 14px; text-align: left; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">Phone</th>
                    <th style="padding: 14px; text-align: center; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${employeeRows}
                </tbody>
              </table>
            </div>
          </div>
        `;
      });
      
      // Add unassigned section if exists
      if (unassigned.length > 0) {
        const unassignedRows = unassigned.map((emp, index) => `
          <tr style="border-bottom: 1px solid #e5e7eb; transition: background 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
            <td style="padding: 12px; text-align: center; color: #6b7280;">${index + 1}</td>
            <td style="padding: 12px; font-weight: 600; color: #111827;">${emp.employee_id}</td>
            <td style="padding: 12px; font-weight: 600; color: #111827;">${emp.first_name} ${emp.last_name}</td>
            <td style="padding: 12px; color: #374151;">N/A</td>
            <td style="padding: 12px; color: #374151;">${emp.email || 'N/A'}</td>
            <td style="padding: 12px; color: #374151;">${emp.phone || 'N/A'}</td>
            <td style="padding: 12px; text-align: center;">
              <span style="padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #fee2e2; color: #991b1b;">
                Unassigned
              </span>
            </td>
          </tr>
        `).join('');
        
        departmentSections += `
          <div style="margin-bottom: 32px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="background: #94a3b8; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center;">
              <h3 style="margin: 0; color: white; font-size: 1.2rem; font-weight: 700;">
                ⚠️ Unassigned Employees
              </h3>
              <span style="background: rgba(255,255,255,0.2); padding: 6px 16px; border-radius: 20px; color: white; font-weight: 600; font-size: 0.9rem;">
                ${unassigned.length} employee${unassigned.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; background: white;">
                <thead>
                  <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 14px; text-align: center; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">#</th>
                    <th style="padding: 14px; text-align: left; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">Employee ID</th>
                    <th style="padding: 14px; text-align: left; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">Name</th>
                    <th style="padding: 14px; text-align: left; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">Position</th>
                    <th style="padding: 14px; text-align: left; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">Email</th>
                    <th style="padding: 14px; text-align: left; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">Phone</th>
                    <th style="padding: 14px; text-align: center; font-weight: 700; color: #374151; font-size: 0.85rem; text-transform: uppercase;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${unassignedRows}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
      
      const modalHTML = `
        <div id="allDepartmentsModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;">
          <div style="background: white; border-radius: 16px; width: 98%; max-width: 1400px; max-height: 95vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); display: flex; flex-direction: column;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2d6e4e 0%, #16a34a 100%); padding: 24px; color: white;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h2 style="margin: 0; font-size: 1.8rem; font-weight: 700;">
                    🏢 All Departments Overview
                  </h2>
                  <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 1rem;">
                    Complete breakdown of employees by department
                  </p>
                </div>
                <button onclick="closeAllDepartmentsModal()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 24px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">✕</button>
              </div>
            </div>
            
            <!-- Content -->
            <div style="flex: 1; overflow-y: auto; padding: 32px;">
              ${departmentSections}
            </div>
            
            <!-- Footer -->
            <div style="padding: 20px 24px; border-top: 1px solid #e5e7eb; background: #f9fafb; text-align: center;">
              <button onclick="closeAllDepartmentsModal()" style="padding: 12px 40px; background: #2d6e4e; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s;" onmouseover="this.style.background='#16a34a'" onmouseout="this.style.background='#2d6e4e'">
                Close
              </button>
            </div>
            
          </div>
        </div>
      `;
      
      // Remove existing modal if any
      const existingModal = document.getElementById('allDepartmentsModal');
      if (existingModal) existingModal.remove();
      
      // Add new modal to body
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      
      console.log("✅ All departments modal displayed");
      
    } catch (error) {
      console.error("❌ Error fetching all departments:", error);
      alert("Error loading departments: " + error.message);
    }
  };
  
  window.closeAllDepartmentsModal = function() {
    const modal = document.getElementById('allDepartmentsModal');
    if (modal) {
      modal.remove();
      console.log("✅ All departments modal closed");
    }
  };
});