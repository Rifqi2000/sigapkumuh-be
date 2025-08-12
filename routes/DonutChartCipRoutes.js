const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.get('/donut-cip-chart', async (req, res) => {
  try {
    // helper: normalisasi ke array of string tanpa "Semua"/kosong
    const toArr = (v) => {
      if (Array.isArray(v)) {
        return v.map(String).map(s => s.trim()).filter(s => s && s !== 'Semua');
      }
      if (v === undefined || v === null) return [];
      const s = String(v).trim();
      return s && s !== 'Semua' ? [s] : [];
    };

    const tahun     = toArr(req.query.tahun);             // tahun CIP (bisa banyak)
    const wilayah   = toArr(req.query.wilayah);
    const kecamatan = toArr(req.query.kecamatan);
    const kelurahan = toArr(req.query.kelurahan);
    const rw        = toArr(req.query.rw).map(v => v.padStart(2, '0')); // 2 digit
    const kegiatan  = toArr(req.query.kegiatan);

    const base = `
      WITH src AS (
        SELECT
          (tahun_cip)::text AS t_cip,
          REGEXP_REPLACE(nama_kab, '^(Kota Adm\\. |Kab\\. Adm\\. )', '') AS clean_kab,
          nama_kec,
          nama_kel,
          nama_rw,
          nama_kegiatan,
          COALESCE(total_kegiatan_cip, 0)            AS total_kegiatan_cip,
          COALESCE(total_anggaran_cip, 0)::numeric   AS anggaran
        FROM sigapkumuh.stackedbar
        WHERE COALESCE(NULLIF(TRIM(nama_kegiatan), ''), NULL) IS NOT NULL
      )
    `;

    const filters = [];
    const values  = [];
    const addAny = (expr, arr) => {
      values.push(arr);
      filters.push(`${expr} = ANY($${values.length}::text[])`);
    };

    if (tahun.length)     addAny('t_cip', tahun);
    if (wilayah.length)   addAny('clean_kab', wilayah);
    if (kecamatan.length) addAny('nama_kec', kecamatan);
    if (kelurahan.length) addAny('nama_kel', kelurahan);
    if (rw.length)        addAny("LPAD(nama_rw, 2, '0')", rw);
    if (kegiatan.length)  addAny('nama_kegiatan', kegiatan);

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const sql = `
      ${base}
      SELECT
        nama_kegiatan,
        COALESCE(SUM(total_kegiatan_cip), 0)::numeric AS jumlah_cip,
        COALESCE(SUM(anggaran), 0)::numeric           AS total_anggaran_cip
      FROM src
      ${whereClause}
      GROUP BY nama_kegiatan
      HAVING COALESCE(SUM(anggaran), 0) > 0
      ORDER BY total_anggaran_cip DESC, nama_kegiatan;
    `;

    const { rows } = await pool.query(sql, values);
    res.json(rows);
  } catch (error) {
    console.error('Gagal mengambil data donut chart stackedbar:', error);
    res.status(500).json({ error: 'Gagal mengambil data donut chart stackedbar' });
  }
});

module.exports = router;
