const express = require('express');
const cors = require('cors');
const config = require('./config');
const { getDb, run, get, all } = require('./db/init');

const app = express();

// CORS —validate origin, reject '*' in production
const corsOrigin = config.corsOrigin;
if (corsOrigin === '*') {
  console.warn('[SECURITY] CORS_ORIGIN is set to "*" —restrict to specific origin in production!');
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
app.use('/api/agreements', require('./routes/agreements'));
app.use('/api/diagnostics', require('./routes/diagnostics'));
app.use('/api/expert-services', require('./routes/expert-services'));
app.use('/api/admin', require('./routes/admin/index'));

// Uploaded files are served only through /api/uploads (auth required).
// 敏感文件（身份证/营业执照）不再公开可访问，见 routes/uploads.js。


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
    error: isProd ? "Internal server error" : (err.message || "Server error"),
  });
});

// ── Auto-Renewal Cron（已下线：平台免费审核制，无付费会员续费）──────
function runAutoRenewal() {
  // 平台已转为免费审核制，自动续费扣款逻辑已禁用。
}
app.listen(config.port, () => {
  console.log(`xiaoweimm API Server running on http://localhost:${config.port}`);
  // Run auto-renewal check on startup + every 24 hours
  runAutoRenewal();
  setInterval(runAutoRenewal, 24 * 60 * 60 * 1000);
});

