const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { run, get } = require('../db/init');
const config = require('../config');
const { auth } = require('../middleware/auth');
const { loginLimiter, smsLimiter } = require('../middleware/rateLimit');
const { validateMiddleware, schemas } = require('../middleware/validate');
const smsService = require('../services/sms');
const router = express.Router();

// POST /auth/sms-code 鈥?send verification code via Aliyun SMS
router.post('/sms-code', smsLimiter, async (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^1[3-9]\d{9}$/.test(phone))
    return res.json({ success: false, error: 'Invalid phone' });
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  try {
    const result = await smsService.sendSmsCode(phone, ip);
    res.json(result);
  } catch (e) {
    res.json({ success: false, error: e.message || 'SMS send failed' });
  }
});

// POST /auth/register 鈥?register with SMS code verification
router.post('/register', validateMiddleware(schemas.register), async (req, res) => {
  const { phone, code, name, role, password } = req.body;
  // password is optional for SMS-only registration flow
  const actualPassword = password || require('crypto').randomBytes(12).toString('hex');
  if (!phone || !code)
    return res.json({ success: false, error: 'Phone and code required' });
  if (!/^1[3-9]\d{9}$/.test(phone))
    return res.json({ success: false, error: 'Invalid phone' });

  // Verify SMS code (replaces hardcoded '123456')
  if (!smsService.verifySmsCode(phone, code))
    return res.json({ success: false, error: 'Wrong or expired code' });

  if (get('SELECT id FROM users WHERE phone = ?', [phone]))
    return res.json({ success: false, error: 'Already registered' });

  const id = uuidv4(), hash = bcrypt.hashSync(actualPassword, 10),
    now = new Date().toISOString(), r = role || 'buyer';
  run('INSERT INTO users (id,phone,password_hash,name,role,member_level,member_expire,auto_renew,avatar_url,verify_status,status,balance,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [id, phone, hash, name || '', r, 'free', null, 0, null, 'none', 'active', 0, now, now]);
  const token = jwt.sign({ id, phone, role: r }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  res.json({ success: true, data: { id, phone, name: name || '', role: r, token } });
});

// POST /auth/login 鈥?password login
router.post('/login', loginLimiter, validateMiddleware(schemas.login), (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.json({ success: false, error: 'Phone and password required' });
  const u = get('SELECT * FROM users WHERE phone = ?', [phone]);
  if (!u) return res.json({ success: false, error: 'Account not found' });
  if (u.status === 'disabled') return res.json({ success: false, error: 'Account disabled' });
  if (!bcrypt.compareSync(password, u.password_hash)) return res.json({ success: false, error: 'Wrong password' });
  const token = jwt.sign({ id: u.id, phone: u.phone, role: u.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  res.json({ success: true, data: { id: u.id, phone: u.phone, name: u.name, role: u.role, member_level: u.member_level, verify_status: u.verify_status, token } });
});

// POST /auth/login-sms 鈥?SMS code login (no password needed)
router.post('/login-sms', loginLimiter, validateMiddleware(schemas.loginSms), (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.json({ success: false, error: 'Phone and code required' });
  if (!/^1[3-9]\d{9}$/.test(phone)) return res.json({ success: false, error: 'Invalid phone' });
  if (!smsService.verifySmsCode(phone, code)) return res.json({ success: false, error: 'Wrong or expired code' });
  const u = get('SELECT * FROM users WHERE phone = ?', [phone]);
  if (!u) return res.json({ success: false, error: 'Account not found' });
  if (u.status === 'disabled') return res.json({ success: false, error: 'Account disabled' });
  const token = jwt.sign({ id: u.id, phone: u.phone, role: u.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  res.json({ success: true, data: { id: u.id, phone: u.phone, name: u.name, role: u.role, member_level: u.member_level, verify_status: u.verify_status, token } });
});

router.get('/me', auth, (req, res) => {
  const u = get('SELECT id,phone,name,role,member_level,member_expire,auto_renew,verify_status,status,balance,created_at FROM users WHERE id = ?', [req.user.id]);
  if (!u) return res.json({ success: false, error: 'Not found' });
  res.json({ success: true, data: u });
});

module.exports = router;


// POST /auth/dev-token - DEV ONLY: issue a long-lived JWT for an existing user.
// Avoids SMS rate limits when local testing hits the rate limit too often.
// Disabled in production. Token valid for 7 days.
router.post('/dev-token', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  const { phone } = req.body || {};
  if (!phone || !/^1[3-9]\d{9}$/.test(phone))
    return res.json({ success: false, error: 'Invalid phone' });
  const u = get('SELECT id,phone,name,role,status FROM users WHERE phone = ?', [phone]);
  if (!u) return res.json({ success: false, error: 'Account not found' });
  if (u.status === 'disabled') return res.json({ success: false, error: 'Account disabled' });
  const token = jwt.sign({ id: u.id, phone: u.phone, role: u.role }, config.jwtSecret, { expiresIn: '7d' });
  res.json({ success: true, data: { id: u.id, phone: u.phone, name: u.name, role: u.role, token, dev_mode: true } });
});
