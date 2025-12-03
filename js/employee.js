// ==================== EMPLOYEE.JS - SUPABASE READY (FIXED) ====================

(function(){
  // Check if Supabase client is available
  if (!window.supabaseClient) {
    console.error('CRITICAL: Supabase client not found! Make sure supabase-config.js is loaded before employee.js');
    alert('Database connection error. Please refresh the page.');
    return;
  }
  
  const supabase = window.supabaseClient;
  console.log('Employee.js loaded with Supabase client:', supabase);

  /* ---------- Utilities ---------- */
  function qs(id) { return document.getElementById(id); }
  function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }
  function toBase64(file) {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = err => rej(err);
      reader.readAsDataURL(file);
    });
  }

  /* ---------- Supabase Functions ---------- */
  async function fetchEmployees() {
    try {
      // ✅ FIXED: Specify the foreign key relationship explicitly
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          positions!employees_position_id_fkey(
            position_name,
            departments(department_name),
            roles(role_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Employees fetched successfully:', data);

      return (data || []).map(emp => ({
        id: emp.id,
        empId: emp.employee_id,
        firstName: emp.first_name,
        lastName: emp.last_name,
        middleName: emp.middle_name || '',
        email: emp.email,
        department: emp.positions?.departments?.department_name || '',
        position: emp.positions?.position_name || '',
        status: emp.employment_status || 'Regular',
        salary: emp.salary,
        dob: emp.date_of_birth,
        gender: emp.gender,
        phone: emp.phone,
        address: emp.address,
        dateHired: emp.date_hired || emp.hire_date,
        photo: emp.photo_url,
        files: emp.files || []
      }));
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  }

  // ... (rest of employee.js continues in next message)
  async function insertEmployee(empData) {
    try {
      console.log('Inserting employee with data:', empData);
      
      // Validate that empData and required fields exist
      if (!empData) {
        throw new Error('Employee data is undefined');
      }
      
      if (!empData.department) {
        throw new Error('Department is required');
      }

      // First, get or verify department exists
      const { data: dept, error: deptError } = await supabase
        .from('departments')
        .select('id')
        .eq('department_name', empData.department)
        .maybeSingle();

      if (deptError) {
        console.error('Department query error:', deptError);
        throw deptError;
      }

      if (!dept) {
        alert(`Department "${empData.department}" not found. Please create it first.`);
        return false;
      }

      // Find or create position
      let position;
      const { data: existingPos, error: posQueryError } = await supabase
        .from('positions')
        .select('id')
        .eq('position_name', empData.position)
        .eq('department_id', dept.id)
        .maybeSingle();

      if (posQueryError) {
        console.error('Position query error:', posQueryError);
        throw posQueryError;
      }

      if (existingPos) {
        position = existingPos;
      } else {
        // Get default role
        const { data: defaultRole, error: roleError } = await supabase
          .from('roles')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (roleError || !defaultRole) {
          alert('Please create at least one role in the roles table first.');
          return false;
        }

        const { data: newPos, error: posCreateError } = await supabase
          .from('positions')
          .insert({
            position_name: empData.position,
            department_id: dept.id,
            description: empData.position,
            role_id: defaultRole.id
          })
          .select()
          .single();

        if (posCreateError) {
          console.error('Position create error:', posCreateError);
          throw posCreateError;
        }
        position = newPos;
      }

      // Insert employee with position_id
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .insert({
          employee_id: empData.empId,
          first_name: empData.firstName,
          last_name: empData.lastName,
          middle_name: empData.middleName || '',
          email: empData.email,
          date_of_birth: empData.dob,
          gender: empData.gender,
          phone: empData.phone,
          contact_no: empData.phone,
          address: empData.address,
          date_hired: empData.dateHired,
          hire_date: empData.dateHired,
          employment_status: empData.status,
          salary: parseFloat(empData.salary),
          photo_url: empData.photo,
          files: empData.files || [],
          position_id: position.id
        })
        .select()
        .single();

      if (empError) {
        console.error('Employee insert error:', empError);
        throw empError;
      }

      alert('Employee added successfully!');
      return true;
    } catch (error) {
      console.error('Error inserting employee:', error);
      
      // Provide more specific error messages
      if (error.code === '23505') {
        alert('Error: Duplicate employee ID or email. Please use unique values.');
      } else if (error.code === '23503') {
        alert('Error: Invalid department or position reference.');
      } else {
        alert('Error adding employee: ' + (error.message || 'Unknown error'));
      }
      
      return false;
    }
  }

  async function deleteEmployee(empId) {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', empId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Error deleting employee: ' + error.message);
      return false;
    }
  }

  /* ---------- Determine Page ---------- */
  const isListPage = !!qs('employeeTable');
  const isAddPage = !!qs('employeeForm') && !qs('employeeForm').dataset.mode;

  /* ========================= LIST PAGE ========================= */
  if (isListPage) {
    const search = qs('search');
    const table = qs('employeeTable');
    const totalEmployees = qs('totalEmployees');
    const departmentFilter = qs('departmentFilter');
    const gotoAdd = qs('gotoAdd');
    const prevBtn = qs('prevPage');
    const nextBtn = qs('nextPage');
    const pageInfo = qs('pageInfo');

    let employees = [];
    let currentPage = 1;
    const rowsPerPage = 10;

    gotoAdd && gotoAdd.addEventListener('click', ()=> window.location.href = 'employee_add.html');

    async function loadEmployees() {
      employees = await fetchEmployees();
      renderPage();
    }

    function getUniqueDepartments() {
      const set = new Set();
      employees.forEach(e => { if (e.department) set.add(e.department); });
      return Array.from(set).sort();
    }

    function populateDeptOptions(preserveValue) {
      const depts = getUniqueDepartments();
      const selected = preserveValue !== undefined ? preserveValue : departmentFilter.value;
      departmentFilter.innerHTML = '';
      const allOpt = document.createElement('option');
      allOpt.value = '';
      allOpt.textContent = 'All Departments';
      departmentFilter.appendChild(allOpt);
      depts.forEach(d => {
        const o = document.createElement('option');
        o.value = d;
        o.textContent = d;
        departmentFilter.appendChild(o);
      });
      if (selected !== undefined) departmentFilter.value = selected;
    }

    function renderPage() {
      const searchTerm = (search && search.value || '').toLowerCase();
      const deptTerm = departmentFilter ? departmentFilter.value : '';

      const filtered = employees.filter(emp => {
        const fullname = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        const matchesName = fullname.includes(searchTerm) || (emp.email||'').toLowerCase().includes(searchTerm);
        const matchesDept = !deptTerm || emp.department === deptTerm;
        return matchesName && matchesDept;
      });

      const total = filtered.length;
      const maxPage = Math.max(1, Math.ceil(total / rowsPerPage));
      if (currentPage > maxPage) currentPage = maxPage;
      const start = (currentPage - 1) * rowsPerPage;
      const pageItems = filtered.slice(start, start + rowsPerPage);

      table.innerHTML = '';
      pageItems.forEach((emp) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${emp.lastName}, ${emp.firstName}</strong><br><span>${emp.email}</span></td>
          <td>${emp.position || ''}</td>
          <td>${emp.department || ''}</td>
          <td>${emp.status || ''}</td>
          <td>₱${emp.salary || ''}</td>
          <td>
            <button class="view" data-id="${emp.id}">View</button>
            <button class="edit" data-id="${emp.id}">Edit</button>
            <button class="delete" data-id="${emp.id}">Delete</button>
          </td>
        `;
        table.appendChild(tr);
      });

      pageInfo.textContent = `Page ${currentPage} of ${maxPage}`;
      prevBtn.disabled = currentPage <= 1;
      nextBtn.disabled = currentPage >= maxPage;
      totalEmployees.textContent = `${employees.length} total employees`;
      populateDeptOptions(deptTerm);
    }

    loadEmployees();

    search && search.addEventListener('input', ()=> { currentPage = 1; renderPage(); });
    departmentFilter && departmentFilter.addEventListener('change', ()=> { currentPage = 1; renderPage(); });
    prevBtn && prevBtn.addEventListener('click', ()=> { currentPage = Math.max(1, currentPage - 1); renderPage(); });
    nextBtn && nextBtn.addEventListener('click', ()=> { currentPage++; renderPage(); });

    table.addEventListener('click', async (e)=> {
      const id = e.target.dataset.id;
      if (id === undefined) return;

      const emp = employees.find(e => e.id === id);
      if (!emp) return;

      if (e.target.classList.contains('delete')) {
        if (!confirm('Delete this employee?')) return;
        
        const success = await deleteEmployee(id);
        if (success) {
          await loadEmployees();
        }
        return;
      }
      if (e.target.classList.contains('edit')) {
        window.location.href = `employee_edit.html?id=${id}`;
        return;
      }
      if (e.target.classList.contains('view')) {
        window.location.href = `employee_view.html?id=${id}`;
        return;
      }
    });

    // Realtime updates
    supabase
      .channel('employee-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, loadEmployees)
      .subscribe();
  }

  /* ========================= ADD PAGE ========================= */
if (isAddPage) {
  const form = qs('employeeForm');
  const cancelBtn = qs('cancelAdd');
  
  // Fix: Use correct ID "Position" (capital P) from your HTML
  const positionSelect = qs('Position');  // Changed from 'position' to 'Position'
  const salaryInput = qs('salary');
  
  if (!form) return;

  // Salary mapping based on position
  const positionSalaryMap = {
    'Employee': 15000.00,
    'Manager': 35000.00,
    'HR Manager': 35000.00,
    'Driver': 18000.00,
    'Dispatcher': 17000.00
  };

    if (positionSelect && salaryInput) {
    positionSelect.addEventListener('change', function() {
      const selectedPosition = this.value;
      
      console.log('Position selected:', selectedPosition); // Debug log
      
      // Check if position exists in our mapping
      if (positionSalaryMap.hasOwnProperty(selectedPosition)) {
        salaryInput.value = positionSalaryMap[selectedPosition].toFixed(2);
        
        // Visual feedback - brief green highlight
        salaryInput.style.backgroundColor = '#d4edda';
        salaryInput.style.transition = 'background-color 0.3s ease';
        
        setTimeout(() => {
          salaryInput.style.backgroundColor = '#f5f5f5';
        }, 500);
        
        console.log('Salary set to:', salaryInput.value); // Debug log
      } else {
        // Default salary for unlisted positions
        salaryInput.value = '15000.00';
        console.log('Using default salary'); // Debug log
      }
    });
  } else {
    console.error('Position select or salary input not found!');
    console.log('Position element:', positionSelect);
    console.log('Salary element:', salaryInput);
  }


  // Rest of your form submit handler...
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate required fields
    const requiredFields = ['empId', 'empEmail', 'firstName', 'lastName', 'dob', 'gender', 'phone', 'address', 'Position', 'department', 'dateHired', 'status', 'salary'];
    let isValid = true;
    
    for (const fieldId of requiredFields) {
      const field = qs(fieldId);
      if (!field || !field.value.trim()) {
        alert(`Please fill in the ${fieldId} field`);
        field && field.focus();
        isValid = false;
        break;
      }
    }

      if (!isValid) return;

      const photoInput = qs('empPhoto');
      const filesInput = qs('empFiles');

      let photoBase64 = null;
      if (photoInput && photoInput.files && photoInput.files.length) {
        photoBase64 = await toBase64(photoInput.files[0]);
      }

      const filesArr = [];
      if (filesInput && filesInput.files && filesInput.files.length) {
        for (let f of filesInput.files) {
          const base = await toBase64(f);
          filesArr.push({ name: f.name, data: base });
        }
      }

      // Build employee object
      const emp = {
        empId: qs('empId').value.trim(),
        email: qs('empEmail').value.trim(),
        firstName: qs('firstName').value.trim(),
        lastName: qs('lastName').value.trim(),
        middleName: qs('middleName') ? qs('middleName').value.trim() : '',
        dob: qs('dob').value,
        gender: qs('gender').value,
        phone: qs('phone').value.trim(),
        address: qs('address').value.trim(),
        position: qs('position').value.trim(),
        department: qs('department').value.trim(),
        dateHired: qs('dateHired').value,
        status: qs('status').value,
        salary: qs('salary').value,
        photo: photoBase64,
        files: filesArr
      };

      console.log('Submitting employee data:', emp);

      const success = await insertEmployee(emp);
      if (success) {
        window.location.href = 'employee.html';
      }
    });

    cancelBtn && cancelBtn.addEventListener('click', ()=> window.location.href = 'employee.html');
  }

})();

// ==================== EMPLOYEE.JS PART 2 - EDIT & VIEW ====================

(function(){
  // Check if Supabase client is available
  if (!window.supabaseClient) {
    console.error('CRITICAL: Supabase client not found in Part 2!');
    return;
  }
  
  const supabase = window.supabaseClient;

  function qs(id) { return document.getElementById(id); }
  function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }
  function toBase64(file) {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = err => rej(err);
      reader.readAsDataURL(file);
    });
  }
  function createDownloadLinkFromBase64(base64, filename) {
    const parts = base64.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8 = new Uint8Array(n);
    while (n--) u8[n] = bstr.charCodeAt(n);
    const blob = new Blob([u8], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.textContent = filename;
    return a;
  }

  async function fetchEmployeeById(id) {
    try {
      // ✅ FIXED: Specify the foreign key relationship explicitly
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          positions!employees_position_id_fkey(
            position_name,
            departments(department_name),
            roles(role_name)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        empId: data.employee_id,
        firstName: data.first_name,
        lastName: data.last_name,
        middleName: data.middle_name || '',
        email: data.email,
        department: data.positions?.departments?.department_name || '',
        position: data.positions?.position_name || '',
        status: data.employment_status || 'Regular',
        salary: data.salary,
        dob: data.date_of_birth,
        gender: data.gender,
        phone: data.phone,
        address: data.address,
        dateHired: data.date_hired || data.hire_date,
        photo: data.photo_url,
        files: data.files || []
      };
    } catch (error) {
      console.error('Error fetching employee:', error);
      return null;
    }
  }

  async function updateEmployee(id, empData) {
    try {
      // Get department
      const { data: dept, error: deptError } = await supabase
        .from('departments')
        .select('id')
        .eq('department_name', empData.department)
        .maybeSingle();

      if (deptError) throw deptError;

      if (!dept) {
        alert(`Department "${empData.department}" not found.`);
        return false;
      }

      // Find or create position
      let position;
      const { data: existingPos, error: posQueryError } = await supabase
        .from('positions')
        .select('id')
        .eq('position_name', empData.position)
        .eq('department_id', dept.id)
        .maybeSingle();

      if (posQueryError) throw posQueryError;

      if (existingPos) {
        position = existingPos;
      } else {
        const { data: newPos, error: posCreateError } = await supabase
          .from('positions')
          .insert({
            position_name: empData.position,
            department_id: dept.id,
            description: empData.position
          })
          .select()
          .single();

        if (posCreateError) throw posCreateError;
        position = newPos;
      }

      // Update employee
      const { error: empError } = await supabase
        .from('employees')
        .update({
          employee_id: empData.empId,
          first_name: empData.firstName,
          last_name: empData.lastName,
          middle_name: empData.middleName,
          email: empData.email,
          date_of_birth: empData.dob,
          gender: empData.gender,
          phone: empData.phone,
          contact_no: empData.phone,
          address: empData.address,
          date_hired: empData.dateHired,
          hire_date: empData.dateHired,
          employment_status: empData.status,
          salary: empData.salary,
          photo_url: empData.photo,
          files: empData.files,
          position_id: position.id
        })
        .eq('id', id);

      if (empError) throw empError;

      alert('Employee updated successfully!');
      return true;
    } catch (error) {
      console.error('Error updating employee:', error);
      
      if (error.code === '23505') {
        alert('Error: Duplicate employee ID or email.');
      } else {
        alert('Error updating employee: ' + error.message);
      }
      
      return false;
    }
  }

  const isEditPage = !!qs('employeeForm') && qs('employeeForm').dataset.mode === 'edit';
  const isViewPage = !!qs('viewContent');

  /* ========================= EDIT PAGE ========================= */
  if (isEditPage) {
    const id = getQueryParam('id');
    if (!id) {
      alert('Invalid employee ID');
      window.location.href = 'employee.html';
      return;
    }

    (async function loadEditPage() {
      const emp = await fetchEmployeeById(id);
      if (!emp) {
        alert('Employee not found');
        window.location.href = 'employee.html';
        return;
      }

      ['empId','empEmail','firstName','lastName','middleName','dob','gender','phone','address','position','department','dateHired','status','salary'].forEach(fid => {
        const el = qs(fid);
        if (el) el.value = emp[fid === 'empEmail' ? 'email' : fid] || '';
      });

      const photoPreview = qs('photoPreview');
      if (emp.photo && photoPreview) {
        photoPreview.innerHTML = `<img class="photo-2x2" src="${emp.photo}">`;
      }

      const filesList = qs('filesList');
      if (filesList) {
        filesList.innerHTML = '';
        (emp.files || []).forEach((f, i) => {
          const div = document.createElement('div');
          const a = createDownloadLinkFromBase64(f.data, f.name);
          div.appendChild(a);
          const removeBtn = document.createElement('button');
          removeBtn.textContent = ' Remove';
          removeBtn.style.marginLeft = '8px';
          removeBtn.addEventListener('click', async ()=> {
            if (!confirm('Remove this uploaded file?')) return;
            emp.files.splice(i,1);
            const success = await updateEmployee(id, emp);
            if (success) window.location.reload();
          });
          div.appendChild(removeBtn);
          filesList.appendChild(div);
        });
      }

      const form = qs('employeeForm');
      form && form.addEventListener('submit', async (e)=> {
        e.preventDefault();
        const photoInput = qs('empPhoto');
        const filesInput = qs('empFiles');

        let photoBase64 = emp.photo;
        if (photoInput && photoInput.files && photoInput.files.length) {
          photoBase64 = await toBase64(photoInput.files[0]);
        }

        const filesArr = Array.isArray(emp.files) ? emp.files.slice() : [];
        if (filesInput && filesInput.files && filesInput.files.length) {
          for (let f of filesInput.files) {
            const base = await toBase64(f);
            filesArr.push({ name: f.name, data: base });
          }
        }

        const updated = {
          empId: qs('empId').value.trim(),
          email: qs('empEmail').value.trim(),
          firstName: qs('firstName').value.trim(),
          lastName: qs('lastName').value.trim(),
          middleName: qs('middleName').value.trim() || '',
          dob: qs('dob').value,
          gender: qs('gender').value,
          phone: qs('phone').value.trim(),
          address: qs('address').value.trim(),
          position: qs('position').value.trim(),
          department: qs('department').value.trim(),
          dateHired: qs('dateHired').value,
          status: qs('status').value,
          salary: qs('salary').value,
          photo: photoBase64,
          files: filesArr
        };

        const success = await updateEmployee(id, updated);
        if (success) {
          window.location.href = 'employee.html';
        }
      });

      qs('cancelEdit') && qs('cancelEdit').addEventListener('click', ()=> window.location.href = 'employee.html');
    })();
  }

  /* ========================= VIEW PAGE ========================= */
  if (isViewPage) {
    const id = getQueryParam('id');
    if (!id) {
      alert('Invalid employee ID');
      window.location.href = 'employee.html';
      return;
    }

    (async function loadViewPage() {
      const emp = await fetchEmployeeById(id);
      if (!emp) {
        alert('Employee not found');
        window.location.href = 'employee.html';
        return;
      }

      const content = qs('viewContent');
      const initials = (emp.firstName.charAt(0) + emp.lastName.charAt(0)).toUpperCase();
      const photoHTML = emp.photo 
        ? `<img class="profile-photo" src="${emp.photo}" alt="${emp.firstName} ${emp.lastName}">` 
        : `<div class="profile-photo-placeholder">${initials}</div>`;

      const statusClass = `status-${emp.status.toLowerCase()}`;

      content.innerHTML = `
        <div class="profile-container">
          <div class="profile-header">
            <div class="profile-photo-container">
              ${photoHTML}
            </div>
            <div class="profile-basic-info">
              <h1 class="employee-name">${emp.lastName}, ${emp.firstName} ${emp.middleName}</h1>
              <p class="employee-id">Employee ID: ${emp.empId}</p>
              <div>
                <span class="employee-position">💼 ${emp.position}</span>
                <span class="employee-department">🏢 ${emp.department}</span>
              </div>
              <div>
                <span class="status-badge ${statusClass}">${emp.status}</span>
              </div>
            </div>
          </div>

          <div class="profile-section">
            <div class="section-title">📞 Contact Information</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Email Address</span>
                <span class="info-value">${emp.email}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Phone Number</span>
                <span class="info-value">${emp.phone}</span>
              </div>
              <div class="info-item" style="grid-column: 1 / -1;">
                <span class="info-label">Address</span>
                <span class="info-value">${emp.address}</span>
              </div>
            </div>
          </div>

          <div class="profile-section">
            <div class="section-title">👤 Personal Information</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Date of Birth</span>
                <span class="info-value">${emp.dob}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Gender</span>
                <span class="info-value">${emp.gender}</span>
              </div>
            </div>
          </div>

          <div class="profile-section">
            <div class="section-title">💼 Employment Details</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Date Hired</span>
                <span class="info-value">${emp.dateHired}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Employment Status</span>
                <span class="info-value">${emp.status}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Position</span>
                <span class="info-value">${emp.position}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Department</span>
                <span class="info-value">${emp.department}</span>
              </div>
              <div class="info-item" style="grid-column: 1 / -1;">
                <span class="info-label">Monthly Salary</span>
                <span class="info-value salary-highlight">₱${Number(emp.salary).toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>

          <div class="profile-section">
            <div class="section-title">📎 Uploaded Documents</div>
            <div class="files-list" id="filesList"></div>
          </div>
        </div>
      `;

      const filesContainer = content.querySelector('#filesList');
      if (emp.files && emp.files.length > 0) {
        emp.files.forEach(f => {
          const fileItem = document.createElement('a');
          fileItem.className = 'file-item';
          fileItem.href = f.data;
          fileItem.download = f.name;
          
          const ext = f.name.split('.').pop().toLowerCase();
          let icon = '📄';
          if (['pdf'].includes(ext)) icon = '📕';
          if (['doc', 'docx'].includes(ext)) icon = '📘';
          if (['jpg', 'jpeg', 'png'].includes(ext)) icon = '🖼️';
          
          fileItem.innerHTML = `
            <span class="file-icon">${icon}</span>
            <span class="file-name">${f.name}</span>
            <span class="download-icon">⬇️</span>
          `;
          filesContainer.appendChild(fileItem);
        });
      } else {
        filesContainer.innerHTML = '<div class="no-files">No documents uploaded</div>';
      }
    })();
  }

})();