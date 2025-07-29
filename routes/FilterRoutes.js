const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.get('/filter-options', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT 
        nama_kab, nama_kec, nama_kel, nama_rw, tahun_cap, tahun_cip
      FROM sigapkumuh.chartkiriatas
      WHERE nama_kab IS NOT NULL 
        AND nama_kec IS NOT NULL 
        AND nama_kel IS NOT NULL 
        AND nama_rw IS NOT NULL
    `);

    const rows = result.rows;

    // Ambil nilai unik tahun_cap dan tahun_cip
    const tahunCapSet = new Set();
    const tahunCipSet = new Set();
    const wilayahSet = new Set();
    const kecamatanSet = new Set();
    const kelurahanSet = new Set();
    const rwSet = new Set();

    const cleanWilayah = (str) =>
      str.replace(/^Kota Adm\. /, '')
         .replace(/^Kab\. Adm\. /, '')
         .trim();

    const data = rows.map(r => {
      const wilayah = cleanWilayah(r.nama_kab);
      const kecamatan = r.nama_kec;
      const kelurahan = r.nama_kel;
      const rw = String(r.nama_rw).padStart(2, '0');

      if (r.tahun_cap) tahunCapSet.add(r.tahun_cap);
      if (r.tahun_cip) tahunCipSet.add(r.tahun_cip);

      wilayahSet.add(wilayah);
      kecamatanSet.add(kecamatan);
      kelurahanSet.add(kelurahan);
      rwSet.add(rw);

      return {
        tahun_cap: r.tahun_cap,
        tahun_cip: r.tahun_cip,
        wilayah,
        kecamatan,
        kelurahan,
        rw
      };
    });

    res.json({
      tahun_cap: Array.from(tahunCapSet).sort(),
      tahun_cip: Array.from(tahunCipSet).sort(),
      wilayah: Array.from(wilayahSet).sort(),
      kecamatan: Array.from(kecamatanSet).sort(),
      kelurahan: Array.from(kelurahanSet).sort(),
      rw: Array.from(rwSet).sort(),
      data, // digunakan untuk dependensi antar filter di frontend
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

module.exports = router;
