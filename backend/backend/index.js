import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Web3 } from 'web3';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Конфиг
const BOT_TOKEN = '8751544398:AAFgfYI853CQaZ-i0Uu48pMpIHzpPZvIDnI';
const PRESALE_ADDRESS = '0x8CdeBa5Db0a4046D8BBC655244173750c7DFd553';
const TOKEN_ADDRESS = '0x87D336511760583B11B87866654c6f7253c1cB0D';
const TOKEN_PRICE_ETH = 0.0001;
const RPC_URL = 'https://eth.llamarpc.com';

const web3 = new Web3(RPC_URL);

// Контракты
const PRESALE_ABI = [{"inputs":[],"name":"buyTokens","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"tokensSold","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"}];
const TOKEN_ABI = [{"inputs":[{"name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"stateMutability":"view","type":"function"}];

let db;

async function initDB() {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY,
      wallet_address TEXT,
      balance_zuz REAL DEFAULT 0,
      staked_zuz REAL DEFAULT 0,
      referrer_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referrer_id INTEGER,
      referred_id INTEGER,
      earned_zuz REAL DEFAULT 0
    );
  `);
  console.log('✅ Database ready');
}

// API
app.get('/api/user/:userId', async (req, res) => {
  const user = await db.get('SELECT * FROM users WHERE user_id = ?', req.params.userId);
  res.json(user || { balance_zuz: 0, staked_zuz: 0 });
});

app.post('/api/user', async (req, res) => {
  const { userId, walletAddress, referrerId } = req.body;
  
  let user = await db.get('SELECT * FROM users WHERE user_id = ?', userId);
  
  if (!user) {
    await db.run(
      'INSERT INTO users (user_id, wallet_address, referrer_id) VALUES (?, ?, ?)',
      userId, walletAddress, referrerId || null
    );
    
    if (referrerId) {
      await db.run(
        'INSERT INTO referrals (referrer_id, referred_id) VALUES (?, ?)',
        referrerId, userId
      );
    }
    
    user = await db.get('SELECT * FROM users WHERE user_id = ?', userId);
  }
  
  res.json(user);
});

app.post('/api/buy', async (req, res) => {
  const { userId, ethAmount, txHash } = req.body;
  const zuzAmount = ethAmount / TOKEN_PRICE_ETH;
  
  const user = await db.get('SELECT * FROM users WHERE user_id = ?', userId);
  
  if (user) {
    await db.run(
      'UPDATE users SET balance_zuz = balance_zuz + ? WHERE user_id = ?',
      zuzAmount, userId
    );
    
    // Реферальные 5%
    if (user.referrer_id) {
      const referrerBonus = zuzAmount * 0.05;
      await db.run(
        'UPDATE users SET balance_zuz = balance_zuz + ? WHERE user_id = ?',
        referrerBonus, user.referrer_id
      );
      await db.run(
        'UPDATE referrals SET earned_zuz = earned_zuz + ? WHERE referrer_id = ? AND referred_id = ?',
        referrerBonus, user.referrer_id, userId
      );
    }
  }
  
  res.json({ success: true, zuzAmount });
});

app.get('/api/referrals/:userId', async (req, res) => {
  const referrals = await db.all(
    'SELECT * FROM referrals WHERE referrer_id = ?',
    req.params.userId
  );
  res.json(referrals);
});

app.get('/api/price', (req, res) => {
  res.json({ price: TOKEN_PRICE_ETH, minPurchase: 0.01 });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  await initDB();
  console.log(`🚀 Backend running on port ${PORT}`);
});
