const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/chart-bar', async (req, res) => {
  try {
    // helper: normalisasi ke array of string tanpa nilai kosong / "Semua"
    const toArr = (v) => {
      if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(s => s && s !== 'Semua');
      if (v === undefined || v === null) return [];
      const s = String(v).trim();
      return s && s !== 'Semua' ? [s] : [];
    };

    const wilayah   = toArr(req.query.wilayah);
    const kecamatan = toArr(req.query.kecamatan);
    const kelurahan = toArr(req.query.kelurahan);
    const rw        = toArr(req.query.rw).map(v => v.padStart(2, '0')); // 2 digit
    const kegiatan  = toArr(req.query.kegiatan);
    const tahunCap  = toArr(req.query.tahun_cap);
    const tahunCip  = toArr(req.query.tahun_cip);

    // CTE: normalisasi nama_kab -> clean_kab
    const base = `
      WITH src AS (
        SELECT
          REGEXP_REPLACE(nama_kab, '^(Kota Adm\\. |Kab\\. Adm\\. )', '') AS clean_kab,
          nama_kec,
          nama_kel,
          nama_rw,
          nama_kegiatan,
          (tahun_cap)::text AS t_cap,
          (tahun_cip)::text AS t_cip,
          COALESCE(total_kegiatan_cap, 0) AS total_kegiatan_cap,
          COALESCE(total_kegiatan_cip, 0) AS total_kegiatan_cip
        FROM sigapkumuh.stackedbar
      )
    `;

    const filters = [];
    const values  = [];
    const addAny = (expr, arr) => { values.push(arr); filters.push(`${expr} = ANY($${values.length}::text[])`); };

    // Filter lokasi
    if (wilayah.length)   addAny('clean_kab', wilayah);
    if (kecamatan.length) addAny('nama_kec', kecamatan);
    if (kelurahan.length) addAny('nama_kel', kelurahan);
    if (rw.length)        addAny("LPAD(nama_rw, 2, '0')", rw);

    // Filter kegiatan (opsional, bisa multi)
    if (kegiatan.length)  addAny('nama_kegiatan', kegiatan);

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    // Tahun CAP/CIP (opsional, bisa multi). Jika kosong -> hitung semua tahun.
    const capExpr = tahunCap.length
      ? (() => { values.push(tahunCap); return `SUM(CASE WHEN t_cap = ANY($${values.length}::text[]) THEN total_kegiatan_cap ELSE 0 END)`; })()
      : `SUM(total_kegiatan_cap)`;

    const cipExpr = tahunCip.length
      ? (() => { values.push(tahunCip); return `SUM(CASE WHEN t_cip = ANY($${values.length}::text[]) THEN total_kegiatan_cip ELSE 0 END)`; })()
      : `SUM(total_kegiatan_cip)`;

    // ➜ SELALU group by nama_kegiatan
    const query = `
      ${base}
      SELECT
        nama_kegiatan AS label,
        ${capExpr} AS jumlah_cap,
        ${cipExpr} AS jumlah_cip
      FROM src
      ${whereClause}
      GROUP BY nama_kegiatan
      ORDER BY nama_kegiatan;
    `;

    const { rows } = await pool.query(query, values);

    res.json(rows.map(r => ({
      label: r.label ?? 'Tidak Diketahui',
      jumlah_cap: Number(r.jumlah_cap || 0),
      jumlah_cip: Number(r.jumlah_cip || 0),
    })));
  } catch (error) {
    console.error('❌ Error fetching bar chart data:', error);
    res.status(500).json({
      error: 'Gagal mengambil data bar chart kegiatan',
      message: error.message,
    });
  }
});

module.exports = router;
