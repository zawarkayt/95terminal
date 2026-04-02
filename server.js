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

// Авто-создание таблиц
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        card_number VARCHAR(6) UNIQUE NOT NULL,
        balance DECIMAL(15, 2) DEFAULT 0.00
      );
    `);
    console.log("NyanBank Database Ready! 🐾");
  } catch (err) { console.error("DB Error:", err); }
};
initDB();

// Регистрация новой карты
app.post('/api/register', async (req, res) => {
  const newCard = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    await pool.query('INSERT INTO wallets (card_number, balance) VALUES ($1, 100.00)', [newCard]);
    res.json({ card_number: newCard, balance: 100.00 });
  } catch (e) { res.status(500).json({ error: "Retry registration" }); }
});

// Данные карты
app.get('/api/wallet/:card', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM wallets WHERE card_number = $1', [req.params.card]);
  if (rows.length) res.json(rows[0]);
  else res.status(404).json({ error: "Not found" });
});

// Универсальное обновление баланса (Pay/Add/Sub)
app.post('/api/update', async (req, res) => {
  const { card, amount, mode } = req.body;
  try {
    const { rows } = await pool.query('SELECT balance FROM wallets WHERE card_number = $1', [card]);
    if (!rows.length) return res.status(404).json({ error: "Card missing" });

    let current = parseFloat(rows[0].balance);
    let val = parseFloat(amount);

    if (mode === 'pay') {
      if (current < val) return res.status(400).json({ error: "No money, nya!" });
      current -= val;
    } else {
      current += val;
    }

    await pool.query('UPDATE wallets SET balance = $1 WHERE card_number = $2', [current, card]);
    res.json({ success: true, newBalance: current });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// Раздача React-приложения
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'build', 'index.html')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Pink server on port ${PORT}`));
