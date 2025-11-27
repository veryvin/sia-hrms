// Supabase Client for Frontend
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = 'https://pheupnmnisguenfqaphs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmc2pld3RmcGVvaGRieHlybGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzU5NjQsImV4cCI6MjA3OTIxMTk2NH0.wrszJi_YC74iYE7oaHvbWBo5JmfY_Enc8VQg5wwggrw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper functions for common operations
export const supabaseHelper = {
  // Authentication
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async signup(email, password) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async logout() {
    return await supabase.auth.signOut();
  },

  async getCurrentUser() {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },

  // Employees
  async getEmployees() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async getEmployee(id) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async createEmployee(employee) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([employee])
        .select();
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async updateEmployee(id, updates) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select();
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async deleteEmployee(id) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  // Attendance
  async getAttendance(filter = {}) {
    try {
      let query = supabase.from('attendance').select('*');
      
      if (filter.employee_id) {
        query = query.eq('employee_id', filter.employee_id);
      }
      if (filter.date) {
        query = query.eq('date', filter.date);
      }
      
      const { data, error } = await query.order('date', { ascending: false });
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async createAttendance(attendance) {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .insert([attendance])
        .select();
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async updateAttendance(id, updates) {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .update(updates)
        .eq('id', id)
        .select();
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  // Leaves
  async getLeaves(filter = {}) {
    try {
      let query = supabase.from('leaves').select('*');
      
      if (filter.employee_id) {
        query = query.eq('employee_id', filter.employee_id);
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async createLeave(leave) {
    try {
      const { data, error } = await supabase
        .from('leaves')
        .insert([leave])
        .select();
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async updateLeave(id, updates) {
    try {
      const { data, error } = await supabase
        .from('leaves')
        .update(updates)
        .eq('id', id)
        .select();
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  // Payroll
  async getPayroll(filter = {}) {
    try {
      let query = supabase.from('payroll').select('*');
      
      if (filter.employee_id) {
        query = query.eq('employee_id', filter.employee_id);
      }
      
      const { data, error } = await query.order('pay_period_end', { ascending: false });
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async createPayroll(payroll) {
    try {
      const { data, error } = await supabase
        .from('payroll')
        .insert([payroll])
        .select();
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  // Positions
  async getPositions() {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .order('position_name');
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  // Departments
  async getDepartments() {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('department_name');
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  },
};

export default supabase;
