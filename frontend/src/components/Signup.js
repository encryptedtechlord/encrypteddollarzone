import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000';

export default function Signup({ onSwitchToLogin }) {
  const [step, setStep] = useState(1); // 1 = form, 2 = OTP
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const submitForm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API}/api/auth/signup/initiate`, form);
      setInfo('We sent a 6-digit code to your email. Check your inbox (or the backend terminal).');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    }
    setLoading(false);
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API}/api/auth/signup/verify`, { email: form.email, code });
      setInfo('Account created! Redirecting to login...');
      setTimeout(() => onSwitchToLogin(), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code');
    }
    setLoading(false);
  };

  const resendOtp = async () => {
    setError('');
    try {
      await axios.post(`${API}/api/auth/signup/resend`, { email: form.email });
      setInfo('New code sent.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not resend');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <span className="auth-logo">🔐</span>
          <span className="auth-brand-name">Encrypted Dollar Zone</span>
        </div>
        <h1 className="auth-tagline">
          Create your<br />
          account.
        </h1>
        <p className="auth-subline">
          Track live Deriv markets, log your trades, and build a personal trading journal.
        </p>
        <div className="auth-features">
          <div className="auth-feature">
            <span className="auth-feature-icon">📧</span>
            <div>
              <div className="auth-feature-title">Email verified</div>
              <div className="auth-feature-desc">Every account is verified with a one-time code</div>
            </div>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">🔒</span>
            <div>
              <div className="auth-feature-title">Secure login</div>
              <div className="auth-feature-desc">Password or OTP — your choice</div>
            </div>
          </div>
        </div>
        <div className="auth-footer-note">
          Educational analytics platform · Not a broker · No trade execution
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {step === 1 && (
            <>
              <h2 className="auth-heading">Create account</h2>
              <p className="auth-subheading">Just a few details to get started</p>

              <form onSubmit={submitForm}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <label className="auth-label">First name</label>
                    <input
                      className="auth-input"
                      type="text"
                      placeholder="John"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="auth-label">Last name</label>
                    <input
                      className="auth-input"
                      type="text"
                      placeholder="Doe"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <label className="auth-label">Email</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />

                <label className="auth-label">Password</label>
                <input
                  className="auth-input"
                  type="password"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={6}
                  required
                />

                {error && <div className="auth-error">{error}</div>}

                <button className="auth-primary-btn" type="submit" disabled={loading}>
                  {loading ? 'Sending code...' : 'Send verification code'}
                </button>
              </form>

              <div className="auth-helper">
                Already have an account?{' '}
                <button className="auth-link-btn" onClick={onSwitchToLogin}>
                  Log in
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <button className="auth-back" onClick={() => setStep(1)}>← Back</button>
              <h2 className="auth-heading">Verify your email</h2>
              <p className="auth-subheading">
                We sent a 6-digit code to <strong>{form.email}</strong>
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
                  required
                  autoFocus
                />

                {error && <div className="auth-error">{error}</div>}
                {info && !error && <div className="auth-info">{info}</div>}

                <button className="auth-primary-btn" type="submit" disabled={loading || code.length !== 6}>
                  {loading ? 'Verifying...' : 'Verify & create account'}
                </button>
              </form>

              <div className="auth-helper">
                Didn't get the code?{' '}
                <button className="auth-link-btn" onClick={resendOtp}>
                  Resend
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}