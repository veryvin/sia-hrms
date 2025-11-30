// Backend routes for payroll using Supabase
import express from 'express';
import { supabase } from '../config/index.js';

const router = express.Router();

// GET payroll records with optional filters
router.get('/', async (req, res) => {
  try {
    let query = supabase.from('payroll').select('*');

    if (req.query.employee_id) {
      query = query.eq('employee_id', req.query.employee_id);
    }

    const { data, error } = await query.order('pay_period_end', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payroll records' });
  }
});

// GET single payroll record
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payroll')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payroll record' });
  }
});

// CREATE payroll record
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payroll')
      .insert([req.body])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create payroll record' });
  }
});

// UPDATE payroll record
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payroll')
      .update(req.body)
      .eq('id', req.params.id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payroll record' });
  }
});

// DELETE payroll record
router.delete('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payroll')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Payroll record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete payroll record' });
  }
});

export default router;
