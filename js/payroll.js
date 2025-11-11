document.addEventListener("DOMContentLoaded", () => {
  const processBtn = document.getElementById("processBtn");
  const payrollModal = document.getElementById("payrollModal");
  const closeModal = document.getElementById("closeModal");
  const cancelBtn = document.getElementById("cancelBtn");
  const payrollForm = document.getElementById("payrollForm");
  const tableBody = document.querySelector(".payroll-table tbody");

  let payrollRecords = JSON.parse(localStorage.getItem("payrollRecords")) || [];

  // Open modal
  processBtn.addEventListener("click", () => {
    payrollModal.style.display = "flex";
  });

  // Close modal
  closeModal.addEventListener("click", () => payrollModal.style.display = "none");
  cancelBtn.addEventListener("click", () => payrollModal.style.display = "none");
  window.addEventListener("click", e => {
    if (e.target === payrollModal) payrollModal.style.display = "none";
  });

  // Submit form
  payrollForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const employee = document.getElementById("employee").value;
    const periodStart = document.getElementById("periodStart").value;
    const periodEnd = document.getElementById("periodEnd").value;
    const overtime = parseFloat(document.getElementById("overtime").value) || 0;
    const deductions = parseFloat(document.getElementById("deductions").value) || 0;

    const basicSalary = 20000;
    const otPay = overtime * 150;
    const netSalary = basicSalary + otPay - deductions;

    const newPayroll = {
      id: Date.now(),
      employee,
      period: `${periodStart} → ${periodEnd}`,
      basicSalary,
      otPay,
      deductions,
      netSalary,
      status: "Processed"
    };

    payrollRecords.push(newPayroll);
    localStorage.setItem("payrollRecords", JSON.stringify(payrollRecords));

    payrollForm.reset();
    payrollModal.style.display = "none";
    renderPayroll();
  });

  function renderPayroll() {
    if (!tableBody) return;
    if (payrollRecords.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8">No payroll records found</td></tr>`;
      return;
    }

    tableBody.innerHTML = payrollRecords.map(p => `
      <tr>
        <td>${p.employee}</td>
        <td>${p.period}</td>
        <td>₱${p.basicSalary.toLocaleString()}</td>
        <td>₱${p.otPay.toLocaleString()}</td>
        <td>₱${p.deductions.toLocaleString()}</td>
        <td>₱${p.netSalary.toLocaleString()}</td>
        <td>${p.status}</td>
        <td><button data-id="${p.id}" class="delete-btn">🗑 Delete</button></td>
      </tr>
    `).join("");
  }

  tableBody?.addEventListener("click", e => {
    if (e.target.classList.contains("delete-btn")) {
      const id = parseInt(e.target.dataset.id);
      payrollRecords = payrollRecords.filter(p => p.id !== id);
      localStorage.setItem("payrollRecords", JSON.stringify(payrollRecords));
      renderPayroll();
    }
  });

  renderPayroll();
});
