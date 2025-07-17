const express = require('express');
const cors = require('cors');
require('dotenv').config();
const dataRoutes = require('./routes/dataRoutes');
const pool = require('./db'); // pastikan Anda import pool dari file db.js

const app = express();
app.use(cors());
app.use(express.json());

// Gunakan rute
app.use('/api/data', dataRoutes);

// Cek koneksi database sebelum listen
pool.connect()
  .then(client => {
    console.log('✅ Database connected successfully');
    client.release(); // jangan lupa release setelah connect

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to the database:', err.message);
    process.exit(1); // hentikan aplikasi jika gagal konek
  });
