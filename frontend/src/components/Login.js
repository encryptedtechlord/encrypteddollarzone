import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000';

export default function Login({ setToken, setRole, onSwitchToSignup }) {
  const [mode, setMode] = useState('password'); // 'password' | 'otp'
  const [step, setStep] = useState('email');    // 'email' | 'password' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // ----- Password login flow -----
  const goToPassword = (e) => {
    e.preventDefault();
    if (!email.trim()) return setError('Please enter your email');
    setError('');
    setStep('password');
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/api/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('username', res.data.username);
      setToken(res.data.token);
      setRole(res.data.role);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    }
    setLoading(false);
  };

  // ----- OTP login flow -----
  const requestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError('Please enter your email');
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API}/api/auth/login/otp/request`, { email });
      setInfo('Login code sent. Check your email (or the backend terminal).');
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send code');
    }
    setLoading(false);
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/api/auth/login/otp/verify`, { email, code });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('username', res.data.username);
      setToken(res.data.token);
      setRole(res.data.role);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code');
    }
    setLoading(false);
  };

  const switchMode = (m) => {
    setMode(m);
    setStep('email');
    setPassword('');
    setCode('');
    setError('');
    setInfo('');
  };

  const handleDerivLogin = () => {
    window.location.href = `${API}/api/auth/deriv/login`;
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <span className="auth-logo">🔐</span>
          <span className="auth-brand-name">Encrypted Dollar Zone</span>
        </div>
        <h1 className="auth-tagline">
          Trade smarter.<br />
          Track every move.
        </h1>
        <p className="auth-subline">
          Live Deriv charts, custom signals, and personal trade analytics — all in one dashboard.
        </p>
        <div className="auth-features">
          <div className="auth-feature">
            <span className="auth-feature-icon">📈</span>
            <div>
              <div className="auth-feature-title">Live Charts</div>
              <div className="auth-feature-desc">Real-time volatility indices powered by TradingView</div>
            </div>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">🎯</span>
            <div>
              <div className="auth-feature-title">Smart Signals</div>
              <div className="auth-feature-desc">Curated buy/sell signals from your admin feed</div>
            </div>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">📊</span>
            <div>
              <div className="auth-feature-title">Personal Analytics</div>
              <div className="auth-feature-desc">Track your win rate and P/L over time</div>
            </div>
          </div>
        </div>
        <div className="auth-footer-note">
          Educational analytics platform · Not a broker · No trade execution
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {step === 'email' && (
            <>
              <h2 className="auth-heading">Welcome back</h2>
              <p className="auth-subheading">Sign in to continue to your dashboard</p>

              <button className="oauth-btn" onClick={handleDerivLogin}>
                <span style={{ color: '#ff4a5c', fontWeight: 700, marginRight: 4 }}>deriv</span>
                Login with Deriv Account
              </button>

              <div className="auth-divider"><span>or</span></div>

              <div className="auth-mode-toggle">
                <button
                  className={`auth-mode-btn ${mode === 'password' ? 'active' : ''}`}
                  onClick={() => switchMode('password')}
                >
                  Password
                </button>
                <button
                  className={`auth-mode-btn ${mode === 'otp' ? 'active' : ''}`}
                  onClick={() => switchMode('otp')}
                >
                  Email code
                </button>
              </div>

              <form onSubmit={mode === 'password' ? goToPassword : requestOtp}>
                <label className="auth-label">Email</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
                {error && <div className="auth-error">{error}</div>}
                <button className="auth-primary-btn" type="submit" disabled={loading}>
                  {loading ? 'Please wait...' : mode === 'password' ? 'Continue' : 'Send login code'}
                </button>
              </form>

              <div className="auth-helper">
                Don't have an account?{' '}
                <button className="auth-link-btn" onClick={onSwitchToSignup}>
                  Sign up
                </button>
              </div>
            </>
          )}

          {step === 'password' && (
            <>
              <button className="auth-back" onClick={() => { setStep('email'); setPassword(''); setError(''); }}>
                ← Back
              </button>
              <h2 className="auth-heading">Enter Password</h2>
              <p className="auth-subheading">
                Signing in as <strong>{email}</strong>
              </p>

              <form onSubmit={submitPassword}>
                <label className="auth-label">Password</label>
                <input
                  className="auth-input"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                />
                {error && <div className="auth-error">{error}</div>}
                <button className="auth-primary-btn" type="submit" disabled={loading}>
                  {loading ? 'Logging in...' : 'Log in'}
                </button>
              </form>

              <div className="auth-helper">
                <button className="auth-link-btn" onClick={() => { switchMode('otp'); }}>
                  Use email code instead
                </button>
              </div>
            </>
          )}

          {step === 'otp' && (
            <>
              <button className="auth-back" onClick={() => { setStep('email'); setCode(''); setError(''); setInfo(''); }}>
                ← Back
              </button>
              <h2 className="auth-heading">Enter login code</h2>
              <p className="auth-subheading">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>

              <form onSubmit={submitOtp}>
                <label className="auth-label">Verification code</label>
                <input
                  className="auth-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.25rem' }}
                  autoFocus
                  required
                />
                {error && <div className="auth-error">{error}</div>}
                {info && !error && <div className="auth-info">{info}</div>}
                <button className="auth-primary-btn" type="submit" disabled={loading || code.length !== 6}>
                  {loading ? 'Verifying...' : 'Log in'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}