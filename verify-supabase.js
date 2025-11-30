#!/usr/bin/env node

/**
 * Supabase Connection Verification Script
 * Run this to verify your Supabase connection is working
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('\n═══════════════════════════════════════════════');
console.log('   SUPABASE CONNECTION VERIFICATION');
console.log('═══════════════════════════════════════════════\n');

async function verifyConnection() {
  try {
    // Check environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    console.log('✓ Checking environment variables...');
    if (!supabaseUrl) {
      console.error('✗ SUPABASE_URL not found in .env');
      process.exit(1);
    }
    if (!supabaseKey) {
      console.error('✗ SUPABASE_ANON_KEY not found in .env');
      process.exit(1);
    }
    console.log('✓ Environment variables found\n');

    // Create Supabase client
    console.log('✓ Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✓ Client created successfully\n');

    // Test connection by querying a table
    console.log('✓ Testing database connection...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name');

    if (tablesError) {
      console.log('✓ Connection test (trying alternate method)...');
      // Try fetching from employees table
      const { data, error } = await supabase
        .from('employees')
        .select('count');
      
      if (error && error.code === 'PGRST116') {
        console.warn('⚠ Tables not yet created. Run DATABASE_SCHEMA.sql in Supabase SQL Editor');
      } else if (error) {
        throw error;
      }
    }

    console.log('✓ Database connection successful\n');

    // Display connection info
    console.log('═══════════════════════════════════════════════');
    console.log('   CONNECTION DETAILS');
    console.log('═══════════════════════════════════════════════');
    console.log(`URL: ${supabaseUrl}`);
    console.log(`API Key: ${supabaseKey.substring(0, 20)}...`);
    console.log('\n✓ All checks passed! Your Supabase is ready.\n');

    console.log('═══════════════════════════════════════════════');
    console.log('   NEXT STEPS');
    console.log('═══════════════════════════════════════════════');
    console.log('1. Run DATABASE_SCHEMA.sql in Supabase SQL Editor');
    console.log('2. Start the server: npm start');
    console.log('3. Visit http://localhost:3000\n');

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Connection verification failed:');
    console.error(error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify .env file has SUPABASE_URL and SUPABASE_ANON_KEY');
    console.error('2. Check your Supabase project is active');
    console.error('3. Verify your internet connection');
    process.exit(1);
  }
}

verifyConnection();
