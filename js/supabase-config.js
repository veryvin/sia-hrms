// ===================================================
// SUPABASE CONFIGURATION
// ===================================================

const SUPABASE_URL = 'https://iwaibzskwxkonojilfhg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YWlienNrd3hrb25vamlsZmhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjkyMDY1MCwiZXhwIjoyMDc4NDk2NjUwfQ.9pTCt8OxOlTv4wUUY2Fg8T8zRCmL4bf4Jkh43yEOm8E';

// Initialize Supabase client
// The Supabase CDN exposes the global 'supabase' object with createClient method
if (typeof supabase !== 'undefined') {
  const { createClient } = supabase;
  window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  console.log('✅ Supabase client initialized successfully');
} else {
  console.error('❌ Supabase library not loaded. Make sure to include the Supabase CDN script before this file.');
}

// ===================================================
// HELPER FUNCTIONS
// ===================================================

// Handle Supabase errors
function handleSupabaseError(error, context) {
  console.error(`Supabase Error (${context}):`, error);
  return null;
}

// Show loading state
function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = '<tr><td colspan="10" class="empty">Loading...</td></tr>';
  }
}

// Export helper functions for use in other files
window.handleSupabaseError = handleSupabaseError;
window.showLoading = showLoading;