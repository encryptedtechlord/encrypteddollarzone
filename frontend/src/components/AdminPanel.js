import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000';

const emptySummary = { totalFees: 0, totalTurnover: 0, totalTrades: 0, averageFee: 0 };

export default function AdminPanel({ token }) {
  const [botConfig, setBotConfig] = useState({
    isActive: false,
    strategy: { type: 'signal_based', timeframe: '5m' },
    riskManagement: { maxTradeAmount: 100, minTradeAmount: 10 },
    signalSettings: { minStrength: 5, allowedSymbols: ['R_100'] }
  });
  const [signals, setSignals] = useState([]);
  const [newSignal, setNewSignal] = useState({ symbol: 'R_100', action: 'BUY', strength: 7, expiresAt: '' });
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [revenueStats, setRevenueStats] = useState({
    today: { summary: emptySummary, dailyBreakdown: [] },
    week: { summary: emptySummary, dailyBreakdown: [] },
    month: { summary: emptySummary, dailyBreakdown: [] },
    year: { summary: emptySummary, dailyBreakdown: [] },
    allTime: { totalRevenue: 0, totalTurnover: 0, totalTrades: 0, monthlyBreakdown: [] },
    topUsers: []
  });
  const [withdrawals, setWithdrawals] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('today');

  useEffect(() => {
    fetchBotConfig();
    fetchSignals();
    fetchUsers();
    fetchStats();
    fetchRevenueStats();
    fetchWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  // ---------- FETCH HELPERS ----------
  const fetchBotConfig = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/bot-config`, authHeader);
      if (res.data && Object.keys(res.data).length > 0) setBotConfig(res.data);
    } catch (e) { console.error('bot-config:', e.message); }
  };

  const fetchSignals = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/signals`, authHeader);
      setSignals(res.data || []);
    } catch (e) { console.error('signals:', e.message); }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/users`, authHeader);
      setUsers(res.data || []);
    } catch (e) { console.error('users:', e.message); }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/stats`, authHeader);
      setStats(res.data || {});
    } catch (e) { console.error('stats:', e.message); }
  };

  const fetchRevenueStats = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/revenue/dashboard`, authHeader);
      if (res.data) setRevenueStats(res.data);
    } catch (e) { console.error('revenue:', e.message); }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/withdrawals`, authHeader);
      setWithdrawals(res.data || []);
    } catch (e) { console.error('withdrawals:', e.message); }
  };

  // ---------- ACTIONS ----------
  const updateBotConfig = async () => {
    try {
      await axios.post(`${API}/api/admin/bot-config`, botConfig, authHeader);
      alert('Bot config updated');
      fetchBotConfig();
    } catch (e) {
      alert('Failed: ' + (e.response?.data?.error || e.message));
    }
  };

  const controlBot = async (action) => {
    try {
      await axios.post(`${API}/api/admin/bot-control`, { action }, authHeader);
      alert(`Bot ${action}ed`);
      fetchBotConfig();
    } catch (e) {
      alert('Failed: ' + (e.response?.data?.error || e.message));
    }
  };

  const createSignal = async () => {
    try {
      const payload = { ...newSignal };
      if (!payload.expiresAt) {
        payload.expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      }
      await axios.post(`${API}/api/admin/signals`, payload, authHeader);
      fetchSignals();
      setNewSignal({ symbol: 'R_100', action: 'BUY', strength: 7, expiresAt: '' });
      alert('Signal broadcast successfully');
    } catch (e) {
      console.error('Signal error:', e.response?.status, e.response?.data || e.message);
      alert('Failed (' + (e.response?.status || 'no response') + '): ' + (e.response?.data?.error || e.message));
    }
  };

  const deleteSignal = async (id) => {
    try {
      await axios.delete(`${API}/api/admin/signals/${id}`, authHeader);
      fetchSignals();
    } catch (e) {
      alert('Failed: ' + (e.response?.data?.error || e.message));
    }
  };

  const setMasterTrader = async (userId, isMaster) => {
    try {
      await axios.post(`${API}/api/admin/users/${userId}/set-master`, { isMaster }, authHeader);
      fetchUsers();
    } catch (e) {
      alert('Failed: ' + (e.response?.data?.error || e.message));
    }
  };

  const approveWithdrawal = async (id) => {
    try {
      await axios.post(`${API}/api/admin/withdrawals/${id}/approve`, {}, authHeader);
      fetchWithdrawals();
    } catch (e) {
      alert('Failed: ' + (e.response?.data?.error || e.message));
    }
  };

  const completeWithdrawal = async (id) => {
    const txId = prompt('Transaction ID:');
    if (!txId) return;
    try {
      await axios.post(`${API}/api/admin/withdrawals/${id}/complete`, { transactionId: txId }, authHeader);
      fetchWithdrawals();
    } catch (e) {
      alert('Failed: ' + (e.response?.data?.error || e.message));
    }
  };

  const rejectWithdrawal = async (id) => {
    const reason = prompt('Reason:');
    if (!reason) return;
    try {
      await axios.post(`${API}/api/admin/withdrawals/${id}/reject`, { reason }, authHeader);
      fetchWithdrawals();
    } catch (e) {
      alert('Failed: ' + (e.response?.data?.error || e.message));
    }
  };

  const exportRevenue = () => {
    window.location.href = `${API}/api/admin/revenue/export`;
  };

  const currentStats = revenueStats[selectedTimeframe] || { summary: emptySummary, dailyBreakdown: [] };

  return (
    <div className="admin-panel">
      <h1>Admin.Encrypted</h1>

      <div className="stats-grid">
        <div className="stat-card"><h3>Total Users</h3><div className="stat-value">{stats.totalUsers || 0}</div></div>
        <div className="stat-card"><h3>Total Trades</h3><div className="stat-value">{stats.totalTrades || 0}</div></div>
        <div className="stat-card"><h3>Total Volume</h3><div className="stat-value">${(stats.totalVolume || 0).toFixed(2)}</div></div>
      </div>

      <section className="card">
        <h2>💰 Revenue Dashboard (3% Platform Fee)</h2>
        <div className="timeframe-selector">
          {['today', 'week', 'month', 'year'].map(t => (
            <button key={t} onClick={() => setSelectedTimeframe(t)} className={selectedTimeframe === t ? 'active' : ''}>{t}</button>
          ))}
        </div>
        <div className="revenue-stats">
          <div className="revenue-card">
            <div className="revenue-label">Fees Collected</div>
            <div className="revenue-amount">${(currentStats.summary?.totalFees || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="revenue-card">
            <div className="revenue-label">Turnover</div>
            <div className="revenue-amount">${(currentStats.summary?.totalTurnover || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="revenue-card">
            <div className="revenue-label">Trades</div>
            <div className="revenue-amount">{currentStats.summary?.totalTrades || 0}</div>
          </div>
        </div>
        <div className="all-time-revenue">
          <h3>All Time Total</h3>
          <div className="all-time-amount">${(revenueStats.allTime?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <button onClick={exportRevenue} className="primary">Export CSV</button>
      </section>

      <section className="card">
        <h2>🤖 Bot Control</h2>
        <div className="bot-status">Status: {botConfig.isActive ? '🟢 ACTIVE' : '🔴 STOPPED'}</div>
        <div className="button-group">
          <button onClick={() => controlBot('start')} className="success">Start</button>
          <button onClick={() => controlBot('stop')} className="danger">Stop</button>
        </div>
        <div className="form-group">
          <label>Max Trade Amount ($)</label>
          <input type="number" value={botConfig.riskManagement?.maxTradeAmount || 100}
            onChange={e => setBotConfig({ ...botConfig, riskManagement: { ...botConfig.riskManagement, maxTradeAmount: parseFloat(e.target.value) } })} />
        </div>
        <div className="form-group">
          <label>Min Signal Strength (1-10)</label>
          <input type="number" min="1" max="10" value={botConfig.signalSettings?.minStrength || 5}
            onChange={e => setBotConfig({ ...botConfig, signalSettings: { ...botConfig.signalSettings, minStrength: parseInt(e.target.value) } })} />
        </div>
        <button onClick={updateBotConfig} className="primary">Save Config</button>
      </section>

      <section className="card">
        <h2>📡 Create Signal</h2>
        <div className="form-row">
          <select value={newSignal.symbol} onChange={e => setNewSignal({ ...newSignal, symbol: e.target.value })}>
            <option value="R_100">R_100</option>
            <option value="R_75">R_75</option>
            <option value="R_50">R_50</option>
          </select>
          <select value={newSignal.action} onChange={e => setNewSignal({ ...newSignal, action: e.target.value })}>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
          <input type="number" placeholder="Strength 1-10" value={newSignal.strength}
            onChange={e => setNewSignal({ ...newSignal, strength: parseInt(e.target.value) })} />
          <input type="datetime-local" onChange={e => setNewSignal({ ...newSignal, expiresAt: e.target.value })} />
          <button onClick={createSignal}>Broadcast</button>
        </div>
      </section>

      <section className="card">
        <h2>📢 Active Signals</h2>
        {signals.length === 0 ? <p>No active signals</p> : signals.map(s => (
          <div key={s._id} className="signal-item">
            <span className={`signal-action ${s.action.toLowerCase()}`}>{s.action}</span>
            <span>{s.symbol}</span>
            <span>Strength: {s.strength}/10</span>
            <button onClick={() => deleteSignal(s._id)} className="small danger">Delete</button>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>👥 User Management</h2>
        <table className="data-table">
          <thead>
            <tr><th>Username</th><th>Deriv ID</th><th>Role</th><th>Master</th><th>Status</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td>{u.username}</td>
                <td>{u.derivUserId || 'Not linked'}</td>
                <td>{u.role}</td>
                <td><button onClick={() => setMasterTrader(u._id, !u.isMaster)} className="small">{u.isMaster ? 'Remove' : 'Make Master'}</button></td>
                <td className={u.isActive ? 'active' : 'inactive'}>{u.isActive ? 'Active' : 'Suspended'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h3>Withdrawal Requests</h3>
        {withdrawals.length === 0 ? <p>No withdrawal requests</p> : (
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Amount</th><th>Method</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {withdrawals.map(w => (
                <tr key={w._id}>
                  <td>{new Date(w.createdAt).toLocaleString()}</td>
                  <td className="positive">${w.amount}</td>
                  <td>{w.method}</td>
                  <td className={w.status}>{w.status}</td>
                  <td>
                    {w.status === 'pending' && (
                      <>
                        <button onClick={() => approveWithdrawal(w._id)} className="small success">Approve</button>
                        <button onClick={() => rejectWithdrawal(w._id)} className="small danger">Reject</button>
                      </>
                    )}
                    {w.status === 'approved' && (
                      <button onClick={() => completeWithdrawal(w._id)} className="small primary">Complete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}