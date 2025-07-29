const { Pool } = require('pg');
require('dotenv').config(); // ⬅️ path langsung

// console.log('ENV Loaded:', {
//   user: process.env.PG_USER,
//   host: process.env.PG_HOST,
//   password: process.env.PG_PASSWORD,
//   database: process.env.PG_DATABASE,
//   port: process.env.PG_PORT,
// });

const pool = new Pool({
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
  user: process.env.PG_USER,
  password: String(process.env.PG_PASSWORD),
  database: process.env.PG_DATABASE,
});

// Tes koneksi
pool.connect()
  .then(client => {
    console.log('✅ Koneksi database berhasil');
    client.release();
  })
  .catch(err => {
    console.error('❌ Gagal terkoneksi ke database:', err.message);
  });

module.exports = pool;
