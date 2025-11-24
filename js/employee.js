// ../js/employee.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = 'https://kfsjewtfpeohdbxyrlcz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmc2pld3RmcGVvaGRieHlybGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzU5NjQsImV4cCI6MjA3OTIxMTk2NH0.wrszJi_YC74iYE7oaHvbWBo5JmfY_Enc8VQg5wwggrw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Example uploaded file path (provided in convo history)
const SAMPLE_IMAGE_URL = '/mnt/data/7d3fff17-3d90-4669-a533-8e3c44c175a1.png';

// DOM
const tableBody = document.getElementById("employeeTable");
const form = document.getElementById("addEmployeeForm");
const modal = document.getElementById("addEmployeeModal");
const openBtn = document.querySelector(".add-btn");
const closeBtn = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const positionSelect = document.getElementById("position");

// helper: show modal (reuse for add & edit)
function openModal(editingId = null) {
  if (!modal) return;
  modal.style.display = "flex";
  if (editingId) modal.dataset.editing = editingId;
  else delete modal.dataset.editing;
}

function closeModal() {
  if (!modal) return;
  modal.style.display = "none";
  delete modal.dataset.editing;
  form.reset();
}

// open/close modal handlers
if (openBtn) openBtn.addEventListener("click", () => openModal());
if (closeBtn) closeBtn.addEventListener("click", closeModal);
if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

// Populate position dropdown from DB
async function populatePositions() {
  try {
    const { data, error } = await supabase
      .from("positions")
      .select("position_id, position_name")
      .order("position_name");

    if (error) throw error;

    // reset options but keep first placeholder
    positionSelect.innerHTML = `<option value="0">-Select Position-</option>`;
    data.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.position_id;
      opt.textContent = p.position_name;
      positionSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Error fetching positions:", err);
    alert("Failed to load positions.");
  }
}

// Fetch data and render table (joins done client-side for reliability)
async function fetchEmployees() {
  try {
    // 1) employees
    const { data: employees, error: empErr } = await supabase
      .from("employees")
      .select("employee_id, first_name, last_name, email, employment_status, position_id")
      .order("last_name");

    if (empErr) throw empErr;

    // 2) positions map
    const { data: positions } = await supabase
      .from("positions")
      .select("position_id, position_name");

    const posMap = {};
    (positions || []).forEach(p => posMap[p.position_id] = p.position_name);

    // 3) payroll rows for all employees
    const empIds = (employees || []).map(e => e.employee_id);
    let payrollRows = [];
    if (empIds.length) {
      const { data: pRows } = await supabase
        .from("payroll")
        .select("employee_id, basic_salary")
        .in("employee_id", empIds);
      payrollRows = pRows || [];
    }
    const payrollMap = {};
    payrollRows.forEach(r => {
      // if multiple payroll rows exist, pick the latest by created_at if needed.
      payrollMap[r.employee_id] = r.basic_salary;
    });

    // Render
    tableBody.innerHTML = "";
    (employees || []).forEach(emp => {
      const salary = payrollMap[emp.employee_id] ?? "—";
      const positionName = posMap[emp.position_id] ?? "";
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>
          <strong>${emp.last_name}, ${emp.first_name}</strong><br>
          <span>${emp.email ?? ''}</span>
        </td>
        <td>${positionName}</td>
        <td><span class="status ${String(emp.employment_status || '').toLowerCase()}">${emp.employment_status || '—'}</span></td>
        <td>₱${salary}</td>
        <td>
          <button class="edit" data-id="${emp.employee_id}">✏️</button>
          <button class="delete" data-id="${emp.employee_id}">🗑️</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error fetching employees:", err);
    alert("Failed to fetch employees. See console for details.");
  }
}

// initial population
populatePositions().then(fetchEmployees);

// Event delegation for Edit and Delete
tableBody.addEventListener("click", async (e) => {
  const editBtn = e.target.closest(".edit");
  const delBtn = e.target.closest(".delete");

  if (editBtn) {
    const id = editBtn.dataset.id;
    return openEditModal(id);
  }

  if (delBtn) {
    const id = delBtn.dataset.id;
    return handleDelete(id);
  }
});

// open edit modal and load employee + payroll data into form
async function openEditModal(employeeId) {
  try {
    // fetch employee
    const { data: empRows, error: empErr } = await supabase
      .from("employees")
      .select("employee_id, first_name, last_name, email, employment_status, position_id")
      .eq("employee_id", employeeId)
      .single();

    if (empErr) throw empErr;

    // fetch payroll row (if any)
    const { data: payrollRow, error: payErr } = await supabase
      .from("payroll")
      .select("payroll_id, employee_id, basic_salary")
      .eq("employee_id", employeeId)
      .maybeSingle();

    if (payErr) throw payErr;

    // populate fields
    document.getElementById("firstName").value = empRows.first_name || "";
    document.getElementById("lastName").value = empRows.last_name || "";
    document.getElementById("empEmail").value = empRows.email || "";
    document.getElementById("position").value = empRows.position_id || "0";
    document.getElementById("status").value = empRows.employment_status || "Active";
    document.getElementById("salary").value = payrollRow?.basic_salary ?? "";

    // set modal to editing mode
    openModal(employeeId);

  } catch (err) {
    console.error("Failed to open edit modal:", err);
    alert("Could not load employee for editing.");
  }
}

// handle delete
async function handleDelete(employeeId) {
  if (!confirm("Delete this employee and all related payroll & attendance? This cannot be undone.")) return;

  try {
    // delete payroll rows
    await supabase.from("payroll").delete().eq("employee_id", employeeId);

    // delete attendance rows
    await supabase.from("attendance").delete().eq("employee_id", employeeId);

    // delete leave_requests rows if exist
    await supabase.from("leave_requests").delete().eq("employee_id", employeeId);

    // finally delete employee
    const { error } = await supabase.from("employees").delete().eq("employee_id", employeeId);
    if (error) throw error;

    alert("Employee deleted.");
    fetchEmployees();
  } catch (err) {
    console.error("Delete failed:", err);
    alert("Failed to delete employee. Check console for details.");
  }
}

// Add or Update employee on form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("empEmail").value.trim();
  const positionId = Number(document.getElementById("position").value) || null;
  const status = document.getElementById("status").value;
  const basicSalary = document.getElementById("salary").value === "" ? null : Number(document.getElementById("salary").value);

  const editingId = modal?.dataset?.editing || null;

  try {
    // validate minimal
    if (!firstName || !lastName) {
      alert("Please provide first and last name.");
      return;
    }

    // If adding: ensure email unique
    if (!editingId) {
      const { data: existing } = await supabase
        .from("employees")
        .select("employee_id")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        alert("This email is already registered.");
        return;
      }

      // Insert employee
      const { data: inserted, error: insertErr } = await supabase
        .from("employees")
        .insert([{
          first_name: firstName,
          last_name: lastName,
          email,
          position_id: positionId,
          employment_status: status
        }])
        .select()
        .single();

      if (insertErr) throw insertErr;

      const newEmpId = inserted.employee_id;

      // create payroll row (because you said payroll row does not exist initially)
      if (basicSalary !== null) {
        await supabase.from("payroll").insert([{ employee_id: newEmpId, basic_salary: basicSalary }]);
      }

      // create attendance row (optional initial)
      await supabase.from("attendance").insert([{ employee_id: newEmpId, status: status }]);

      alert("Employee added.");
      closeModal();
      fetchEmployees();
      return;
    }

    // ---- Editing existing employee ----
    // Update employee row
    const { error: updateErr } = await supabase
      .from("employees")
      .update({
        first_name: firstName,
        last_name: lastName,
        email,
        position_id: positionId,
        employment_status: status
      })
      .eq("employee_id", editingId);

    if (updateErr) throw updateErr;

    // Upsert payroll: if row exists update; else insert
    const { data: existingPayroll } = await supabase
      .from("payroll")
      .select("payroll_id, basic_salary")
      .eq("employee_id", editingId)
      .maybeSingle();

    if (existingPayroll) {
      // update
      await supabase.from("payroll").update({ basic_salary: basicSalary }).eq("employee_id", editingId);
    } else {
      // insert
      if (basicSalary !== null) {
        await supabase.from("payroll").insert([{ employee_id: editingId, basic_salary: basicSalary }]);
      }
    }

    alert("Employee updated.");
    closeModal();
    fetchEmployees();

  } catch (err) {
    console.error("Save failed:", err);
    alert("Failed to save employee. See console.");
  }
});

// close modal when clicking outside content
window.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});
