const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.get('/donut-cip-chart', async (req, res) => {
  const {
    wilayah,      // nama_kabkota
    kecamatan,    // nama_kec
    kelurahan,    // nama_kel
    rw            // nama_rw
  } = req.query;

  try {
    const filters = [`tahun = '2024'`]; // Pastikan '2024' sebagai string
    const values = [];

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

    // Filter + validasi NOT NULL
    const notNullConditions = `
      nama_kabkota IS NOT NULL AND
      nama_kec IS NOT NULL AND
      nama_kel IS NOT NULL AND
      nama_rw IS NOT NULL AND
      nama_kegiatan IS NOT NULL AND
      volume IS NOT NULL AND TRIM(volume::text) <> '' AND
      satuan IS NOT NULL AND satuan <> '' AND
      anggaran IS NOT NULL AND TRIM(anggaran::text) <> ''
    `;

    const whereClause =
      filters.length > 0
        ? `WHERE ${filters.join(' AND ')} AND ${notNullConditions}`
        : `WHERE ${notNullConditions}`;

    const query = `
      SELECT
        tahun,
        nama_kabkota,
        nama_kec,
        nama_kel,
        nama_rw, 
        nama_kegiatan,
        ROUND(SUM(REPLACE(REPLACE(volume::text, '.', ''), ',', '.')::numeric), 2) AS volume,
        satuan,
        ROUND(SUM(REPLACE(REPLACE(REPLACE(anggaran::text, '.', ''), ',', '.'), ' ', '')::numeric), 2) AS anggaran
      FROM sigapkumuh.data_cip_dev
      ${whereClause}
      GROUP BY tahun, nama_kabkota, nama_kec, nama_kel, nama_rw, nama_kegiatan, satuan
      ORDER BY tahun DESC, nama_kabkota, nama_kec, nama_kel, nama_rw;
    `;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Gagal mengambil data donut chart:', error);
    res.status(500).json({ error: 'Gagal mengambil data donut chart' });
  }
});

module.exports = router;
