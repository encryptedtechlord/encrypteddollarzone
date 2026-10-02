require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const session = require('express-session');

const tradingBot = require('./src/services/tradingBot');
const riskManager = require('./src/services/riskManager');

const authRoutes = require('./src/routes/auth');
const tradingRoutes = require('./src/routes/trading');
const adminRoutes = require('./src/routes/admin');
const copyTradingRoutes = require('./src/routes/copyTrading');
const userRoutes = require('./src/routes/user');
const virtualRoutes = require('./src/routes/virtual');

const app = express();
const server = http.createServer(app);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001'], credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('MongoDB connected');
  setInterval(() => riskManager.monitorOpenTrades(), 30000);
  const BotConfig = require('./src/models/BotConfig');
  const botConfig = await BotConfig.findOne();
  if (botConfig && botConfig.isActive) await tradingBot.start();
}).catch(err => console.error('DB error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/copy-trading', copyTradingRoutes);
app.use('/api/user', userRoutes);
app.use('/api/virtual', virtualRoutes);

app.get('/health', (req, res) => res.json({ status: 'online', timestamp: new Date() }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => { tradingBot.stop(); server.close(() => process.exit(0)); });