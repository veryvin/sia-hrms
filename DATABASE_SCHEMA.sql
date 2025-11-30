-- Supabase SQL Schema for HRMS
-- Run these queries in your Supabase SQL Editor to set up the database

-- 1. Create Departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create Positions table
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create Employees table
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(10),
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  postal_code VARCHAR(10),
  country VARCHAR(50),
  
  -- Employment Info
  employee_id VARCHAR(20) NOT NULL UNIQUE,
  department_id UUID REFERENCES departments(id),
  position_id UUID REFERENCES positions(id),
  hire_date DATE,
  salary DECIMAL(10, 2),
  employment_type VARCHAR(50), -- Full-time, Part-time, Contract
  status VARCHAR(20) DEFAULT 'Active', -- Active, Inactive, On Leave
  
  -- Authentication
  password_hash VARCHAR(255),
  role VARCHAR(20) DEFAULT 'Employee', -- Admin, HR, Manager, Employee
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create Attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clock_in_time TIMESTAMP,
  clock_out_time TIMESTAMP,
  hours_worked DECIMAL(5, 2),
  status VARCHAR(20), -- Present, Absent, Late, Early Leave
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- 5. Create Leaves table
CREATE TABLE leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type VARCHAR(50), -- Sick, Vacation, Personal, Bereavement
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  number_of_days INTEGER,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Rejected
  approved_by UUID REFERENCES employees(id),
  approval_date TIMESTAMP,
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create Payroll table
CREATE TABLE payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  base_salary DECIMAL(10, 2),
  overtime_pay DECIMAL(10, 2) DEFAULT 0,
  bonuses DECIMAL(10, 2) DEFAULT 0,
  deductions DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  net_pay DECIMAL(10, 2),
  payment_date DATE,
  status VARCHAR(20) DEFAULT 'Draft', -- Draft, Pending, Paid
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. Create Reports table (for generated reports)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(100), -- Attendance, Payroll, Leave Summary, etc.
  generated_by UUID REFERENCES employees(id),
  date_from DATE,
  date_to DATE,
  filters JSONB,
  file_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create basic policies (adjust based on your requirements)
-- Employees can view their own data
CREATE POLICY "Employees can view their own data" ON employees
  FOR SELECT USING (auth.uid()::text = id::text);

-- Employees can view their own attendance
CREATE POLICY "Employees can view their own attendance" ON attendance
  FOR SELECT USING (
    employee_id = (SELECT id FROM employees WHERE id::text = auth.uid()::text)
  );

-- Admins can view all data
CREATE POLICY "Admins can view all employees" ON employees
  FOR SELECT USING (
    (SELECT role FROM employees WHERE id::text = auth.uid()::text) = 'Admin'
  );

-- Create indexes for better performance
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_position ON employees(position_id);
CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_leaves_employee ON leaves(employee_id);
CREATE INDEX idx_leaves_status ON leaves(status);
CREATE INDEX idx_payroll_employee ON payroll(employee_id);
CREATE INDEX idx_payroll_period ON payroll(pay_period_end);
