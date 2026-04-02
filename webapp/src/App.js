import React, { useState, useEffect } from 'react';
import './App.css';

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
    fetch(`/api/wallet/${MY_CARD}`)
      .then(r => r.json())
      .then(data => setBalance(data.balance || 0))
      .catch(() => setMsg("Connection error"));
  };

  const action = async (mode) => {
    if (!amount || amount <= 0) return;
    const res = await fetch(`/api/update`, {
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

  const handleNFC = async () => {
    setMsg("Scanning NFC...");
    if ('NDEFReader' in window) {
      try {
        const ndef = new window.NDEFReader();
        await ndef.scan();
        ndef.onreading = () => action('pay');
      } catch (e) { setMsg("NFC Error: " + e); }
    } else {
      setTimeout(() => action('pay'), 1000); // Эмуляция для тестов
    }
  };

  return (
    <div className="app-container">
      <div className="glass-card">
        <div className="header-pink">{isIphone ? "💖 Admin Hub" : "📟 Terminal"}</div>
        <div className="balance-box">
          <p>Balance</p>
          <h1>{parseFloat(balance).toFixed(2)} $</h1>
        </div>
        <input 
          type="number" 
          placeholder="Amount..." 
          value={amount} 
          onChange={e => setAmount(e.target.value)}
        />
        {isIphone ? (
          <div className="btn-stack">
            <button className="btn add" onClick={() => action('add')}>Add</button>
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
