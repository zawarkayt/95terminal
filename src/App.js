import React, { useState, useEffect } from 'react';
import './App.css'; // <-- ВОТ ЭТА СТРОЧКА ВАЖНА ДЛЯ СТИЛЕЙ!

function App() {
  const [myCard, setMyCard] = useState(localStorage.getItem('card_number') || null);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('Nyan Bank Active');
  const [forceTerminal, setForceTerminal] = useState(localStorage.getItem('force_terminal') === 'true');

  // ДЕТЕКТОР УСТРОЙСТВ (добавил A202 - это частый код для A20e)
  const ua = navigator.userAgent;
  const isSamsungTerminal = forceTerminal || ua.includes('SM-A20') || ua.includes('A202') || ua.includes('SamsungBrowser'); 
  const isMyIPhone = ua.includes('iPhone');

  useEffect(() => {
    if (myCard) fetchBalance();
  }, [myCard]);

  const fetchBalance = () => {
    fetch(`/api/wallet/${myCard}`).then(r => r.json()).then(data => {
      if (data.card_number) setBalance(data.balance);
      else {
        localStorage.removeItem('card_number');
        setMyCard(null);
      }
    }).catch(() => setStatus("Ошибка сети"));
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
          setStatus(res.ok ? "Оплачено! Мяу! ✨" : "Ошибка платежа");
          setAmount('');
        };
      } catch (e) { setStatus("NFC Error"); }
    } else {
      const test = prompt("NFC не работает тут. Введи номер карты вручную:");
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

  // Ручное включение терминала (если детектор тупит)
  const toggleTerminal = () => {
    const newState = !forceTerminal;
    setForceTerminal(newState);
    localStorage.setItem('force_terminal', newState);
  };

  return (
    <div className="box">
      <div className="glass">
        {isSamsungTerminal ? (
          <div className="terminal-ui">
            <h2>📟 TERMINAL A20e</h2>
            <input type="number" placeholder="Сумма: 0.00 $" value={amount} onChange={e => setAmount(e.target.value)} />
            <button className="btn pink" onClick={payNFC}>ОПЛАТИТЬ</button>
            <p>{status}</p>
            {/* Кнопка выхода из ручного терминала */}
            {forceTerminal && <button onClick={toggleTerminal} style={{marginTop: '20px', background: 'transparent', color: '#fff', border: '1px solid white'}}>Выйти из терминала</button>}
          </div>
        ) : (
          <div className="user-ui">
            {!myCard ? (
              <button className="btn pink" onClick={createAcc}>✨ СОЗДАТЬ КАРТУ</button>
            ) : (
              <>
                <h2>{isMyIPhone ? "👑 ADMIN" : "💖 USER"}</h2>
                <div className="card-plate">
                  <small>CARD NUMBER</small>
                  <div>{myCard}</div>
                </div>
                <div className="money">{parseFloat(balance).toFixed(2)} $</div>
                
                {isMyIPhone && (
                  <div className="admin-zone">
                    <input type="number" placeholder="Сумма" value={amount} onChange={e => setAmount(e.target.value)} />
                    <div className="row">
                      <button onClick={() => handleAdmin('add')}>+</button>
                      <button onClick={() => handleAdmin('pay')}>-</button>
                    </div>
                  </div>
                )}
              </>
            )}
            {/* СЕКРЕТНАЯ КНОПКА ДЛЯ ВКЛЮЧЕНИЯ ТЕРМИНАЛА */}
            <button onClick={toggleTerminal} style={{marginTop: '30px', background: 'none', border: 'none', color: 'gray', fontSize: '10px'}}>Force Terminal Mode</button>
          </div>
        )}
        
        {/* ДЕБАГ: Вывод инфы о браузере, чтобы понять почему он не узнал Самсунг */}
        <p style={{fontSize: '8px', color: 'gray', marginTop: '20px', wordBreak: 'break-all'}}>{navigator.userAgent}</p>
      </div>
    </div>
  );
}

export default App;
