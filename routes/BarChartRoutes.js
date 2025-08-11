const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/chart-bar', async (req, res) => {
  const {
    wilayah,
    kecamatan,
    kelurahan,
    rw,
    kegiatan, // opsional
  } = req.query;

  try {
    const filters = [];
    const values = [];

    // CTE: normalisasi nama_kab -> clean_kab
    const base = `
      WITH src AS (
        SELECT
          REGEXP_REPLACE(nama_kab, '^(Kota Adm\\. |Kab\\. Adm\\. )', '') AS clean_kab,
          nama_kec,
          nama_kel,
          nama_rw,
          nama_kegiatan,
          tahun_cap::text AS t_cap,
          tahun_cip::text AS t_cip,
          COALESCE(total_kegiatan_cap, 0) AS total_kegiatan_cap,
          COALESCE(total_kegiatan_cip, 0) AS total_kegiatan_cip
        FROM sigapkumuh.stackedbar
      )
    `;

    // Filter lokasi
    if (wilayah && wilayah !== 'Semua') {
      filters.push(`clean_kab = $${values.length + 1}`);
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
      filters.push(`LPAD(nama_rw, 2, '0') = $${values.length + 1}`);
      values.push(rw);
    }

    // Filter kegiatan (opsional)
    if (kegiatan && kegiatan !== 'Semua') {
      filters.push(`nama_kegiatan = $${values.length + 1}`);
      values.push(kegiatan.trim());
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    // Tahun tetap: CAP=2023, CIP=2024 → filter di SUM(CASE WHEN ...)
    const query = `
      ${base}
      SELECT
        nama_kegiatan,
        SUM(CASE WHEN t_cap = '2023' THEN total_kegiatan_cap ELSE 0 END) AS jumlah_cap,
        SUM(CASE WHEN t_cip = '2024' THEN total_kegiatan_cip ELSE 0 END) AS jumlah_cip
      FROM src
      ${whereClause}
      GROUP BY nama_kegiatan
      ORDER BY nama_kegiatan;
    `;

    const { rows } = await pool.query(query, values);

    const response = rows.map(r => ({
      label: r.nama_kegiatan,
      jumlah_cap: Number(r.jumlah_cap || 0),
      jumlah_cip: Number(r.jumlah_cip || 0),
    }));

    res.json(response);
  } catch (error) {
    console.error('❌ Error fetching bar chart data:', error);
    res.status(500).json({
      error: 'Gagal mengambil data bar chart kegiatan',
      message: error.message,
    });
  }
});

module.exports = router;
