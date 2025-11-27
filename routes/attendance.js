// Backend routes for attendance using Supabase
import express from 'express';
import { supabase } from '../config/index.js';

const router = express.Router();

// GET attendance records with optional filters
router.get('/', async (req, res) => {
  try {
    let query = supabase.from('attendance').select('*');

    if (req.query.employee_id) {
      query = query.eq('employee_id', req.query.employee_id);
    }
    if (req.query.date) {
      query = query.eq('date', req.query.date);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// GET single attendance record
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance record' });
  }
});

// CREATE attendance record (Clock In)
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .insert([req.body])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create attendance record' });
  }
});

// UPDATE attendance record (Clock Out)
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .update(req.body)
      .eq('id', req.params.id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update attendance record' });
  }
});

export default router;
