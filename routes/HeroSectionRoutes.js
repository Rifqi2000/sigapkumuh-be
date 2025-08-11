const express = require('express');
const router = express.Router();
const pool = require('../config/db');


// === 1. Jumlah Total RW Kumuh ===
router.get('/jumlahrwkumuh', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) 
      FROM sigapkumuh.rwkumuh 
      WHERE wadmkk IS NOT NULL AND wadmkk <> ''
        AND wadmkc IS NOT NULL AND wadmkc <> ''
        AND wadmkd IS NOT NULL AND wadmkd <> ''
        AND wadmrw IS NOT NULL AND wadmrw <> ''
    `);
    res.json({ jumlah_rw_kumuh: parseInt(result.rows[0].count, 10) });
  } catch (error) {
    console.error('Error fetching RW Kumuh:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// === 2. RW Kumuh per Wilayah (tanpa "Kota Adm." dan "Kab. Adm.") ===
router.get('/rwkumuh-per-wilayah', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        TRIM(
          REPLACE(REPLACE(wadmkk, 'Kota Adm. ', ''), 'Kab. Adm. ', '')
        ) AS wilayah,
        COUNT(*) AS jumlah_rw
      FROM sigapkumuh.rwkumuh
      WHERE wadmkk IS NOT NULL AND wadmkc IS NOT NULL 
        AND wadmkd IS NOT NULL AND wadmrw IS NOT NULL
      GROUP BY wadmkk
      ORDER BY wadmkk
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching RW per wilayah:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// === 3. Detail RW Kumuh berdasarkan Wilayah (tanpa "Kota Adm.") ===
router.get('/rwkumuh-detail', async (req, res) => {
  const { wilayah } = req.query;

  if (!wilayah) {
    return res.status(400).json({ error: 'Parameter wilayah wajib diisi' });
  }

  try {
    // Lakukan normalisasi parameter di backend agar cocok dengan wadmkk di DB
    const result = await pool.query(`
      SELECT wadmkc, wadmkd, wadmrw, keterangan
      FROM sigapkumuh.rwkumuh
      WHERE REPLACE(REPLACE(wadmkk, 'Kota Adm. ', ''), 'Kab. Adm. ', '') = $1
        AND wadmkc IS NOT NULL AND wadmkd IS NOT NULL AND wadmrw IS NOT NULL
      ORDER BY wadmkc, wadmkd, wadmrw
    `, [wilayah]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching detail RW:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
