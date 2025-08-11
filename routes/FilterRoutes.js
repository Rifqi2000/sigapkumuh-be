const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.get('/filter-options', async (req, res) => {
  try {
    // 1) Ambil dasar filter (tahun, wilayah, dst.) dari chartkiriatas
    const baseResult = await pool.query(`
      SELECT DISTINCT 
        nama_kab, nama_kec, nama_kel, nama_rw, tahun_cap, tahun_cip
      FROM sigapkumuh.chartkiriatas
      WHERE nama_kab IS NOT NULL 
        AND nama_kec IS NOT NULL 
        AND nama_kel IS NOT NULL 
        AND nama_rw IS NOT NULL
    `);

    // 2) Ambil daftar kegiatan dari tabel kegiatan
    //    Gunakan nama_kegiatan (kolom tanpa spasi). 
    //    Jika kolom kamu benar-benar bernama "nama kegiatan" (pakai spasi),
    //    ganti query di bawah menjadi:
    //    SELECT DISTINCT TRIM("nama kegiatan") AS nama_kegiatan FROM sigapkumuh.kegiatan ...
    const kegiatanResult = await pool.query(`
      SELECT DISTINCT TRIM(nama_kegiatan) AS nama_kegiatan
      FROM sigapkumuh.kegiatan
      WHERE nama_kegiatan IS NOT NULL
        AND TRIM(nama_kegiatan) <> ''
      ORDER BY 1
    `);

    const rows = baseResult.rows;

    const tahunCapSet = new Set();
    const tahunCipSet = new Set();
    const wilayahSet = new Set();
    const kecamatanSet = new Set();
    const kelurahanSet = new Set();
    const rwSet = new Set();

    const cleanWilayah = (str) =>
      str
        .replace(/^Kota Adm\. /, '')
        .replace(/^Kab\. Adm\. /, '')
        .trim();

    // Data untuk dependensi antar filter (di frontend)
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
        // Jika nanti butuh dependensi berdasarkan kegiatan,
        // tambahkan kolom di chartkiriatas dan ikutkan di sini:
        // , kegiatan: r.nama_kegiatan
      };
    });

    // Susun list kegiatan
    const kegiatan = kegiatanResult.rows
      .map(k => k.nama_kegiatan)
      .filter(Boolean) // safety
      .sort((a, b) => a.localeCompare(b, 'id'));

    res.json({
      tahun_cap: Array.from(tahunCapSet).sort(),
      tahun_cip: Array.from(tahunCipSet).sort(),
      wilayah: Array.from(wilayahSet).sort((a, b) => a.localeCompare(b, 'id')),
      kecamatan: Array.from(kecamatanSet).sort((a, b) => a.localeCompare(b, 'id')),
      kelurahan: Array.from(kelurahanSet).sort((a, b) => a.localeCompare(b, 'id')),
      rw: Array.from(rwSet).sort(),
      kegiatan, // ⬅️ filter baru dari tabel kegiatan
      data      // tetap dipakai untuk dependensi antar filter di frontend
    });
  } catch (err) {
    console.error('Error /filter-options:', err);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

module.exports = router;
