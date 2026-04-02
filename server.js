const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        card_number VARCHAR(6) UNIQUE NOT NULL,
        balance DECIMAL(15, 2) DEFAULT 0.00
      );
      INSERT INTO wallets (card_number, balance) VALUES ('123456', 1000.00) ON CONFLICT DO NOTHING;
    `);
    console.log("DB Ready, nya~");
  } catch (err) { console.error(err); }
};
initDB();

app.get('/api/wallet/:card', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM wallets WHERE card_number = $1', [req.params.card]);
  res.json(rows[0] || { error: "Not found" });
});

app.post('/api/update', async (req, res) => {
  const { card, amount, mode } = req.body;
  const { rows } = await pool.query('SELECT balance FROM wallets WHERE card_number = $1', [card]);
  if(!rows.length) return res.status(404).json({error: "No card"});
  let current = parseFloat(rows[0].balance);
  let val = parseFloat(amount);
  if (mode === 'pay') {
    if (current < val) return res.status(400).json({error: "No money"});
    current -= val;
  } else {
    current += val;
  }
  await pool.query('UPDATE wallets SET balance = $1 WHERE card_number = $2', [current, card]);
  res.json({ success: true, newBalance: current });
});

app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server pink running on ${PORT}`));
