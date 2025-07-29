const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.get('/donut-cip-chart', async (req, res) => {
  const {
    tahun,
    wilayah,      // nama_kabkota
    kecamatan,    // nama_kec
    kelurahan,    // nama_kel
    rw            // nama_rw
  } = req.query;

  try {
    const filters = [];
    const values = [];

    if (tahun && tahun !== 'Semua') {
      filters.push(`tahun = $${values.length + 1}`);
      values.push(tahun);
    }

    if (wilayah && wilayah !== 'Semua') {
      filters.push(`nama_kabkota = $${values.length + 1}`);
      values.push(wilayah);
    }

    if (kecamatan && kecamatan !== 'Semua') {
      filters.push(`nama_kec = $${values.length + 1}`);
      values.push(kecamatan);
    }

    if (kelurahan && kelurahan !== 'Semua') {
      filters.push(`nama_kel = $${values.length + 1}`);
      values.push(kelurahan);
    }

    if (rw && rw !== 'Semua') {
      filters.push(`nama_rw = $${values.length + 1}`);
      values.push(rw);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const query = `
      SELECT 
        tahun,
        nama_kabkota,
        nama_kec,
        nama_kel,
        LPAD(RIGHT(nama_rw::text, 2), 2, '0') AS nama_rw,
        nama_kegiatan,
        SUM(REPLACE(volume, ',', '.')::double precision) AS volume,
        satuan,
        SUM(anggaran::double precision) AS anggaran
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
      GROUP BY tahun, nama_kabkota, nama_kec, nama_kel, nama_rw, nama_kegiatan, satuan
      ORDER BY tahun DESC, nama_kabkota, nama_kec, nama_kel, nama_rw
    `;

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error('Gagal mengambil data donut chart:', error);
    res.status(500).json({ error: 'Gagal mengambil data donut chart' });
  }
});

module.exports = router;
