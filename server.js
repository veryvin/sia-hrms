import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from './config/index.js';  // Your supabase config

const app = express();

// Setup __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static folders with URL prefixes
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/html', express.static(path.join(__dirname, 'html')));

// Optional: Serve index.html at root URL
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'html/index.html'));
});

// Example API route for Supabase query
app.get('/api/employees', async (req, res) => {
  try {
    const { data, error } = await supabase.from('employees').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
