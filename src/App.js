import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [myCard, setMyCard] = useState(localStorage.getItem('card_number') || null);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('Welcome~');
  
  const isSamsung = navigator.userAgent.includes('SM-A20'); // Детект терминала

  useEffect(() => {
    if (myCard) refreshBalance();
  }, [myCard]);

  const refreshBalance = () => {
    fetch(`/api/wallet/${myCard}`)
      .then(r => r.json())
      .then(data => setBalance(data.balance))
      .catch(() => setStatus("Ошибка связи"));
  };

  const registerBank = async () => {
    const res = await fetch('/api/register', { method: 'POST' });
    const data = await res.json();
    localStorage.setItem('card_number', data.card_number);
    setMyCard(data.card_number);
    setBalance(data.balance);
    setStatus("Карта создана! Запиши номер на NFC!");
  };

  const handleNFCPayment = async () => {
    setStatus("Приложите NFC тег...");
    try {
      const ndef = new window.NDEFReader();
      await ndef.scan();
      ndef.onreading = async ({ message }) => {
        const decoder = new TextDecoder();
        // Предполагаем, что на теге записан 6-значный номер текстом
        const cardFromTag = decoder.decode(message.records[0].data);
        
        const res = await fetch('/api/pay', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ card: cardFromTag, amount })
        });
        const result = await res.json();
        
        if (res.ok) setStatus(`Оплачено! Остаток: ${result.newBalance}$`);
        else setStatus("Ошибка: " + result.error);
      };
    } catch (e) {
      setStatus("NFC не найден. Введите номер вручную (тест):");
      const testCard = prompt("Введите номер карты с тега:");
      processManual(testCard);
    }
  };

  const processManual = async (c) => {
    const res = await fetch('/api/pay', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ card: c, amount })
    });
    const result = await res.json();
    setStatus(res.ok ? "Успех!" : "Ошибка: " + result.error);
  };

  return (
    <div className="app-container">
      <div className="glass-card">
        {isSamsung ? (
          <div className="terminal">
            <h2>📟 TERMINAL A20</h2>
            <input type="number" placeholder="Сумма к оплате" value={amount} onChange={e => setAmount(e.target.value)} />
            <button className="btn nfc" onClick={handleNFCPayment}>СЧИТАТЬ NFC</button>
          </div>
        ) : (
          <div className="user-bank">
            {!myCard ? (
              <button className="btn add" onClick={registerBank}>✨ ОТКРЫТЬ БАНК-АККАУНТ</button>
            ) : (
              <>
                <h2>💖 MY BANK</h2>
                <div className="card-info">
                  <p>CARD NUMBER</p>
                  <code>{myCard}</code>
                </div>
                <h1>{parseFloat(balance).toFixed(2)} $</h1>
                <p>Запиши этот номер на свой NFC тег!</p>
              </>
            )}
          </div>
        )}
        <p className="status-text">{status}</p>
      </div>
    </div>
  );
}

export default App;
