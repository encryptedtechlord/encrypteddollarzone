const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Otp = require('../models/otp');
const { sendotpEmail } = require('../services/emailervice');
const derivAuth = require('../services/derivAuth');
const derivTrading = require('../services/derivTradingService');

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ---------- SIGNUP ----------

// Step 1: User submits signup form → get OTP
router.post('/signup/initiate', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const emailLower = email.toLowerCase().trim();

    // Check if email already registered
    const existing = await User.findOne({ email: emailLower });
    if (existing) {
      return res.status(400).json({ error: 'This email is already registered. Try logging in.' });
    }

    // Delete any previous signup OTP for this email
    await Otp.deleteMany({ email: emailLower, purpose: 'signup' });

    const code = generateOtp();
    const hashedPassword = await bcrypt.hash(password, 10);

    await Otp.create({
      email: emailLower,
      code,
      purpose: 'signup',
      pendingUser: { firstName, lastName, email: emailLower, password: hashedPassword },
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    await sendOtpEmail(emailLower, code, 'signup');

    res.json({ success: true, message: 'OTP sent. Check your email (or terminal in dev).' });
  } catch (err) {
    console.error('signup/initiate error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
});

// Step 2: Verify OTP → create user
router.post('/signup/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

    const emailLower = email.toLowerCase().trim();

    const otp = await Otp.findOne({ email: emailLower, purpose: 'signup' })
      .sort({ createdAt: -1 });

    if (!otp) return res.status(400).json({ error: 'No pending signup found. Start again.' });
    if (new Date() > otp.expiresAt) {
      await Otp.deleteOne({ _id: otp._id });
      return res.status(400).json({ error: 'Code expired. Please request a new one.' });
    }
    if (otp.attempts >= 5) {
      await Otp.deleteOne({ _id: otp._id });
      return res.status(400).json({ error: 'Too many attempts. Start again.' });
    }

    if (otp.code !== code.trim()) {
      otp.attempts += 1;
      await otp.save();
      return res.status(400).json({ error: 'Invalid code. Try again.' });
    }

    // OTP correct → create the user
    const { firstName, lastName, email: puEmail, password } = otp.pendingUser;
    const username = puEmail.split('@')[0] + '_' + Math.floor(Math.random() * 1000);

    const user = new User({
      username,
      email: puEmail,
      password: password,       // already hashed
      role: 'user',
      kycStatus: 'pending',
      isActive: true,
      firstName,
      lastName
    });
    await user.save();

    await Otp.deleteOne({ _id: otp._id });

    res.status(201).json({ success: true, message: 'Account created. Please log in.' });
  } catch (err) {
    console.error('signup/verify error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
});

// Resend signup OTP
router.post('/signup/resend', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const emailLower = email.toLowerCase().trim();
    const existing = await Otp.findOne({ email: emailLower, purpose: 'signup' })
      .sort({ createdAt: -1 });
    if (!existing) return res.status(400).json({ error: 'No pending signup. Start again.' });

    const code = generateOtp();
    existing.code = code;
    existing.attempts = 0;
    existing.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await existing.save();

    await sendOtpEmail(emailLower, code, 'signup');

    res.json({ success: true, message: 'New code sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// ---------- LOGIN ----------

// Password login (existing users)
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const identifier = (email || username || '').toLowerCase().trim();

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: username || '' }]
    });

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.isActive) return res.status(403).json({ error: 'Account suspended' });

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      role: user.role,
      username: user.username,
      firstName: user.firstName || user.username
    });
  } catch (err) {
    console.error('login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Request OTP for login (passwordless)
router.post('/login/otp/request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(404).json({ error: 'No account with that email' });
    if (!user.isActive) return res.status(403).json({ error: 'Account suspended' });

    await Otp.deleteMany({ email: emailLower, purpose: 'login' });

    const code = generateOtp();
    await Otp.create({
      email: emailLower,
      code,
      purpose: 'login',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    await sendOtpEmail(emailLower, code, 'login');

    res.json({ success: true, message: 'Login code sent.' });
  } catch (err) {
    console.error('login/otp/request error:', err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Verify login OTP
router.post('/login/otp/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code required' });

    const emailLower = email.toLowerCase().trim();
    const otp = await Otp.findOne({ email: emailLower, purpose: 'login' })
      .sort({ createdAt: -1 });

    if (!otp) return res.status(400).json({ error: 'No active code. Request a new one.' });
    if (new Date() > otp.expiresAt) {
      await Otp.deleteOne({ _id: otp._id });
      return res.status(400).json({ error: 'Code expired' });
    }
    if (otp.attempts >= 5) {
      await Otp.deleteOne({ _id: otp._id });
      return res.status(400).json({ error: 'Too many attempts' });
    }

    if (otp.code !== code.trim()) {
      otp.attempts += 1;
      await otp.save();
      return res.status(400).json({ error: 'Invalid code' });
    }

    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await Otp.deleteOne({ _id: otp._id });

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      role: user.role,
      username: user.username,
      firstName: user.firstName || user.username
    });
  } catch (err) {
    console.error('login/otp/verify error:', err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// ---------- DERIV OAUTH ----------

router.get('/deriv/login', (req, res) => {
  const state = crypto.randomUUID();
  const codeVerifier = derivAuth.generateCodeVerifier();
  const codeChallenge = derivAuth.generateCodeChallenge(codeVerifier);
  req.session.oauthState = state;
  req.session.codeVerifier = codeVerifier;
  res.redirect(derivAuth.getAuthorizationUrl(state, codeChallenge));
});

router.get('/deriv/callback', async (req, res) => {
  const { code, state } = req.query;
  if (state !== req.session.oauthState) return res.status(400).json({ error: 'Invalid state' });

  try {
    const tokenData = await derivAuth.exchangeCodeForToken(code, req.session.codeVerifier);
    await derivTrading.connect(tokenData.access_token);
    const balance = await derivTrading.getBalance();

    let user = await User.findOne({ derivUserId: balance.loginid });
    if (!user) {
      user = new User({
        username: `trader_${balance.loginid}`,
        email: `${balance.loginid}@deriv.user`,
        password: crypto.randomBytes(20).toString('hex'),
        derivUserId: balance.loginid,
        derivAccessToken: tokenData.access_token,
        derivRefreshToken: tokenData.refresh_token,
        tokenExpiresAt: Date.now() + (tokenData.expires_in * 1000),
        kycStatus: 'verified'
      });
      await user.save();
    } else {
      user.derivAccessToken = tokenData.access_token;
      user.derivRefreshToken = tokenData.refresh_token;
      user.tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000);
      await user.save();
    }

    const appToken = jwt.sign(
      { id: user._id, role: user.role, derivUserId: user.derivUserId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.redirect(`http://localhost:3000?token=${appToken}&role=${user.role}`);
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
});

module.exports = router;