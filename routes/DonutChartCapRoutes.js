const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.get('/donut-cap-chart', async (req, res) => {
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
      filters.push(`REPLACE(REPLACE(nama_kabkota, 'Kota Adm. ', ''), 'Kab. Adm. ', '') = $${values.length + 1}`);
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

    // Tambahan filter untuk memastikan semua kolom penting terisi
    const dataValidClause = `
      tahun IS NOT NULL AND tahun <> ''
      AND nama_kabkota IS NOT NULL AND nama_kabkota <> ''
      AND nama_kec IS NOT NULL AND nama_kec <> ''
      AND nama_kel IS NOT NULL AND nama_kel <> ''
      AND nama_rw IS NOT NULL AND nama_rw <> ''
      AND nama_kegiatan IS NOT NULL AND nama_kegiatan <> ''
      AND volume IS NOT NULL
      AND satuan IS NOT NULL AND satuan <> ''
      AND anggaran IS NOT NULL AND anggaran > 0
    `;

    filters.push(dataValidClause); // pastikan semua kolom valid

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const query = `
      SELECT 
        tahun,
        REPLACE(REPLACE(nama_kabkota, 'Kota ', ''), 'Kab ', '') AS nama_kabkota,
        nama_kec,
        nama_kel,
        nama_rw,
        nama_kegiatan,
        volume,
        satuan,
        anggaran
      FROM sigapkumuh.data_cap_dev
      ${whereClause}
    `;

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error('Gagal mengambil data donut chart:', error);
    res.status(500).json({ error: 'Gagal mengambil data donut chart' });
  }
});

module.exports = router;
