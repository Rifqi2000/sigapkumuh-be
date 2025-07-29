const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.get('/chart-bar', async (req, res) => {
  const {
    tahun_cap,
    tahun_cip,
    wilayah,
    kecamatan,
    kelurahan,
    rw,
    level_x_axis,
  } = req.query;

  try {
    // ⛔ Validasi agar level_x_axis tidak mengambil data di luar konteksnya
    if (level_x_axis === 'kecamatan' && (!wilayah || wilayah === 'Semua')) {
      return res.status(400).json({ error: 'Filter wilayah harus dipilih untuk level kecamatan' });
    }
    if (level_x_axis === 'kelurahan' && (!kecamatan || kecamatan === 'Semua')) {
      return res.status(400).json({ error: 'Filter kecamatan harus dipilih untuk level kelurahan' });
    }
    if (level_x_axis === 'rw' && (!kelurahan || kelurahan === 'Semua')) {
      return res.status(400).json({ error: 'Filter kelurahan harus dipilih untuk level RW' });
    }

    const filters = [];
    const values = [];

    if (tahun_cap && tahun_cap !== 'Semua') {
      filters.push(`tahun_cap = $${values.length + 1}`);
      values.push(tahun_cap);
    }

    if (tahun_cip && tahun_cip !== 'Semua') {
      filters.push(`tahun_cip = $${values.length + 1}`);
      values.push(tahun_cip);
    }

    if (wilayah && wilayah !== 'Semua') {
      filters.push(`REPLACE(REPLACE(nama_kab, 'Kota Adm. ', ''), 'Kab. Adm. ', '') = $${values.length + 1}`);
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

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const result = await pool.query(`
      SELECT 
        nama_kab,
        nama_kec,
        nama_kel,
        LPAD(nama_rw, 2, '0') AS nama_rw,
        total_kegiatan_cap,
        total_anggaran_cap,
        total_kegiatan_cip,
        total_anggaran_cip,
        tahun_cap,
        tahun_cip
      FROM sigapkumuh.chartkiriatas
      ${whereClause}
    `, values);

    const rows = result.rows;

    const cleanWilayah = (str) =>
      str.replace(/^Kota Adm\. /, '')
         .replace(/^Kab\. Adm\. /, '')
         .trim();

    const grouped = {};

    for (const row of rows) {
      const wilayah = cleanWilayah(row.nama_kab);
      const namaKec = row.nama_kec || 'Tidak Diketahui';
      const namaKel = row.nama_kel || 'Tidak Diketahui';
      const namaRW = row.nama_rw || 'Tidak Diketahui';

      // Default fallback level
      let level = level_x_axis || 'wilayah';
      let groupKey = '';
      let label = '';

      if (level === 'rw') {
        groupKey = `${wilayah}-${namaKec}-${namaKel}-${namaRW}`;
        label = namaRW;
      } else if (level === 'kelurahan') {
        groupKey = `${wilayah}-${namaKec}-${namaKel}`;
        label = namaKel;
      } else if (level === 'kecamatan') {
        groupKey = `${wilayah}-${namaKec}`;
        label = namaKec;
      } else {
        groupKey = wilayah;
        label = wilayah;
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          label,
          jumlah_rw_kumuh: new Set(),
          jumlah_rw_cap: new Set(),
          jumlah_rw_cip: new Set(),
          total_kegiatan_cap: 0,
          total_kegiatan_cip: 0,
          total_anggaran_cip: 0,
        };
      }

      const group = grouped[groupKey];
      const uniqueRWKey = `${wilayah}-${namaKec}-${namaKel}-${namaRW}`;
      group.jumlah_rw_kumuh.add(uniqueRWKey);

      const hasCAP = row.total_kegiatan_cap || row.total_anggaran_cap;
      const hasCIP = row.total_kegiatan_cip || row.total_anggaran_cip;

      if (hasCAP) {
        group.jumlah_rw_cap.add(uniqueRWKey);
        group.total_kegiatan_cap += Number(row.total_kegiatan_cap || 0);
      }

      if (hasCIP) {
        group.jumlah_rw_cip.add(uniqueRWKey);
        group.total_kegiatan_cip += Number(row.total_kegiatan_cip || 0);
        group.total_anggaran_cip += Number(row.total_anggaran_cip || 0);
      }
    }

    const response = Object.values(grouped).map((val) => ({
      label: val.label,
      jumlah_rw_kumuh: val.jumlah_rw_kumuh.size,
      jumlah_rw_cap: val.jumlah_rw_cap.size,
      jumlah_rw_cip: val.jumlah_rw_cip.size,
      jumlah_kegiatan_cap: val.total_kegiatan_cap,
      jumlah_kegiatan_cip: val.total_kegiatan_cip,
      total_anggaran_cip: val.total_anggaran_cip,
    }));

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data chart bar' });
  }
});

module.exports = router;
