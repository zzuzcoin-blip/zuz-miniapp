import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

const API_URL = import.meta.env.VITE_API_URL || 'https://zuz-backend.onrender.com';

function App() {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [ethAmount, setEthAmount] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Telegram WebApp
  const tg = window.Telegram?.WebApp;
  
  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      const initData = tg.initDataUnsafe;
      if (initData?.user) {
        loadUser(initData.user.id);
      }
    }
  }, []);
  
  const loadUser = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/user/${userId}`);
      const data = await res.json();
      setUser({ ...data, userId });
      setBalance(data.balance_zuz || 0);
    } catch (e) {
      console.error(e);
    }
  };
  
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        
        if (user && user.userId) {
          await fetch(`${API_URL}/api/user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.userId,
              walletAddress: accounts[0],
              referrerId: null
            })
          });
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      alert('Установите MetaMask или Trust Wallet');
    }
  };
  
  const buyTokens = async () => {
    if (!account) {
      alert('Сначала подключите кошелёк');
      return;
    }
    
    const amount = parseFloat(ethAmount);
    if (amount < 0.01) {
      alert('Минимум 0.01 ETH');
      return;
    }
    
    setLoading(true);
    
    try {
      const web3Instance = new Web3(window.ethereum);
      const wei = web3Instance.utils.toWei(amount.toString(), 'ether');
      
      // Здесь вызывается ваш контракт пресейла
      const tx = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: '0x8CdeBa5Db0a4046D8BBC655244173750c7DFd553',
          value: wei,
          data: '0x'
        }]
      });
      
      // Отправляем на бэкенд
      await fetch(`${API_URL}/api/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          ethAmount: amount,
          txHash: tx
        })
      });
      
      alert(`✅ Куплено ${amount / 0.0001} ZUZ!`);
      loadUser(user.userId);
      setEthAmount('');
      
    } catch (e) {
      console.error(e);
      alert('Ошибка транзакции');
    } finally {
      setLoading(false);
    }
  };
  
  const sageLevel = () => {
    if (balance >= 250000) return { name: '👑 Immortality', bonus: 30 };
    if (balance >= 100000) return { name: '⚔️ Power', bonus: 25 };
    if (balance >= 50000) return { name: '☯️ Harmony', bonus: 20 };
    if (balance >= 25000) return { name: '⚡ Innovation', bonus: 15 };
    if (balance >= 10000) return { name: '🛡️ Protection', bonus: 10 };
    if (balance >= 5000) return { name: '🌾 Prosperity', bonus: 5 };
    if (balance >= 1000) return { name: '📜 Wisdom', bonus: 2 };
    return { name: '🌱 Novice', bonus: 0 };
  };
  
  const sage = sageLevel();
  const progress = Math.min((balance / (sage.name === '🌱 Novice' ? 1000 : 
    sage.name === '📜 Wisdom' ? 5000 :
    sage.name === '🌾 Prosperity' ? 10000 :
    sage.name === '🛡️ Protection' ? 25000 :
    sage.name === '⚡ Innovation' ? 50000 :
    sage.name === '☯️ Harmony' ? 100000 :
    sage.name === '⚔️ Power' ? 250000 : 1)) * 100, 100);
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] p-4 pt-12 text-black">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">ZUZ UNIVERSE</h1>
            <p className="text-sm opacity-80">Time &gt; Money</p>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-80">Ранг</div>
            <div className="font-bold">{sage.name}</div>
          </div>
        </div>
      </div>
      
      {/* Balance Card */}
      <div className="bg-[#1A1A1A] m-4 p-4 rounded-2xl border border-[#333]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Баланс ZUZ</span>
          <span className="text-xs text-[#D4AF37]">+{sage.bonus}% бонус</span>
        </div>
        <div className="text-4xl font-bold text-[#D4AF37]">
          {balance.toLocaleString()}
        </div>
        <div className="mt-3">
          <div className="bg-[#333] h-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] h-full rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{sage.name}</span>
            <span>↓ следующий уровень</span>
          </div>
        </div>
      </div>
      
      {/* Buy Section */}
      <div className="bg-[#1A1A1A] m-4 p-4 rounded-2xl border border-[#333]">
        <h2 className="text-lg font-bold mb-3">🚀 Купить ZUZ</h2>
        <div className="text-sm text-gray-400 mb-3">
          1 ZUZ = 0.0001 ETH | Мин. 0.01 ETH
        </div>
        
        {!account ? (
          <button
            onClick={connectWallet}
            className="w-full bg-[#D4AF37] text-black py-3 rounded-xl font-bold"
          >
            🔌 Подключить кошелёк
          </button>
        ) : (
          <>
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
                placeholder="Сумма в ETH"
                className="flex-1 bg-[#222] border border-[#333] rounded-xl px-4 py-3 text-white"
              />
              <button
                onClick={buyTokens}
                disabled={loading}
                className="bg-[#D4AF37] text-black px-6 rounded-xl font-bold disabled:opacity-50"
              >
                {loading ? '⏳' : 'Купить'}
              </button>
            </div>
            <div className="text-xs text-gray-500 text-center break-all">
              {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          </>
        )}
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 m-4">
        <div className="bg-[#1A1A1A] p-3 rounded-xl border border-[#333] text-center">
          <div className="text-gray-400 text-xs">Стейкинг</div>
          <div className="text-[#D4AF37] font-bold">25% APY</div>
        </div>
        <div className="bg-[#1A1A1A] p-3 rounded-xl border border-[#333] text-center">
          <div className="text-gray-400 text-xs">Застейкано</div>
          <div className="text-[#D4AF37] font-bold">0 ZUZ</div>
        </div>
      </div>
      
      {/* Bottom Menu */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-[#333] flex justify-around py-3">
        <button className="text-[#D4AF37] text-sm">🏠 Главная</button>
        <button className="text-gray-400 text-sm" onClick={() => window.location.reload()}>
          🔄 Обмен
        </button>
        <button className="text-gray-400 text-sm" onClick={() => alert(`Ваша реферальная ссылка:\nhttps://t.me/zuzuniverse_bot?start=ref_${user?.userId}`)}>
          👥 Партнёры
        </button>
      </div>
    </div>
  );
}

export default App;
