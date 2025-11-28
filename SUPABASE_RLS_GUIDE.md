# Supabase Row Level Security (RLS) Guide for SIA-HRMS

## What is RLS?
Row Level Security (RLS) in Supabase lets you control which rows in your tables can be read or written by different users. By default, enabling RLS blocks all access except for policies you explicitly allow.

## How to Allow Public Read Access (for Guests)
If you want all users (including guests) to view data, add a policy like this for each table:

### Example: Allow SELECT for Everyone
1. Go to your Supabase project dashboard.
2. Click on the table (e.g., `employees`, `departments`, `attendance`, etc.).
3. Go to the **Policies** tab.
4. Click **New Policy**.
5. Name: `Public Select`
6. Action: `SELECT`
7. Using Expression: `true`
8. Click **Save Policy**.

This allows anyone (even unauthenticated users) to read rows from the table.

### Example: Allow INSERT/UPDATE/DELETE for Authenticated Users Only
For write actions, you usually want only logged-in users to change data:
- Action: `INSERT`, `UPDATE`, `DELETE`
- Using Expression: `auth.role() = 'authenticated'`

## Example Policy for Employees Table
```sql
-- Allow public read
CREATE POLICY "Public Select" ON employees
FOR SELECT
USING (true);

-- Allow only authenticated users to insert/update/delete
CREATE POLICY "Authenticated Write" ON employees
FOR ALL
USING (auth.role() = 'authenticated');
```

## Integration Checklist
- [x] Supabase client is initialized in `js/supabaseClient.js`
- [x] All frontend pages can be accessed by guests
- [x] RLS policies allow public SELECT (read) for all tables you want visible
- [x] Only authenticated users can write (insert/update/delete)

## Security Note
Allowing public SELECT means anyone can read your data. If you want to restrict some tables (e.g., payroll), do not add a public SELECT policy for those tables.

## More Info
- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [Policy Examples](https://supabase.com/docs/guides/auth/row-level-security#policy-examples)

---
If you need help with custom policies, just ask!
