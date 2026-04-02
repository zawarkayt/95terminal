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

// Инициализация БД: теперь карта уникальна для каждого
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        card_number VARCHAR(6) UNIQUE NOT NULL,
        balance DECIMAL(15, 2) DEFAULT 0.00,
        is_terminal BOOLEAN DEFAULT FALSE
      );
    `);
    console.log("Bank System Online! ^_^");
  } catch (err) { console.error(err); }
};
initDB();

// Создать новый аккаунт (Банк)
app.post('/api/register', async (req, res) => {
  const newCard = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    await pool.query('INSERT INTO wallets (card_number, balance) VALUES ($1, 100.00)', [newCard]);
    res.json({ card_number: newCard, balance: 100.00 });
  } catch (e) { res.status(500).json({error: "Try again"}); }
});

// Получить инфо по номеру карты
app.get('/api/wallet/:card', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM wallets WHERE card_number = $1', [req.params.card]);
  if (rows.length) res.json(rows[0]);
  else res.status(404).json({ error: "Card not found! Ошибка NFC!" });
});

// Транзакция (Списание через терминал)
app.post('/api/pay', async (req, res) => {
  const { card, amount } = req.body;
  const { rows } = await pool.query('SELECT balance FROM wallets WHERE card_number = $1', [card]);
  
  if (!rows.length) return res.status(404).json({ error: "Карта не найдена в базе!" });
  
  let balance = parseFloat(rows[0].balance);
  let price = parseFloat(amount);
  
  if (balance < price) return res.status(400).json({ error: "Недостаточно милых деняк!" });
  
  const newBal = balance - price;
  await pool.query('UPDATE wallets SET balance = $1 WHERE card_number = $2', [newBal, card]);
  res.json({ success: true, newBalance: newBal });
});

app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'build', 'index.html')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Femboy Bank running on ${PORT}`));
