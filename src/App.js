import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [myCard, setMyCard] = useState(localStorage.getItem('card_number') || null);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('System Active');

  const isSamsung = navigator.userAgent.includes('SM-A20');
  const isIPhone = navigator.userAgent.includes('iPhone');

  useEffect(() => {
    if (myCard) fetchBalance();
  }, [myCard]);

  const fetchBalance = () => {
    fetch(`/api/wallet/${myCard}`)
      .then(r => r.json())
      .then(data => data.card_number ? setBalance(data.balance) : setMyCard(null));
  };

  const createAccount = async () => {
    const res = await fetch('/api/register', { method: 'POST' });
    const data = await res.json();
    localStorage.setItem('card_number', data.card_number);
    setMyCard(data.card_number);
    setBalance(data.balance);
  };

  const handleUpdate = async (mode) => {
    const res = await fetch('/api/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card: myCard, amount, mode })
    });
    if (res.ok) { setAmount(''); fetchBalance(); setStatus("Success! ✨"); }
  };

  const scanNFC = async () => {
    setStatus("Scanning...");
    if ('NDEFReader' in window) {
      try {
        const ndef = new window.NDEFReader();
        await ndef.scan();
        ndef.onreading = async ({ message }) => {
          const cardFromTag = new TextDecoder().decode(message.records[0].data);
          const res = await fetch('/api/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ card: cardFromTag, amount, mode: 'pay' })
          });
          setStatus(res.ok ? "Paid! 🌸" : "Error/No Funds");
        };
      } catch (e) { setStatus("NFC Error"); }
    } else {
      const manual = prompt("No NFC. Enter Card #:");
      if(manual) {
         const res = await fetch('/api/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ card: manual, amount, mode: 'pay' })
          });
          setStatus(res.ok ? "Manual Paid!" : "Error");
      }
    }
  };

  return (
    <div className="main-ui">
      <div className="card">
        {isSamsung ? (
          <div className="terminal">
            <h2>📟 TERMINAL</h2>
            <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
            <button className="btn pink" onClick={scanNFC}>SCAN NFC</button>
          </div>
        ) : (
          <div className="client">
            {!myCard ? (
              <button className="btn pink" onClick={createAccount}>CREATE BANK ACCOUNT</button>
            ) : (
              <>
                <h2>{isIPhone ? "👑 ADMIN" : "💖 USER"}</h2>
                <div className="card-box">
                   <small>CARD NUMBER</small>
                   <div className="num">{myCard}</div>
                </div>
                <div className="money">{parseFloat(balance).toFixed(2)} $</div>
                {isIPhone && (
                  <div className="admin-controls">
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                    <button onClick={() => handleUpdate('add')}>+</button>
                    <button onClick={() => handleUpdate('pay')}>-</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        <div className="status">{status}</div>
      </div>
    </div>
  );
}

export default App;
