const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Нужно для Railway
});

// Функция для авто-создания таблицы
const initDB = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS wallets (
      id SERIAL PRIMARY KEY,
      card_number VARCHAR(6) UNIQUE NOT NULL,
      balance DECIMAL(15, 2) DEFAULT 0.00
    );
  `;
  try {
    await pool.query(queryText);
    console.log("Database initialized, nya~");
    
    // Создаем тестовую карту, если её нет
    await pool.query(`
      INSERT INTO wallets (card_number, balance) 
      VALUES ('123456', 1000.00) 
      ON CONFLICT (card_number) DO NOTHING;
    `);
  } catch (err) {
    console.error("DB Init Error:", err);
  }
};

initDB();

// Маршрут: Получить инфо по карте
app.get('/api/wallet/:card', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM wallets WHERE card_number = $1', [req.params.card]);
    rows.length ? res.json(rows[0]) : res.status(404).send('Not found');
  } catch (err) { res.status(500).json(err); }
});

// Маршрут: Изменение баланса
app.post('/api/update', async (req, res) => {
  const { card, amount, mode } = req.body; // mode: 'add' или 'pay'
  try {
    const { rows } = await pool.query('SELECT balance FROM wallets WHERE card_number = $1', [card]);
    if (!rows.length) return res.status(404).send('No card');

    let current = parseFloat(rows[0].balance);
    let change = parseFloat(amount);
    
    if (mode === 'pay') {
      if (current < change) return res.status(400).send('Low balance!');
      current -= change;
    } else {
      current += change;
    }

    await pool.query('UPDATE wallets SET balance = $1 WHERE card_number = $2', [current, card]);
    res.json({ success: true, newBalance: current });
  } catch (err) { res.status(500).json(err); }
});

app.listen(process.env.PORT || 5000, () => console.log('Server cutely running!'));
