// Backend routes for leaves using Supabase
import express from 'express';
import { supabase } from '../config/index.js';

const router = express.Router();

// GET leave requests with optional filters
router.get('/', async (req, res) => {
  try {
    let query = supabase.from('leaves').select('*');

    if (req.query.employee_id) {
      query = query.eq('employee_id', req.query.employee_id);
    }
    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// GET single leave request
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leaves')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leave request' });
  }
});

// CREATE leave request
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leaves')
      .insert([req.body])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create leave request' });
  }
});

// UPDATE leave request (approve/reject)
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leaves')
      .update(req.body)
      .eq('id', req.params.id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update leave request' });
  }
});

// DELETE leave request
router.delete('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leaves')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Leave request deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete leave request' });
  }
});

export default router;
