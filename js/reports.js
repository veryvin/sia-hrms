document.addEventListener("DOMContentLoaded", () => {
  // Tab switching
  const tabs = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
    });
  });

  // Sample Attendance Data
  const attendanceData = [
    { name: "Arjie Veloria", present: 5, late: 1, absent: 0, total: 45 },
    { name: "Leigh Moreno", present: 4, late: 2, absent: 1, total: 40 },
    { name: "Earvin Lopez", present: 6, late: 0, absent: 0, total: 48 },
  ];

  const leaveData = [
    { name: "Arjie Veloria", type: "Sick Leave", status: "Approved", duration: "2 Days" },
    { name: "Leigh Moreno", type: "Vacation Leave", status: "Pending", duration: "3 Days" },
  ];

  const payrollData = [
    { name: "Arjie Veloria", period: "Nov 1–15, 2025", net: 25000, status: "Processed" },
    { name: "Leigh Moreno", period: "Nov 1–15, 2025", net: 23000, status: "Processed" },
  ];

  // Populate Attendance
  const tbody = document.getElementById("attendanceTable");
  let totalPresent = 0, totalLate = 0, totalAbsent = 0;
  attendanceData.forEach(emp => {
    totalPresent += emp.present;
    totalLate += emp.late;
    totalAbsent += emp.absent;
    tbody.innerHTML += `
      <tr>
        <td>${emp.name}</td>
        <td>${emp.present}</td>
        <td>${emp.late}</td>
        <td>${emp.absent}</td>
        <td>${emp.total}</td>
      </tr>`;
  });
  document.getElementById("presentCount").textContent = totalPresent;
  document.getElementById("lateCount").textContent = totalLate;
  document.getElementById("absentCount").textContent = totalAbsent;
  document.getElementById("totalCount").textContent = attendanceData.length;

  // Populate Leave
  const leaveTable = document.getElementById("leaveTable");
  leaveData.forEach(l => {
    leaveTable.innerHTML += `
      <tr>
        <td>${l.name}</td>
        <td>${l.type}</td>
        <td>${l.status}</td>
        <td>${l.duration}</td>
      </tr>`;
  });

  // Populate Payroll
  const payrollTable = document.getElementById("payrollTable");
  payrollData.forEach(p => {
    payrollTable.innerHTML += `
      <tr>
        <td>${p.name}</td>
        <td>${p.period}</td>
        <td>₱${p.net.toLocaleString()}</td>
        <td>${p.status}</td>
      </tr>`;
  });
});
