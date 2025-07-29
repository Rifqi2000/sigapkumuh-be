const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// === 1. Jumlah RW Kumuh (hanya yang nama_kab, nama_kec, nama_kel, nama_rw tidak kosong) ===
router.get('/jumlahrwkumuh', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) 
      FROM sigapkumuh.rwkumuh 
    `);
    res.json({ jumlah_rw_kumuh: parseInt(result.rows[0].count, 10) });
  } catch (error) {
    console.error('Error fetching RW Kumuh:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// === 2. Jumlah RW Sudah Implementasi (hanya yang ada nama_kab, nama_kec, nama_kel, nama_rw) ===
router.get('/rwimplementasi', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) 
      FROM sigapkumuh.barchart_cip 
      WHERE nama_kabkota IS NOT NULL AND nama_kabkota <> ''
        AND nama_kec IS NOT NULL AND nama_kec <> ''
        AND nama_kel IS NOT NULL AND nama_kel <> ''
        AND nama_rw IS NOT NULL AND nama_rw <> ''
    `);
    res.json({ jumlah_rw_implementasi: parseInt(result.rows[0].count, 10) });
  } catch (error) {
    console.error('Error fetching RW Implementasi:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// // === 3. Jumlah Kegiatan CIP (yang nama_kegiatan tidak kosong) ===
// router.get('/jumlahkegiatancip', async (req, res) => {
//   try {
//     const result = await pool.query(`
//       SELECT COUNT(*) 
//       FROM sigapkumuh.data_cip_dev 
//       WHERE nama_kegiatan IS NOT NULL AND nama_kegiatan <> ''
//     `);
//     res.json({ jumlah_cip: parseInt(result.rows[0].count, 10) });
//   } catch (error) {
//     console.error('Error fetching Kegiatan CIP:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// // === 4. Jumlah Anggaran (hanya jika semua kolom penting terisi) ===
// router.get('/jumlahanggaran', async (req, res) => {
//   try {
//     const result = await pool.query(`
//       SELECT SUM(anggaran)
//       FROM sigapkumuh.data_cip_dev
//       WHERE anggaran IS NOT NULL AND anggaran > 0
//         AND nama_kabkota IS NOT NULL AND nama_kabkota <> ''
//         AND nama_kec IS NOT NULL AND nama_kec <> ''
//         AND nama_kel IS NOT NULL AND nama_kel <> ''
//         AND nama_rw IS NOT NULL AND nama_rw <> ''
//         AND nama_kegiatan IS NOT NULL AND nama_kegiatan <> ''
//         AND volume IS NOT NULL
//         AND satuan IS NOT NULL AND satuan <> ''
//     `);
//     const total = result.rows[0].sum ? parseFloat(result.rows[0].sum) : 0;
//     res.json({ total_anggaran: total });
//   } catch (error) {
//     console.error('Error fetching Total Anggaran:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });


// === 3. Jumlah Kegiatan CIP (tahun 2024 dan nama_kegiatan tidak kosong) ===
router.get('/jumlahkegiatancip', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) 
      FROM sigapkumuh.data_cip_dev 
      WHERE tahun = '2024'
        AND nama_kegiatan IS NOT NULL 
        AND nama_kegiatan <> ''
    `);
    res.json({ jumlah_cip: parseInt(result.rows[0].count, 10) });
  } catch (error) {
    console.error('Error fetching Kegiatan CIP:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// === 4. Jumlah Anggaran (tahun 2024, hanya jika semua kolom penting terisi) ===
router.get('/jumlahanggaran', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT SUM(anggaran)
      FROM sigapkumuh.data_cip_dev
      WHERE tahun = '2024'
        AND anggaran IS NOT NULL AND anggaran > 0
        AND nama_kabkota IS NOT NULL AND nama_kabkota <> ''
        AND nama_kec IS NOT NULL AND nama_kec <> ''
        AND nama_kel IS NOT NULL AND nama_kel <> ''
        AND nama_rw IS NOT NULL AND nama_rw <> ''
        AND nama_kegiatan IS NOT NULL AND nama_kegiatan <> ''
        AND volume IS NOT NULL
        AND satuan IS NOT NULL AND satuan <> ''
    `);
    const total = result.rows[0].sum ? parseFloat(result.rows[0].sum) : 0;
    res.json({ total_anggaran: total });
  } catch (error) {
    console.error('Error fetching Total Anggaran:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




module.exports = router;
