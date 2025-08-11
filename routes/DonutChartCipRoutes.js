const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.get('/donut-cip-chart', async (req, res) => {
  // Tahun, wilayah, dst. datang dari query string
  const {
    tahun = '2024',            // default 2024 (CIP)
    wilayah = '',
    kecamatan = '',
    kelurahan = '',
    rw = '',
    kegiatan = '',            // ⬅️ penting: dukung filter kegiatan
  } = req.query;

  try {
    const filters = [];
    const values = [];

    // CTE untuk normalisasi nama_kab dan seleksi data valid
    const base = `
      WITH src AS (
        SELECT
          tahun_cip::text AS tahun,
          REGEXP_REPLACE(nama_kab, '^(Kota Adm\\. |Kab\\. Adm\\. )', '') AS clean_kab,
          nama_kec,
          nama_kel,
          nama_rw,
          nama_kegiatan,
          total_kegiatan_cip,
          total_anggaran_cip::numeric AS anggaran
        FROM sigapkumuh.stackedbar
        WHERE
          -- hanya data valid
          total_anggaran_cip IS NOT NULL AND total_anggaran_cip > 0
          AND COALESCE(NULLIF(TRIM(nama_kegiatan), ''), NULL) IS NOT NULL
      )
    `;

    // ==== Filter dinamis ====
    if (tahun && tahun !== 'Semua') {
      filters.push(`tahun = $${values.length + 1}`);
      values.push(String(tahun));
    }
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
      filters.push(`nama_rw = $${values.length + 1}`);
      values.push(rw);
    }
    // ⬇️ filter kegiatan
    if (kegiatan && kegiatan !== 'Semua') {
      filters.push(`nama_kegiatan = $${values.length + 1}`);
      values.push(kegiatan.trim());
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    // Query akhir: agregasi per kegiatan
    const query = `
      ${base}
      SELECT
        nama_kegiatan,
        COALESCE(SUM(total_kegiatan_cip), 0)::numeric AS jumlah_cip,
        COALESCE(SUM(anggaran), 0)::numeric           AS total_anggaran_cip
      FROM src
      ${whereClause}
      GROUP BY nama_kegiatan
      HAVING COALESCE(SUM(anggaran), 0) > 0           -- pastikan ada anggaran
      ORDER BY total_anggaran_cip DESC, nama_kegiatan;
    `;

    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (error) {
    console.error('Gagal mengambil data donut chart stackedbar:', error);
    res.status(500).json({ error: 'Gagal mengambil data donut chart stackedbar' });
  }
});

module.exports = router;
