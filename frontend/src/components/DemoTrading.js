import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000';

const SYMBOLS = [
  { label: 'Volatility 10',   value: 'R_10' },
  { label: 'Volatility 25',   value: 'R_25' },
  { label: 'Volatility 50',   value: 'R_50' },
  { label: 'Volatility 75',   value: 'R_75' },
  { label: 'Volatility 100',  value: 'R_100' }
];

export default function DemoTrading({ token }) {
  const [wallet, setWallet] = useState({ balance: 5400, wins: 0, losses: 0, totalWon: 0, totalLost: 0, totalDeposited: 5400 });
  const [trades, setTrades] = useState([]);
  const [form, setForm] = useState({ symbol: 'R_100', side: 'BUY', amount: 50, duration: 3 });
  const [placing, setPlacing] = useState(false);
  const [toast, setToast] = useState(null);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = async () => {
    try {
      const [w, t] = await Promise.all([
        axios.get(`${API}/api/virtual/wallet`, authHeader),
        axios.get(`${API}/api/virtual/trades`, authHeader)
      ]);
      setWallet(w.data);
      setTrades(t.data || []);
    } catch (e) {
      console.error('Fetch failed:', e.message);
    }
  };

  const placeTrade = async () => {
    setPlacing(true);
    try {
      const res = await axios.post(`${API}/api/virtual/trade`, form, authHeader);
      setWallet(res.data.wallet);
      setToast({ type: 'info', message: `Trade placed: ${form.side} $${form.amount} on ${form.symbol}` });

      const tradeId = res.data.trade._id;
      const delay = form.duration * 1000;

      setTimeout(async () => {
        try {
          const resolveRes = await axios.post(`${API}/api/virtual/resolve/${tradeId}`, {}, authHeader);
          setWallet(resolveRes.data.wallet);
          const won = resolveRes.data.trade.status === 'won';
          setToast({
            type: won ? 'win' : 'loss',
            message: won
              ? `WIN! +$${resolveRes.data.trade.profitLoss.toFixed(2)}`
              : `LOSS -$${Math.abs(resolveRes.data.trade.profitLoss).toFixed(2)}`
          });
          setTimeout(() => setToast(null), 4000);
          fetchAll();
        } catch (e) {
          console.error('Resolve failed:', e.message);
        }
      }, delay);
    } catch (e) {
      setToast({ type: 'loss', message: e.response?.data?.error || 'Trade failed' });
      setTimeout(() => setToast(null), 4000);
    }
    setPlacing(false);
  };

  const resetWallet = async () => {
    if (!window.confirm('Reset your demo wallet back to $5,400? All trades will be deleted.')) return;
    try {
      const res = await axios.post(`${API}/api/virtual/reset`, {}, authHeader);
      setWallet(res.data.wallet);
      setTrades([]);
      setToast({ type: 'info', message: 'Wallet reset to $5,400' });
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      console.error(e.message);
    }
  };

  const totalTrades = wallet.wins + wallet.losses;
  const winRate = totalTrades ? ((wallet.wins / totalTrades) * 100).toFixed(1) : '0.0';
  const pnl = wallet.balance - wallet.totalDeposited;

  return (
    <div className="demo-page">
      <h1>Demo Trading Simulator</h1>
      <p className="demo-subtitle">
        Practice trading with virtual money. No real funds involved. Perfect for testing strategies.
      </p>

      {toast && (
        <div className={`demo-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="demo-stats">
        <div className="demo-stat primary">
          <div className="demo-stat-label">Virtual Balance</div>
          <div className="demo-stat-value">${wallet.balance.toFixed(2)}</div>
          <div className={`demo-stat-change ${pnl >= 0 ? 'pos' : 'neg'}`}>
            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} from start
          </div>
        </div>
        <div className="demo-stat">
          <div className="demo-stat-label">Win Rate</div>
          <div className="demo-stat-value">{winRate}%</div>
          <div className="demo-stat-change">{wallet.wins}W / {wallet.losses}L</div>
        </div>
        <div className="demo-stat">
          <div className="demo-stat-label">Total Won</div>
          <div className="demo-stat-value pos">+${wallet.totalWon.toFixed(2)}</div>
        </div>
        <div className="demo-stat">
          <div className="demo-stat-label">Total Lost</div>
          <div className="demo-stat-value neg">-${wallet.totalLost.toFixed(2)}</div>
        </div>
      </div>

      <div className="demo-panel">
        <h2>Place a Virtual Trade</h2>
        <div className="demo-form">
          <div className="demo-field">
            <label>Symbol</label>
            <select value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })}>
              {SYMBOLS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="demo-field">
            <label>Direction</label>
            <select value={form.side} onChange={e => setForm({ ...form, side: e.target.value })}>
              <option value="BUY">BUY (Rise)</option>
              <option value="SELL">SELL (Fall)</option>
            </select>
          </div>
          <div className="demo-field">
            <label>Amount ($)</label>
            <input type="number" min="1" max={wallet.balance}
              value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 1 })} />
          </div>
          <div className="demo-field">
            <label>Duration (sec)</label>
            <input type="number" min="3" max="60"
              value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 3 })} />
          </div>
          <button className="demo-submit" onClick={placeTrade} disabled={placing || form.amount > wallet.balance}>
            {placing ? 'Placing...' : `Place ${form.side} for $${form.amount}`}
          </button>
        </div>

        <div className="demo-hint">
          <span>Trades resolve after {form.duration}s. Win rate ~55%, payout 1.9x.</span>
          <button className="demo-reset" onClick={resetWallet}>Reset Wallet</button>
        </div>
      </div>

      <div className="demo-trades">
        <h2>Recent Trades</h2>
        {trades.length === 0 ? (
          <p className="demo-empty">No trades yet. Place your first virtual trade above.</p>
        ) : (
          <table className="demo-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Symbol</th>
                <th>Side</th>
                <th>Amount</th>
                <th>P/L</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {trades.map(t => (
                <tr key={t._id}>
                  <td>{new Date(t.createdAt).toLocaleTimeString()}</td>
                  <td>{t.symbol}</td>
                  <td className={t.side === 'BUY' ? 'buy' : 'sell'}>{t.side}</td>
                  <td>${t.amount}</td>
                  <td className={t.profitLoss >= 0 ? 'pos' : 'neg'}>
                    {t.profitLoss != null
                      ? `${t.profitLoss >= 0 ? '+' : ''}$${t.profitLoss.toFixed(2)}`
                      : '--'}
                  </td>
                  <td className={t.status === 'won' ? 'pos' : t.status === 'lost' ? 'neg' : ''}>
                    {t.status === 'pending' ? 'Pending' : t.status === 'won' ? 'Won' : 'Lost'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}