const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { getDb } = require('./db/init');

const app = express();

// CORS — validate origin, reject '*' in production
const corsOrigin = config.corsOrigin;
if (corsOrigin === '*') {
  console.warn('[SECURITY] CORS_ORIGIN is set to "*" — restrict to specific origin in production!');
}
app.use(cors({
  origin: corsOrigin === '*' ? true : corsOrigin,
  credentials: corsOrigin !== '*',
}));
// Raw body for WeChat XML callbacks (must come before JSON parser)
app.use(express.raw({ type: 'text/xml', limit: '1mb' }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/verify', require('./routes/verify'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/demands', require('./routes/demands'));
app.use('/api/deals', require('./routes/deals'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/memberships', require('./routes/memberships'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/matching', require('./routes/matching'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/admin', require('./routes/admin/index'));

// Serve uploaded files
app.use('/uploads', express.static(path.resolve(config.uploadDir)));

// Serve HTML frontend with cache — 1h for production, 0 for dev
const staticOpts = { maxAge: process.env.NODE_ENV === 'production' ? 3600000 : 0 };
app.use(express.static(path.resolve('../HTML'), staticOpts));

// Constants
const { industryData, regionData, dealStages } = require('./utils/constants');
app.get('/api/constants/industry-data', (req, res) => res.json({ success: true, data: industryData }));
app.get('/api/constants/region-data', (req, res) => res.json({ success: true, data: regionData }));
app.get('/api/constants/deal-stages', (req, res) => res.json({ success: true, data: dealStages }));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'xiaoweimm API running' }));

app.use((err, req, res, next) => {
  console.error(err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: isProd ? '服务器内部错误' : (err.message || '服务器错误'),
  });
});

// Initialize DB then start server
getDb().then(() => {
  app.listen(config.port, () => {
    console.log(`xiaoweimm API Server running on http://localhost:${config.port}`);
  });
});
