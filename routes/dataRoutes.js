const express = require('express');
const router = express.Router();
const pool = require('../db');

// Endpoint utama dengan filter dinamis
router.get('/', async (req, res) => {
  const { periode_data, wilayah, kecamatan, kelurahan } = req.query;

  try {
    let baseQuery = 'SELECT * FROM sigapkumuh.data_tabular WHERE 1=1';
    const values = [];

    if (periode_data) {
      values.push(periode_data);
      baseQuery += ` AND tahun = $${values.length}`;
    }

    if (wilayah) {
      values.push(wilayah);
      baseQuery += ` AND nama_kabkota = $${values.length}`;
    }

    if (kecamatan) {
      values.push(kecamatan);
      baseQuery += ` AND nama_kec = $${values.length}`;
    }

    if (kelurahan) {
      values.push(kelurahan);
      baseQuery += ` AND nama_kel = $${values.length}`;
    }

    const result = await pool.query(baseQuery, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Query error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;
