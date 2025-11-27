// Example integration for your frontend pages
// Copy this pattern to your other JavaScript files (dashboard.js, employee.js, etc.)

import { supabase, supabaseHelper } from './supabaseClient.js';

// ====================================================================
// AUTHENTICATION EXAMPLE
// ====================================================================

async function handleLogin(email, password) {
  try {
    // First, authenticate via Supabase Auth (if using built-in auth)
    // const { data, error } = await supabaseHelper.login(email, password);
    
    // Or use custom authentication with employees table
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !employees) {
      console.error('Login failed:', error);
      alert('Invalid email or password');
      return;
    }

    // Store user session
    localStorage.setItem('loggedInUser', JSON.stringify(employees));
    localStorage.setItem('userEmail', email);

    // Redirect based on role
    if (employees.role === 'Admin' || employees.role === 'HR') {
      window.location.href = 'dashboard.html';
    } else {
      window.location.href = 'attendance.html';
    }
  } catch (err) {
    console.error('Authentication error:', err);
    alert('An error occurred during login');
  }
}

// ====================================================================
// EMPLOYEE MANAGEMENT EXAMPLE
// ====================================================================

async function loadEmployees() {
  try {
    const { data: employees, error } = await supabaseHelper.getEmployees();
    
    if (error) {
      console.error('Error fetching employees:', error);
      return;
    }

    // Display employees in table
    const tableBody = document.getElementById('employeeTable');
    tableBody.innerHTML = '';

    employees.forEach(emp => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${emp.employee_id}</td>
        <td>${emp.first_name} ${emp.last_name}</td>
        <td>${emp.email}</td>
        <td>${emp.department_id || 'N/A'}</td>
        <td>${emp.status}</td>
        <td>
          <button onclick="editEmployee('${emp.id}')">Edit</button>
          <button onclick="deleteEmployee('${emp.id}')">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading employees:', err);
  }
}

async function addEmployee(formData) {
  try {
    const { data, error } = await supabaseHelper.createEmployee({
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      employee_id: formData.employeeId,
      department_id: formData.departmentId,
      position_id: formData.positionId,
      hire_date: formData.hireDate,
      salary: parseFloat(formData.salary),
      role: formData.role || 'Employee',
      status: 'Active'
    });

    if (error) {
      console.error('Error creating employee:', error);
      alert('Failed to create employee: ' + error.message);
      return;
    }

    alert('Employee created successfully!');
    loadEmployees(); // Refresh the list
    closeModal(); // Close the form modal
  } catch (err) {
    console.error('Error adding employee:', err);
  }
}

async function deleteEmployee(employeeId) {
  if (!confirm('Are you sure you want to delete this employee?')) {
    return;
  }

  try {
    const { error } = await supabaseHelper.deleteEmployee(employeeId);

    if (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee');
      return;
    }

    alert('Employee deleted successfully');
    loadEmployees(); // Refresh the list
  } catch (err) {
    console.error('Error deleting employee:', err);
  }
}

// ====================================================================
// ATTENDANCE EXAMPLE
// ====================================================================

async function clockIn() {
  try {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!user) {
      alert('Please log in first');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if already clocked in today
    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', user.id)
      .eq('date', today)
      .single();

    if (existing) {
      alert('Already clocked in today');
      return;
    }

    const { data, error } = await supabaseHelper.createAttendance({
      employee_id: user.id,
      date: today,
      clock_in_time: new Date().toISOString(),
      status: 'Present'
    });

    if (error) {
      console.error('Error clocking in:', error);
      alert('Failed to clock in');
      return;
    }

    alert('Clocked in successfully at ' + new Date().toLocaleTimeString());
    loadAttendance();
  } catch (err) {
    console.error('Error in clock in:', err);
  }
}

async function clockOut() {
  try {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    const today = new Date().toISOString().split('T')[0];

    // Find today's attendance record
    const { data: attendance, error: fetchError } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', user.id)
      .eq('date', today)
      .single();

    if (fetchError || !attendance) {
      alert('No clock in record found for today');
      return;
    }

    // Calculate hours worked
    const clockInTime = new Date(attendance.clock_in_time);
    const clockOutTime = new Date();
    const hoursWorked = (clockOutTime - clockInTime) / (1000 * 60 * 60);

    const { data, error } = await supabaseHelper.updateAttendance(attendance.id, {
      clock_out_time: new Date().toISOString(),
      hours_worked: parseFloat(hoursWorked.toFixed(2))
    });

    if (error) {
      console.error('Error clocking out:', error);
      alert('Failed to clock out');
      return;
    }

    alert(`Clocked out successfully. Hours worked: ${hoursWorked.toFixed(2)}`);
    loadAttendance();
  } catch (err) {
    console.error('Error in clock out:', err);
  }
}

async function loadAttendance() {
  try {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!user) return;

    const { data: records, error } = await supabaseHelper.getAttendance({
      employee_id: user.id
    });

    if (error) {
      console.error('Error loading attendance:', error);
      return;
    }

    const tableBody = document.getElementById('attendanceTable');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    records.forEach(record => {
      const row = document.createElement('tr');
      const clockIn = new Date(record.clock_in_time).toLocaleTimeString();
      const clockOut = record.clock_out_time 
        ? new Date(record.clock_out_time).toLocaleTimeString() 
        : 'Not clocked out';
      
      row.innerHTML = `
        <td>${record.date}</td>
        <td>${clockIn}</td>
        <td>${clockOut}</td>
        <td>${record.hours_worked || 'N/A'}</td>
        <td>${record.status}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading attendance:', err);
  }
}

// ====================================================================
// LEAVE REQUEST EXAMPLE
// ====================================================================

async function submitLeaveRequest(leaveData) {
  try {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));

    const { data, error } = await supabaseHelper.createLeave({
      employee_id: user.id,
      leave_type: leaveData.leaveType,
      start_date: leaveData.startDate,
      end_date: leaveData.endDate,
      number_of_days: leaveData.numberOfDays,
      reason: leaveData.reason,
      status: 'Pending'
    });

    if (error) {
      console.error('Error submitting leave request:', error);
      alert('Failed to submit leave request');
      return;
    }

    alert('Leave request submitted successfully!');
    loadLeaveRequests();
  } catch (err) {
    console.error('Error in leave request:', err);
  }
}

async function loadLeaveRequests() {
  try {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));

    const { data: leaves, error } = await supabaseHelper.getLeaves({
      employee_id: user.id
    });

    if (error) {
      console.error('Error loading leaves:', error);
      return;
    }

    const tableBody = document.getElementById('leaveTable');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    leaves.forEach(leave => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${leave.leave_type}</td>
        <td>${leave.start_date}</td>
        <td>${leave.end_date}</td>
        <td>${leave.number_of_days}</td>
        <td><span class="status-${leave.status.toLowerCase()}">${leave.status}</span></td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading leave requests:', err);
  }
}

// ====================================================================
// INITIALIZATION
// ====================================================================

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  const user = localStorage.getItem('loggedInUser');
  if (!user && !window.location.href.includes('index.html')) {
    window.location.href = 'index.html';
  }

  // Load data based on current page
  const currentPage = window.location.pathname.split('/').pop();
  
  if (currentPage === 'dashboard.html') {
    loadEmployees();
  } else if (currentPage === 'attendance.html') {
    loadAttendance();
  } else if (currentPage === 'leave.html') {
    loadLeaveRequests();
  }
});

// Export functions for HTML onclick handlers
window.clockIn = clockIn;
window.clockOut = clockOut;
window.addEmployee = addEmployee;
window.deleteEmployee = deleteEmployee;
window.editEmployee = async (id) => {
  // Load employee data and populate form for editing
  const { data, error } = await supabaseHelper.getEmployee(id);
  if (error) {
    alert('Error loading employee');
    return;
  }
  // Populate form and open modal
  console.log('Edit employee:', data);
};
window.submitLeaveRequest = submitLeaveRequest;
window.handleLogin = handleLogin;
