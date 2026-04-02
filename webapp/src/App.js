import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = "ТВОЯ_ССЫЛКА_ОТ_RAILWAY"; // Замени после деплоя бэкенда
const MY_CARD = "123456";

function App() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [isIphone, setIsIphone] = useState(false);
  const [msg, setMsg] = useState('System ready');

  useEffect(() => {
    if (navigator.userAgent.includes('iPhone')) setIsIphone(true);
    refresh();
  }, []);

  const refresh = () => {
    fetch(`${API_URL}/api/wallet/${MY_CARD}`)
      .then(r => r.json())
      .then(data => setBalance(data.balance))
      .catch(e => console.log("Error fetching balance"));
  };

  const action = async (mode) => {
    if (!amount) return;
    const res = await fetch(`${API_URL}/api/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card: MY_CARD, amount, mode })
    });
    if (res.ok) {
      setAmount('');
      refresh();
      setMsg(mode === 'add' ? 'Added! ^_^' : 'Paid! Nya~');
    } else {
      setMsg('Error/No funds');
    }
  };

  // Эмуляция чтения NFC (для веба полноценный NFC сложен, используем кнопку)
  const handleNFC = () => {
    setMsg("Scanning NFC...");
    setTimeout(() => action('pay'), 1500); 
  };

  return (
    <div className="app-container">
      <div className="glass-card">
        <div className="header-pink"> {isIphone ? "💖 Admin Hub" : "📟 NFC Terminal"} </div>
        
        <div className="balance-box">
          <p>Current Balance</p>
          <h1>{parseFloat(balance).toFixed(2)} $</h1>
        </div>

        <input 
          type="number" 
          placeholder="Enter amount..." 
          value={amount} 
          onChange={e => setAmount(e.target.value)}
        />

        {isIphone ? (
          <div className="btn-stack">
            <button className="btn add" onClick={() => action('add')}>Add Money</button>
            <button className="btn sub" onClick={() => action('pay')}>Deduct</button>
          </div>
        ) : (
          <button className="btn nfc" onClick={handleNFC}>TAP NFC TAG</button>
        )}

        <p className="footer-msg">{msg}</p>
      </div>
    </div>
  );
}

export default App;
