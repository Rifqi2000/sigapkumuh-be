const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.get('/table-cip', async (req, res) => {
  try {
    const query = `
      SELECT 
        tahun,
        nama_kabkota,
        nama_kec,
        nama_kel,
        LPAD(RIGHT(nama_rw::text, 2), 2, '0') AS nama_rw,
        nama_kegiatan,
        volume,
        satuan,
        anggaran
      FROM sigapkumuh.data_cip_dev
      WHERE tahun = '2024'
        AND nama_kabkota IS NOT NULL
        AND nama_kec IS NOT NULL
        AND nama_kel IS NOT NULL
        AND nama_rw IS NOT NULL
        AND nama_kegiatan IS NOT NULL
        AND volume IS NOT NULL
        AND satuan IS NOT NULL
        AND anggaran IS NOT NULL
      ORDER BY tahun DESC, nama_kabkota, nama_kec, nama_kel, nama_rw
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Gagal mengambil data tabel CIP:', error);
    res.status(500).json({ error: 'Gagal mengambil data tabel CIP' });
  }
});

module.exports = router;
