# Supabase Integration Setup Guide

## Overview
Your SIA-HRMS application is now connected to Supabase. This guide will help you complete the setup and start using the system.

## Prerequisites
- Supabase account (create at https://supabase.com)
- Node.js 16+ installed
- Your Supabase project URL and API keys (already configured in `.env`)

## Step 1: Set Up Your Supabase Database

### Option A: Using SQL Editor (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query and copy the contents of `DATABASE_SCHEMA.sql`
4. Run the query to create all tables and indexes

### Option B: Using Migration Files
1. Copy the schema from `DATABASE_SCHEMA.sql`
2. Run migrations in Supabase SQL editor

## Step 2: Verify Environment Variables

Your `.env` file should contain:
```
SUPABASE_URL=https://pheupnmnisguenfqaphs.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZXVwbm1uaXNndWVuZnFhcGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMzY2ODcsImV4cCI6MjA3OTgxMjY4N30.CYN8o3ilyeRY1aYLy7Vut47pLskF6gIcBv4zE3kOUqM
```

## Step 3: Start Your Server

```bash
npm install
npm start
```

The server will run on `http://localhost:3000`

## File Structure

### Backend Routes
- `/routes/employees.js` - Employee CRUD operations
- `/routes/attendance.js` - Attendance clock in/out
- `/routes/leaves.js` - Leave request management
- `/routes/payroll.js` - Payroll calculation and management

### Frontend Client
- `/js/supabaseClient.js` - Supabase client utilities with helper functions

## API Endpoints

### Employees
```
GET    /api/employees           - Get all employees
GET    /api/employees/:id       - Get specific employee
POST   /api/employees           - Create new employee
PUT    /api/employees/:id       - Update employee
DELETE /api/employees/:id       - Delete employee
```

### Attendance
```
GET    /api/attendance          - Get attendance records
GET    /api/attendance/:id      - Get specific record
POST   /api/attendance          - Clock in
PUT    /api/attendance/:id      - Clock out / Update record
```

### Leaves
```
GET    /api/leaves              - Get leave requests
GET    /api/leaves/:id          - Get specific request
POST   /api/leaves              - Create leave request
PUT    /api/leaves/:id          - Approve/reject leave
DELETE /api/leaves/:id          - Delete leave request
```

### Payroll
```
GET    /api/payroll             - Get payroll records
GET    /api/payroll/:id         - Get specific record
POST   /api/payroll             - Create payroll
PUT    /api/payroll/:id         - Update payroll
DELETE /api/payroll/:id         - Delete payroll record
```

## Using the Frontend Client

In your JavaScript files, import and use the Supabase client:

```javascript
import { supabase, supabaseHelper } from './js/supabaseClient.js';

// Get all employees
const { data: employees, error } = await supabaseHelper.getEmployees();

// Create new employee
const { data: newEmp, error } = await supabaseHelper.createEmployee({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  // ... other fields
});

// Login
const { data, error } = await supabaseHelper.login(email, password);

// Clock in
const { data: attendance, error } = await supabaseHelper.createAttendance({
  employee_id: employeeId,
  date: new Date().toISOString().split('T')[0],
  clock_in_time: new Date().toISOString()
});
```

## Database Tables

### employees
- id (UUID)
- first_name, last_name
- email, phone
- employee_id (unique identifier)
- department_id, position_id (foreign keys)
- hire_date, salary
- role (Admin, HR, Manager, Employee)
- status (Active, Inactive, On Leave)
- created_at, updated_at

### attendance
- id (UUID)
- employee_id (foreign key)
- date
- clock_in_time, clock_out_time
- hours_worked
- status (Present, Absent, Late, Early Leave)
- created_at, updated_at

### leaves
- id (UUID)
- employee_id (foreign key)
- leave_type (Sick, Vacation, Personal, Bereavement)
- start_date, end_date
- status (Pending, Approved, Rejected)
- approved_by (foreign key to employee)
- created_at, updated_at

### payroll
- id (UUID)
- employee_id (foreign key)
- pay_period_start, pay_period_end
- base_salary, overtime_pay, bonuses
- deductions, tax
- net_pay
- status (Draft, Pending, Paid)
- created_at, updated_at

### departments & positions
- Reference tables for organization structure

## Security Considerations

1. **API Keys**: Your `SUPABASE_ANON_KEY` is public-facing for frontend use
2. **Row Level Security (RLS)**: Policies are configured in the schema
3. **Passwords**: Never commit password hashes to version control
4. **Authentication**: Use Supabase Auth for production

## Common Tasks

### Add a New Employee
```javascript
const { data, error } = await supabaseHelper.createEmployee({
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane@example.com',
  employee_id: 'EMP001',
  department_id: departmentUUID,
  position_id: positionUUID,
  hire_date: '2024-01-15',
  salary: 50000,
  role: 'Employee'
});
```

### Get Employee Attendance
```javascript
const { data, error } = await supabaseHelper.getAttendance({
  employee_id: employeeUUID
});
```

### Approve Leave Request
```javascript
const { data, error } = await supabaseHelper.updateLeave(leaveId, {
  status: 'Approved',
  approved_by: currentUserUUID,
  approval_date: new Date().toISOString()
});
```

## Troubleshooting

### Connection Issues
- Verify `.env` file has correct Supabase credentials
- Check that your Supabase project is active
- Ensure network connectivity to Supabase

### API Errors
- Check browser console for detailed error messages
- Verify table names match exactly (case-sensitive)
- Ensure user has proper permissions (RLS policies)

### Missing Tables
- Run the `DATABASE_SCHEMA.sql` script in Supabase SQL Editor
- Verify all tables were created: `SELECT * FROM information_schema.tables`

## Next Steps

1. ✅ Create Supabase tables using `DATABASE_SCHEMA.sql`
2. ✅ Start the server with `npm start`
3. ✅ Update frontend pages to use the new API endpoints
4. ✅ Test all CRUD operations
5. Configure authentication (Supabase Auth or custom JWT)
6. Set up proper RLS policies for security
7. Deploy to production

## Support

For issues with:
- **Supabase**: Visit https://supabase.com/docs
- **Express**: Visit https://expressjs.com
- **Your App**: Check the console logs and error messages

---

**Last Updated**: November 27, 2025
**Version**: 1.0
