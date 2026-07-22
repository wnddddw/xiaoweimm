const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { getDb, run, get, all } = require('./db/init');

const app = express();

// CORS 鈥?validate origin, reject '*' in production
const corsOrigin = config.corsOrigin;
if (corsOrigin === '*') {
  console.warn('[SECURITY] CORS_ORIGIN is set to "*" 鈥?restrict to specific origin in production!');
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

// Serve uploaded files
app.use('/uploads', express.static(path.resolve(config.uploadDir)));


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

// 鈹€鈹€ Auto-Renewal Cron 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

function runAutoRenewal() {
  try {
    const now = new Date().toISOString();
    const expiredUsers = all(
      "SELECT id, phone, member_level, balance, auto_renew, member_expire FROM users WHERE auto_renew=1 AND member_expire IS NOT NULL AND member_expire < ? AND member_level != 'free' AND status='active'",
      [now]
    );
    const prices = { personal: 300, company: 600, vip: 1800 };
    for (const u of expiredUsers) {
      const amount = prices[u.member_level] || 0;
      if (u.balance >= amount) {
        // Renew: extend by 1 month
        const expire = new Date();
        expire.setMonth(expire.getMonth() + 1);
        run('UPDATE users SET balance=balance-?, member_expire=?, updated_at=? WHERE id=?',
          [amount, expire.toISOString(), now, u.id]);
        run('INSERT INTO payments (id,user_id,type,amount,balance_before,balance_after,pay_method,created_at) VALUES (?,?,?,?,?,?,?,?)',
          [require('uuid').v4(), u.id, 'membership_renew', amount, u.balance, u.balance - amount, 'Auto', now]);
        console.log(`[AUTO-RENEW] ${u.phone.slice(-4)} renewed ${u.member_level} for 楼${amount}`);
      } else {
        // Insufficient balance: downgrade to free
        run("UPDATE users SET member_level='free', member_expire=NULL, auto_renew=0, updated_at=? WHERE id=?",
          [now, u.id]);
        run('INSERT INTO messages (id,user_id,category,subject,body,created_at) VALUES (?,?,?,?,?,?)',
          [require('uuid').v4(), u.id, 'system', 'Renewal failed',
           `Balance insufficient (current: ${u.balance.toFixed(2)}, need: ${amount}), membership downgraded to free. Please recharge.`, now]);
      }
    }
  } catch (e) {
    console.error('[AUTO-RENEW ERROR]', e.message);
  }
}
app.listen(config.port, () => {
  console.log(`xiaoweimm API Server running on http://localhost:${config.port}`);
  // Run auto-renewal check on startup + every 24 hours
  runAutoRenewal();
  setInterval(runAutoRenewal, 24 * 60 * 60 * 1000);
});

