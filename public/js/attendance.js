/* ===============================
   ATTENDANCE PAGE - SUPABASE READY (FIXED)
================================ */

if (window.location.pathname.includes("attendance.html")) {
    const supabase = window.supabaseClient;
    
    // Check if Supabase is loaded
    if (!supabase) {
        console.error('Supabase client not initialized!');
        alert('Database connection error. Please refresh the page.');
        throw new Error('Supabase not initialized');
    }

    const dateInput = document.getElementById("attendanceDate");
    const searchInput = document.getElementById("search");
    const tableElement = document.getElementById("attendanceTable");
    const totalAttendance = document.getElementById("totalAttendance");
    const logAttendanceBtn = document.getElementById("logAttendanceBtn");

    let currentPage = 1;
    const rowsPerPage = 10;
    let filteredData = [];

    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;

    // Get logged in user info
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const userRole = loggedInUser.role || 'Employee';
    const userId = loggedInUser.employee_id || '';

    /* ---------------------------
       FETCH FROM SUPABASE - FIXED VERSION
    --------------------------- */
    async function fetchAttendanceRecords() {
        try {
            console.log('🔍 Fetching attendance - NO JOINS');
            
            // Step 1: Get attendance records only
            const { data: attendanceData, error: attError } = await supabase
                .from('attendance')
                .select('id, employee_id, employee_uuid, date, time_in, time_out')
                .order('date', { ascending: false })
                .order('time_in', { ascending: false });

            if (attError) {
                console.error('Attendance query error:', attError);
                throw attError;
            }

            console.log('Attendance records fetched:', attendanceData?.length || 0);

            if (!attendanceData || attendanceData.length === 0) {
                return [];
            }

            // Step 2: Get unique employee IDs (using employee_id string, not UUID)
            const empIds = [...new Set(attendanceData.map(a => a.employee_id).filter(Boolean))];
            
            if (empIds.length === 0) {
                console.warn('No valid employee IDs found in attendance');
                return [];
            }

            // Step 3: Fetch employees by employee_id (not by UUID)
            const { data: employees, error: empError } = await supabase
                .from('employees')
                .select('id, employee_id, first_name, last_name, position_id')
                .in('employee_id', empIds);

            if (empError) {
                console.error('Employees query error:', empError);
                throw empError;
            }

            // Step 4: Fetch positions
            const posIds = [...new Set(employees.map(e => e.position_id).filter(Boolean))];
            const { data: positions } = await supabase
                .from('positions')
                .select('id, position_name, department_id')
                .in('id', posIds);

            // Step 5: Fetch departments
            const deptIds = [...new Set((positions || []).map(p => p.department_id).filter(Boolean))];
            const { data: departments } = await supabase
                .from('departments')
                .select('id, department_name')
                .in('id', deptIds);

            // Build lookup maps
            const deptMap = {};
            (departments || []).forEach(d => {
                deptMap[d.id] = d.department_name;
            });

            const posMap = {};
            (positions || []).forEach(p => {
                posMap[p.id] = {
                    name: p.position_name,
                    dept: deptMap[p.department_id] || '-'
                };
            });

            const empMap = {};
            employees.forEach(e => {
                const pos = posMap[e.position_id] || { name: '-', dept: '-' };
                empMap[e.employee_id] = {
                    name: `${e.first_name} ${e.last_name}`,
                    position: pos.name,
                    department: pos.dept
                };
            });

            // Transform to final format
            return attendanceData.map(record => {
                const emp = empMap[record.employee_id] || {
                    name: 'Unknown',
                    position: '-',
                    department: '-'
                };

                return {
                    recordId: record.id,
                    id: record.employee_id,
                    name: emp.name,
                    department: emp.department,
                    position: emp.position,
                    date: record.date,
                    timeIn: formatTime(record.time_in),
                    timeOut: record.time_out ? formatTime(record.time_out) : '--',
                    timeInRaw: record.time_in,
                    timeOutRaw: record.time_out
                };
            });

        } catch (error) {
            console.error('Error in fetchAttendanceRecords:', error);
            showAlert('Error loading attendance: ' + error.message, 'error');
            return [];
        }
    }

    function formatTime(isoString) {
        if (!isoString) return '--';
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }

    function showAlert(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${type}`;
        alertDiv.textContent = message;
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'error' ? '#e74c3c' : '#27ae60'};
            color: white;
            border-radius: 5px;
            z-index: 9999;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            font-weight: bold;
        `;
        document.body.appendChild(alertDiv);
        setTimeout(() => {
            alertDiv.style.opacity = '0';
            alertDiv.style.transition = 'opacity 0.3s';
            setTimeout(() => alertDiv.remove(), 300);
        }, 3000);
    }

    /* ---------------------------
       HELPERS
    --------------------------- */
    function parseTimeToSeconds(t) {
        if (!t || t === "--") return null;
        const m = t.match(/(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i);
        if (!m) return null;

        let hh = parseInt(m[1], 10);
        const mm = parseInt(m[2], 10);
        const ss = parseInt(m[3], 10);
        const ampm = m[4].toUpperCase();

        if (ampm === "AM") {
            if (hh === 12) hh = 0;
        } else {
            if (hh !== 12) hh += 12;
        }

        return hh * 3600 + mm * 60 + ss;
    }

    function computeHours(timeIn, timeOut) {
        if (!timeIn || !timeOut || timeOut === "--") return "--";
        const s1 = parseTimeToSeconds(timeIn);
        const s2 = parseTimeToSeconds(timeOut);
        if (s1 === null || s2 === null) return "--";

        let diffSec = s2 - s1;
        if (diffSec < 0) diffSec += 24 * 3600;

        return (diffSec / 3600).toFixed(2);
    }

    /* ---------------------------
       ROLE-BASED UI ADJUSTMENTS
    --------------------------- */
    function adjustUIForRole() {
        if (userRole === "Employee") {
            if (searchInput && searchInput.parentElement) {
                searchInput.parentElement.style.display = "none";
            }
            
            const header = document.querySelector("header h1");
            if (header) {
                header.textContent = "My Attendance";
            }
            
            const headerDesc = document.querySelector("header p");
            if (headerDesc) {
                headerDesc.textContent = "View your time and attendance records";
            }
        }
    }

    /* ---------------------------
       MAIN TABLE LOADING
    --------------------------- */
    async function loadTable() {
        const selectedDate = dateInput.value;
        const searchValue = searchInput ? searchInput.value.toLowerCase() : '';

        console.log('Loading table for date:', selectedDate);

        let all = await fetchAttendanceRecords();
        
        console.log('All records:', all);
        console.log('User role:', userRole, 'User ID:', userId);

        // Filter by role: Employees only see their own records
        if (userRole === "Employee" && userId) {
            all = all.filter(r => r.id === userId);
            console.log('Filtered for employee:', all);
        }

        // Apply date and search filters
        filteredData = all.filter(r => {
            const matchesDate = r.date === selectedDate;
            const matchesSearch = searchValue === '' || 
                (r.name || "").toLowerCase().includes(searchValue) ||
                (r.id || "").toLowerCase().includes(searchValue);
            return matchesDate && matchesSearch;
        });

        console.log('Filtered data:', filteredData);

        updateTotalAttendance(filteredData.length);
        renderPaginatedTable();
    }

    function updateTotalAttendance(count) {
        if (!totalAttendance) return;
        
        if (userRole === "Employee") {
            totalAttendance.textContent = `My Records: ${count}`;
        } else {
            totalAttendance.textContent = `Total Attendance: ${count}`;
        }
    }

    /* ---------------------------
       PAGINATION
    --------------------------- */
    function renderPaginatedTable() {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        renderTable(filteredData.slice(start, end));
        renderPaginationControls();
    }

    /* ---------------------------
       RENDER TABLE ROWS
    --------------------------- */
    function renderTable(list) {
        if (!tableElement) return;
        
        let html = "";

        if (list.length === 0) {
            html = `<tr><td colspan="9" style="text-align:center; padding: 20px; color: #999;">No records found for this date</td></tr>`;
        } else {
            list.forEach(r => {
                const totalHours = computeHours(r.timeIn, r.timeOut);

                html += `
                    <tr>
                        <td>${r.id}</td>
                        <td>${r.name}</td>
                        <td>${r.department}</td>
                        <td>${r.position}</td>
                        <td>${r.date}</td>
                        <td>${r.timeIn}</td>
                        <td>${r.timeOut}</td>
                        <td>
                            ${totalHours === "--" 
                                ? '<span style="color:#999;">--</span>' 
                                : `<span style="color:#27ae60;font-weight:bold;">${totalHours} hrs</span>`
                            }
                        </td>
                        <td>
                            ${
                                r.timeOut === "--" ?
                                `<button 
                                    onclick="goLogout('${r.id}')"
                                    style="
                                        background:#e74c3c;
                                        color:white;
                                        padding:6px 12px;
                                        border:none;
                                        border-radius:4px;
                                        cursor:pointer;
                                        font-weight:bold;
                                        font-size: 12px;
                                    "
                                >Clock Out</button>` :
                                `<span style="color:#27ae60;font-size:12px;">✓ Completed</span>`
                            }
                        </td>
                    </tr>
                `;
            });
        }

        tableElement.innerHTML = html;
    }

    /* ---------------------------
       PAGINATION BUTTONS
    --------------------------- */
    function renderPaginationControls() {
        let paginationDiv = document.getElementById("paginationControls");

        if (!paginationDiv) {
            paginationDiv = document.createElement("div");
            paginationDiv.id = "paginationControls";
            paginationDiv.style.cssText = `
                margin-top: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 15px;
            `;
            const mainSection = document.querySelector(".main");
            if (mainSection) {
                mainSection.appendChild(paginationDiv);
            }
        }

        const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;

        paginationDiv.innerHTML = `
            <button 
                style="
                    background: #8e44ad;
                    color: white;
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                    ${currentPage === 1 ? 'opacity: 0.5; cursor: not-allowed;' : ''}
                "
                ${currentPage === 1 ? "disabled" : ""}
                onclick="prevPage()"
            >← Previous</button>

            <span style="font-weight: bold; color: #333;">Page ${currentPage} of ${totalPages}</span>

            <button 
                style="
                    background: #8e44ad;
                    color: white;
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                    ${currentPage === totalPages ? 'opacity: 0.5; cursor: not-allowed;' : ''}
                "
                ${currentPage === totalPages ? "disabled" : ""}
                onclick="nextPage()"
            >Next →</button>
        `;
    }

    window.prevPage = function() {
        if (currentPage > 1) {
            currentPage--;
            renderPaginatedTable();
        }
    };

    window.nextPage = function() {
        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderPaginatedTable();
        }
    };

    /* ---------------------------
       LOGOUT BUTTON (CLOCK OUT)
    --------------------------- */
    window.goLogout = async function(empId) {
        if (!confirm(`Clock out employee ${empId}?`)) {
            return;
        }

        try {
            const today = new Date().toISOString().split("T")[0];
            
            const { error } = await supabase
                .from('attendance')
                .update({ time_out: new Date().toISOString() })
                .eq('employee_id', empId)
                .eq('date', today)
                .is('time_out', null);

            if (error) throw error;

            showAlert('Successfully clocked out!', 'success');
            await loadTable();
        } catch (error) {
            console.error('Error clocking out:', error);
            showAlert('Error clocking out: ' + error.message, 'error');
        }
    };

    /* ---------------------------
       LOG ATTENDANCE BUTTON
    --------------------------- */
    if (logAttendanceBtn) {
        logAttendanceBtn.addEventListener("click", () => {
            window.location.href = "in&out.html";
        });
    }

    /* ---------------------------
       EVENT LISTENERS
    --------------------------- */
    if (dateInput) {
        dateInput.addEventListener("change", () => { 
            currentPage = 1; 
            loadTable(); 
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener("input", () => { 
            currentPage = 1; 
            loadTable(); 
        });
    }

    /* ---------------------------
       REALTIME SUBSCRIPTION
    --------------------------- */
    if (supabase && supabase.channel) {
        const channel = supabase
            .channel('attendance-changes')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'attendance' 
            }, (payload) => {
                console.log('Realtime update:', payload);
                loadTable();
            })
            .subscribe();

        console.log('Realtime subscription active:', channel);
    } else {
        console.warn('Supabase realtime not available - updates will not be automatic');
    }

    /* ---------------------------
       INITIALIZATION
    --------------------------- */
    // Apply role-based UI changes
    adjustUIForRole();
    
    // Initial load
    console.log('Initializing attendance page...');
    loadTable();
}