// Backend routes for employees using Supabase
import express from 'express';
import { supabase } from '../config/index.js';

const router = express.Router();

// GET all employees
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// GET single employee by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// CREATE new employee
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .insert([req.body])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// UPDATE employee
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .update(req.body)
      .eq('id', req.params.id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// DELETE employee
router.delete('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

export default router;
