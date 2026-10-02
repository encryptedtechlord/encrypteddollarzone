import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './src/components/Signup';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import Charts from './components/Charts';
import DemoTrading from './components/DemoTrading';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [authView, setAuthView] = useState('login');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const urlRole = urlParams.get('role');

    if (urlToken) {
      localStorage.setItem('token', urlToken);
      localStorage.setItem('role', urlRole || 'user');
      setToken(urlToken);
      setRole(urlRole || 'user');
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  if (!token) {
    return authView === 'login'
      ? (
        <Login
          setToken={setToken}
          setRole={setRole}
          onSwitchToSignup={() => setAuthView('signup')}
        />
      )
      : (
        <Signup onSwitchToLogin={() => setAuthView('login')} />
      );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <span className="logo">🔐</span>
            <span className="brand-name">Encrypted Dollar Zone</span>
          </div>
          <div className="nav-menu">
            <a href="/dashboard">Dashboard</a>
            <a href="/charts">Charts</a>
            <a href="/demo">Demo</a>
            {role === 'admin' && <a href="/admin">Admin Panel</a>}
            <button
              className="logout-btn"
              onClick={() => {
                localStorage.clear();
                window.location.href = '/';
              }}
            >
              Logout
            </button>
          </div>
        </nav>
        <div className="container">
          <Routes>
            <Route path="/dashboard" element={<Dashboard token={token} />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="/demo" element={<DemoTrading token={token} />} />
            <Route
              path="/admin"
              element={
                role === 'admin' ? <AdminPanel token={token} /> : <Navigate to="/dashboard" />
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
        <div className="disclaimer">
          Encrypted Dollar Zone — Analytics dashboard. Not a broker. No real funds.
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;