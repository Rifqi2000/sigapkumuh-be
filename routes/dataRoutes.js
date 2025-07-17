const express = require('express');
const router = express.Router();
const pool = require('../db');

// Endpoint utama dengan filter dinamis
router.get('/', async (req, res) => {
  const { periode_data, wilayah, kecamatan, kelurahan } = req.query;

  try {
    let baseQuery = 'SELECT * FROM sigapkumuh.data_sigapkumuh2 WHERE 1=1';
    const values = [];

    if (periode_data) {
      values.push(periode_data);
      baseQuery += ` AND periode_data = $${values.length}`;
    }

    if (wilayah) {
      values.push(wilayah);
      baseQuery += ` AND wilayah = $${values.length}`;
    }

    if (kecamatan) {
      values.push(kecamatan);
      baseQuery += ` AND kecamatan = $${values.length}`;
    }

    if (kelurahan) {
      values.push(kelurahan);
      baseQuery += ` AND kelurahan = $${values.length}`;
    }

    const result = await pool.query(baseQuery, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Query error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;
