import express from 'express';
import { supabase } from '../../config/index.js'; // Adjust relative path if needed

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('employees').select('*');
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch employees' });
    }
    res.json({ message: 'Connection successful!', data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
