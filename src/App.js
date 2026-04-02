import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [myCard, setMyCard] = useState(localStorage.getItem('card_number') || null);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('Nyan Bank Active');

  // Определение устройств
  const ua = navigator.userAgent;
  const isSamsungTerminal = ua.includes('SM-A20') || ua.includes('Samsung'); 
  const isMyIPhone = ua.includes('iPhone');

  useEffect(() => {
    if (myCard) fetchBalance();
  }, [myCard]);

  const fetchBalance = () => {
    fetch(`/api/wallet/${myCard}`).then(r => r.json()).then(data => {
      if (data.card_number) setBalance(data.balance);
      else setMyCard(null);
    });
  };

  const createAcc = async () => {
    const res = await fetch('/api/register', { method: 'POST' });
    const data = await res.json();
    localStorage.setItem('card_number', data.card_number);
    setMyCard(data.card_number);
    setBalance(data.balance);
  };

  const handleAdmin = async (mode) => {
    await fetch('/api/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card: myCard, amount, mode })
    });
    setAmount('');
    fetchBalance();
  };

  const payNFC = async () => {
    if (!amount) return setStatus("Введите сумму!");
    setStatus("Приложите карту (NFC)...");
    
    if ('NDEFReader' in window) {
      try {
        const ndef = new window.NDEFReader();
        await ndef.scan();
        ndef.onreading = async ({ message }) => {
          const cardNum = new TextDecoder().decode(message.records[0].data);
          const res = await fetch('/api/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ card: cardNum, amount, mode: 'pay' })
          });
          if (res.ok) setStatus("Оплачено! Мяу! ✨");
          else setStatus("Ошибка платежа");
          setAmount('');
        };
      } catch (e) { setStatus("NFC Error"); }
    } else {
      const test = prompt("NFC не найден. Номер карты:");
      if (test) {
        const res = await fetch('/api/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ card: test, amount, mode: 'pay' })
        });
        setStatus(res.ok ? "Успех (ручной)" : "Ошибка");
      }
    }
  };

  return (
    <div className="box">
      <div className="glass">
        {isSamsungTerminal ? (
          <div className="terminal-ui">
            <h2>📟 TERMINAL A20e</h2>
            <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
            <button className="btn pink" onClick={payNFC}>ОПЛАТИТЬ</button>
            <p>{status}</p>
          </div>
        ) : (
          <div className="user-ui">
            {!myCard ? (
              <button className="btn pink" onClick={createAcc}>СОЗДАТЬ КАРТУ</button>
            ) : (
              <>
                <h2>{isMyIPhone ? "👑 ADMIN" : "💖 USER"}</h2>
                <div className="card-plate">
                  <small>NUMBER</small>
                  <div>{myCard}</div>
                </div>
                <div className="money">{parseFloat(balance).toFixed(2)} $</div>
                
                {isMyIPhone && (
                  <div className="admin-zone">
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                    <div className="row">
                      <button onClick={() => handleAdmin('add')}>+</button>
                      <button onClick={() => handleAdmin('pay')}>-</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
