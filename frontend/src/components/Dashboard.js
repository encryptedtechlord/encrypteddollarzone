import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000';

export default function Dashboard({ token }) {
  const [balance, setBalance] = useState({ balance: 0, connected: false });
  const [trades, setTrades] = useState([]);
  const [summary, setSummary] = useState({ totalTrades: 0, totalProfit: 0, winRate: 0, openPositions: 0 });
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  const username = localStorage.getItem('username') || 'Trader';

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchAll = async () => {
    try {
      const [balRes, trdRes, sumRes, sigRes] = await Promise.allSettled([
        axios.get(`${API}/api/trading/balance`, authHeader),
        axios.get(`${API}/api/trading/trades`, authHeader),
        axios.get(`${API}/api/trading/summary`, authHeader),
        axios.get(`${API}/api/trading/public-signals`, authHeader)
      ]);

      if (balRes.status === 'fulfilled') setBalance(balRes.value.data);
      if (trdRes.status === 'fulfilled') setTrades(trdRes.value.data || []);
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data || {});
      if (sigRes.status === 'fulfilled') setSignals(sigRes.value.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err.message);
    }
    setLoading(false);
  };

  const connectDeriv = () => {
    window.location.href = `${API}/api/auth/deriv/login`;
  };

  return (
    <div className="dash-page">
      {/* Greeting */}
      <div className="dash-greeting">
        <div>
          <h1>Welcome back, {username} 👋</h1>
          <p className="dash-subtext">Here's what's happening with your account today.</p>
        </div>
        <div className="dash-actions">
          <a className="dash-action-btn" href="/charts">📈 Open Charts</a>
        </div>
      </div>

      {/* Connect Deriv banner — only if not connected */}
      {!balance.connected && (
        <div className="dash-banner">
          <div className="dash-banner-left">
            <div className="dash-banner-title">Connect your Deriv account</div>
            <div className="dash-banner-desc">
              Link your Deriv account to view your balance and analytics. Your credentials stay with Deriv — we only read your balance.
            </div>
          </div>
          <button className="dash-banner-btn" onClick={connectDeriv}>
            Connect Deriv →
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div className="dash-stats">
        <div className="dash-stat">
          <div className="dash-stat-label">Deriv Balance</div>
          <div className="dash-stat-value">
            {balance.connected ? `$${Number(balance.balance).toFixed(2)}` : '—'}
          </div>
          <div className={`dash-stat-badge ${balance.connected ? 'ok' : 'off'}`}>
            {balance.connected ? '● Connected' : '○ Not linked'}
          </div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-label">Total P/L</div>
          <div className={`dash-stat-value ${summary.totalProfit >= 0 ? 'pos' : 'neg'}`}>
            ${(summary.totalProfit || 0).toFixed(2)}
          </div>
          <div className="dash-stat-badge">All time</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-label">Win Rate</div>
          <div className="dash-stat-value">{summary.winRate || 0}%</div>
          <div className="dash-stat-badge">Last 100 trades</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-label">Open Positions</div>
          <div className="dash-stat-value">{summary.openPositions || 0}</div>
          <div className="dash-stat-badge">{summary.totalTrades || 0} total trades</div>
        </div>
      </div>

      {/* Two-column layout: Signals + Recent Trades */}
      <div className="dash-grid">
        {/* Signals feed */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h2>📡 Live Signals</h2>
            <span className="dash-card-sub">{signals.length} active</span>
          </div>
          <div className="dash-card-body">
            {signals.length === 0 ? (
              <div className="dash-empty">No active signals right now. Check back soon.</div>
            ) : (
              signals.slice(0, 6).map((s) => (
                <div key={s._id} className="signal-row">
                  <div className={`signal-badge ${s.action.toLowerCase()}`}>
                    {s.action}
                  </div>
                  <div className="signal-info">
                    <div className="signal-symbol">{s.symbol}</div>
                    <div className="signal-meta">Strength {s.strength}/10</div>
                  </div>
                  <div className="signal-expiry">
                    {new Date(s.expiresAt).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent trades */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h2>📊 Recent Trades</h2>
            <span className="dash-card-sub">Last {Math.min(trades.length, 8)}</span>
          </div>
          <div className="dash-card-body">
            {loading ? (
              <div className="dash-empty">Loading...</div>
            ) : trades.length === 0 ? (
              <div className="dash-empty">
                No trades yet. Place trades on Deriv — they'll appear here once linked.
              </div>
            ) : (
              trades.slice(0, 8).map((t) => (
                <div key={t._id} className="trade-row">
                  <div className={`trade-side ${t.side === 'BUY' ? 'buy' : 'sell'}`}>
                    {t.side}
                  </div>
                  <div className="trade-info">
                    <div className="trade-symbol">{t.symbol}</div>
                    <div className="trade-meta">${t.amount} · {t.status}</div>
                  </div>
                  <div className={`trade-pl ${t.profitLoss >= 0 ? 'pos' : 'neg'}`}>
                    {t.profitLoss != null ? `$${t.profitLoss.toFixed(2)}` : '—'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="dash-note">
        Encrypted Dollar Zone is an analytics dashboard. Trades are executed on Deriv. We do not hold your funds.
      </div>
    </div>
  );
}