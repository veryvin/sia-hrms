// /js/supabaseClient.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://pheupnmnisguenfqaphs.supabase.co";
const SUPABASE_ANON_KEY= 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZXVwbm1uaXNndWVuZnFhcGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMzY2ODcsImV4cCI6MjA3OTgxMjY4N30.CYN8o3ilyeRY1aYLy7Vut47pLskF6gIcBv4zE3kOUqM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabaseHelper = {
    login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        return { data, error };
    },
    logout: async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    },
    getEmployees: async () => {
const { data, error } = await supabase
  .from('employees')
  .select(`
    *,
    positions (
      position_name,
      departments (
        department_name
      ),
      roles (
        role_name
      )
    )
  `)
  .order('last_name', { ascending: true });
        return { data, error };
    },
    getDepartments: async () => {
        const { data, error } = await supabase.from("departments").select("*");
        return { data, error };
    },
    createEmployee: async (employeeData) => {
        const { data, error } = await supabase.from('employees').insert([employeeData]);
        return { data, error };
    }
};
export default supabase;
