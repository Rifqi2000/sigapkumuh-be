const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.get('/table-cip', async (req, res) => {
  const { tahun, wilayah, kecamatan, kelurahan, rw } = req.query;

  try {
    const filters = [];
    const values = [];

    // Filter tahun CIP, default 2024
    filters.push(`tahun_cip = $${values.length + 1}`);
    values.push(tahun || '2024');

    // Hanya ambil nama_kab yang terisi
    filters.push(`NULLIF(TRIM(nama_kab), '') IS NOT NULL`);

    if (wilayah && wilayah !== 'Semua') {
      filters.push(`nama_kab = $${values.length + 1}`);
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
        tahun_cip AS tahun,
        nama_kab AS nama_kabkota,
        nama_kec,
        nama_kel,
        nama_rw,
        nama_kegiatan,
        tipe_bahan,
        satuan,
        ROUND(total_volume_cip::numeric, 2) AS volume,
        total_kegiatan_cip,
        ROUND(total_anggaran_cip::numeric, 2) AS anggaran,
        skpd
      FROM sigapkumuh.stackedbar
      ${whereClause}
      ORDER BY nama_kab, nama_kec, nama_kel, nama_rw;
    `;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Gagal mengambil data dari view stackedbar:', error);
    res.status(500).json({ error: 'Gagal mengambil data tabel stackedbar' });
  }
});

module.exports = router;
