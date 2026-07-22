const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/init');
const config = require('../config');
const { auth } = require('../middleware/auth');
const { loginLimiter, smsLimiter, createRateLimit } = require('../middleware/rateLimit');
const { validateMiddleware, schemas } = require('../middleware/validate');
const smsService = require('../services/sms');
const oauthService = require('../services/oauth');
const router = express.Router();

// Rate limiters for password reset
const resetPwdSendLimiter = createRateLimit({ windowMs: 60000, max: 1, keyBy: 'ip+phone' });
const resetPwdVerifyLimiter = createRateLimit({ windowMs: 300000, max: 5, keyBy: 'ip+phone' });

// POST /auth/sms-code —send verification code via Aliyun SMS
router.post('/sms-code', smsLimiter, async (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^1[3-9]\d{9}$/.test(phone))
    return res.status(400).json({ success: false, error: '无效的手机号' });
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  try {
    const result = await smsService.sendSmsCode(phone, ip);
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: '短信发送失败' });
  }
});

// POST /auth/register —register with SMS code verification
router.post('/register', validateMiddleware(schemas.register), async (req, res) => {
  const { phone, code, name, role, password } = req.body;
  if (!phone || !code || !password)
    return res.status(400).json({ success: false, error: '手机号、验证码和密码不能为空' });
  if (!/^1[3-9]\d{9}$/.test(phone))
    return res.status(400).json({ success: false, error: '无效的手机号' });

  if (!smsService.verifySmsCode(phone, code))
    return res.status(400).json({ success: false, error: '验证码错误或已过期' });

  if (get('SELECT id FROM users WHERE phone = ?', [phone]))
    return res.status(409).json({ success: false, error: '该手机号已注册' });

  const id = uuidv4(), hash = bcrypt.hashSync(password, 10),
    now = new Date().toISOString(), r = role || 'buyer';
  run('INSERT INTO users (id,phone,password_hash,name,role,member_level,member_expire,auto_renew,avatar_url,verify_status,status,balance,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [id, phone, hash, name || '', r, 'free', null, 0, null, 'none', 'active', 0, now, now]);

  // Note: user must explicitly agree to agreements via POST /api/agreements/agree
  const token = jwt.sign({ id, phone, role: r }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  const refreshToken = jwt.sign({ id, phone, role: r }, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpiresIn });
  res.json({ success: true, data: { id, phone, name: name || '', role: r, token, refresh_token: refreshToken } });
});

// POST /auth/login —password login
router.post('/login', loginLimiter, validateMiddleware(schemas.login), (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ success: false, error: '请输入手机号和密码' });
  const u = get('SELECT * FROM users WHERE phone = ?', [phone]);
  if (!u) return res.status(404).json({ success: false, error: '账号不存在' });
  if (u.status === 'disabled' || u.status === 'deleted') return res.status(403).json({ success: false, error: '账号已禁用或已注销' });
  if (!bcrypt.compareSync(password, u.password_hash)) return res.status(401).json({ success: false, error: '密码错误' });
  const token = jwt.sign({ id: u.id, phone: u.phone, role: u.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  const refreshToken = jwt.sign({ id: u.id, phone: u.phone, role: u.role }, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpiresIn });
  res.json({ success: true, data: { id: u.id, phone: u.phone, name: u.name, role: u.role, member_level: u.member_level, verify_status: u.verify_status, token, refresh_token: refreshToken } });
});

// POST /auth/login-sms —SMS code login (no password needed)
router.post('/login-sms', loginLimiter, validateMiddleware(schemas.loginSms), (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ success: false, error: '请输入手机号和验证码' });
  if (!/^1[3-9]\d{9}$/.test(phone)) return res.status(400).json({ success: false, error: '无效的手机号' });
  if (!smsService.verifySmsCode(phone, code)) return res.status(400).json({ success: false, error: '验证码错误或已过期' });
  const u = get('SELECT * FROM users WHERE phone = ?', [phone]);
  if (!u) return res.status(404).json({ success: false, error: '账号不存在' });
  if (u.status === 'disabled' || u.status === 'deleted') return res.status(403).json({ success: false, error: '账号已禁用或已注销' });
  const token = jwt.sign({ id: u.id, phone: u.phone, role: u.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  const refreshToken = jwt.sign({ id: u.id, phone: u.phone, role: u.role }, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpiresIn });
  res.json({ success: true, data: { id: u.id, phone: u.phone, name: u.name, role: u.role, member_level: u.member_level, verify_status: u.verify_status, token, refresh_token: refreshToken } });
});

router.get('/me', auth, (req, res) => {
  const u = get('SELECT id,phone,name,role,member_level,member_expire,auto_renew,verify_status,status,balance,created_at FROM users WHERE id = ?', [req.user.id]);
  if (!u) return res.status(404).json({ success: false, error: '用户不存在' });
  res.json({ success: true, data: u });
});

// ── Password Reset ───────────────────────────────────────────────────

// POST /auth/reset-password/send-code
router.post('/reset-password/send-code', resetPwdSendLimiter, async (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^1[3-9]\d{9}$/.test(phone))
    return res.status(400).json({ success: false, error: '无效的手机号' });
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const u = get('SELECT id FROM users WHERE phone = ? AND status = ?', [phone, 'active']);
  // Always return success to prevent phone enumeration
  if (u) {
    try { await smsService.sendSmsCode(phone, ip); } catch(e) { /* ignore */ }
  }
  res.json({ success: true, message: '如果该手机号已注册，验证码将发送至您的手机' });
});

// POST /auth/reset-password/verify
router.post('/reset-password/verify', resetPwdVerifyLimiter, (req, res) => {
  const { phone, code, new_password } = req.body;
  if (!phone || !code || !new_password) return res.status(400).json({ success: false, error: '手机号、验证码和新密码不能为空' });
  if (!/^1[3-9]\d{9}$/.test(phone)) return res.status(400).json({ success: false, error: '无效的手机号' });
  if (new_password.length < 6) return res.status(400).json({ success: false, error: '新密码至少6位' });

  if (!smsService.verifySmsCode(phone, code))
    return res.status(400).json({ success: false, error: '验证码错误或已过期' });

  const u = get('SELECT id FROM users WHERE phone = ? AND status = ?', [phone, 'active']);
  if (!u) return res.status(404).json({ success: false, error: '账号不存在或已注销' });

  const now = new Date().toISOString();
  const hash = bcrypt.hashSync(new_password, 10);
  run('UPDATE users SET password_hash=?, updated_at=? WHERE id=?', [hash, now, u.id]);
  res.json({ success: true, message: '密码重置成功' });
});

// ── OAuth Third-Party Login ──────────────────────────────────────────

// Validate redirect_uri against whitelist to prevent open redirect
function validateOAuthRedirectUri(uri) {
  try {
    const parsed = new URL(uri);
    // Only allow http/https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    // In production, require https
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') return false;
    // Check against whitelist
    const allowed = config.oauthAllowedRedirects || ['http://localhost:3001'];
    return allowed.some(function(a) {
      var allowedOrigin = a.replace(/\/$/, '');
      return parsed.origin === allowedOrigin;
    });
  } catch(e) { return false; }
}

// GET /auth/oauth/wechat/url
router.get('/oauth/wechat/url', (req, res) => {
  const redirectUri = req.query.redirect_uri;
  if (redirectUri && !validateOAuthRedirectUri(redirectUri)) {
    return res.status(400).json({ success: false, error: '非法的重定向地址' });
  }
  const safeUri = redirectUri || config.corsOrigin || 'http://localhost:3001/';
  const state = oauthService.generateState();
  const url = oauthService.getWechatAuthUrl(safeUri, state);
  res.json({ success: true, data: { url, state } });
});

// GET /auth/oauth/alipay/url
router.get('/oauth/alipay/url', (req, res) => {
  const redirectUri = req.query.redirect_uri;
  if (redirectUri && !validateOAuthRedirectUri(redirectUri)) {
    return res.status(400).json({ success: false, error: '非法的重定向地址' });
  }
  const safeUri = redirectUri || config.corsOrigin || 'http://localhost:3001/';
  const state = oauthService.generateState();
  const url = oauthService.getAlipayAuthUrl(safeUri, state);
  res.json({ success: true, data: { url, state } });
});

// Shared OAuth callback logic: find-or-create user, issue JWT
async function handleOAuthCallback(provider, providerUserId, userInfo) {
  // Check if OAuth account already linked
  const existing = get('SELECT user_id FROM oauth_accounts WHERE provider=? AND open_id=?', [provider, providerUserId]);
  let userId;
  let isNew = false;

  if (existing) {
    userId = existing.user_id;
    // Check user still active
    const u = get('SELECT status FROM users WHERE id=?', [userId]);
    if (!u || u.status === 'deleted') return { success: false, error: '账号已注销' };
  } else {
    // Create new user with placeholder phone
    isNew = true;
    userId = uuidv4();
    const now = new Date().toISOString();
    const placeholderPhone = provider === 'wechat' ? 'wx_' : 'alipay_';
    const randomPwd = require('crypto').randomBytes(12).toString('hex');
    const hash = bcrypt.hashSync(randomPwd, 10);
    const nickname = userInfo.nickname || userInfo.nick_name || (provider === 'wechat' ? '微信用户' : '支付宝用户');

    run('INSERT INTO users (id,phone,password_hash,name,role,member_level,member_expire,auto_renew,avatar_url,verify_status,status,balance,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [userId, placeholderPhone + Date.now(), hash, nickname, 'buyer', 'free', null, 0, userInfo.avatar || userInfo.headimgurl || '', 'none', 'active', 0, now, now]);

    // Note: user must explicitly agree to agreements via POST /api/agreements/agree
  }

  // Upsert OAuth account
  const now = new Date().toISOString();
  const oauthId = uuidv4();
  try {
    run('INSERT OR REPLACE INTO oauth_accounts (id, user_id, provider, open_id, union_id, nickname, avatar_url, raw_data, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [oauthId, userId, provider, providerUserId, userInfo.unionid || userInfo.user_id || null, userInfo.nickname || userInfo.nick_name || '', userInfo.avatar || userInfo.headimgurl || '', JSON.stringify(userInfo), now]);
  } catch(e) {
    // If replace fails, update existing
    const existOauth = get('SELECT id FROM oauth_accounts WHERE provider=? AND open_id=?', [provider, providerUserId]);
    if (existOauth) {
      run('UPDATE oauth_accounts SET nickname=?, avatar_url=?, raw_data=? WHERE id=?',
        [userInfo.nickname || userInfo.nick_name || '', userInfo.avatar || userInfo.headimgurl || '', JSON.stringify(userInfo), existOauth.id]);
    }
  }

  const u = get('SELECT id,phone,name,role,member_level,verify_status FROM users WHERE id=?', [userId]);
  const token = jwt.sign({ id: u.id, phone: u.phone, role: u.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  const refreshToken = jwt.sign({ id: u.id, phone: u.phone, role: u.role }, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpiresIn });
  return { success: true, data: { id: u.id, phone: u.phone, name: u.name, role: u.role, member_level: u.member_level, verify_status: u.verify_status, token, refresh_token: refreshToken, is_new: isNew } };
}

// POST /auth/oauth/wechat/callback
router.post('/oauth/wechat/callback', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, error: '缺少授权码' });
  try {
    const tokenData = await oauthService.wechatGetAccessToken(code);
    const userInfo = await oauthService.wechatGetUserInfo(tokenData.access_token, tokenData.openid);
    const result = await handleOAuthCallback('wechat', tokenData.openid, userInfo);
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: '微信登录失败' });
  }
});

// POST /auth/oauth/alipay/callback
router.post('/oauth/alipay/callback', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, error: '缺少授权码' });
  try {
    const tokenData = await oauthService.alipayGetAccessToken(code);
    const userInfo = await oauthService.alipayGetUserInfo(tokenData.access_token);
    const result = await handleOAuthCallback('alipay', tokenData.user_id || userInfo.user_id, userInfo);
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: '支付宝登录失败' });
  }
});

// POST /auth/refresh — refresh access token using refresh token
router.post('/refresh', (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ success: false, error: '缺少 refresh_token' });
  }
  try {
    const payload = jwt.verify(refresh_token, config.jwtRefreshSecret);
    const accessToken = jwt.sign(
      { id: payload.id, phone: payload.phone, role: payload.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    res.json({ success: true, data: { token: accessToken } });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'refresh_token 无效或已过期' });
  }
});

module.exports = router;


// POST /auth/dev-token - DEV ONLY: issue a dev JWT for the authenticated user.
// Disabled unless DEV_TOKEN_ENABLED=true AND NODE_ENV is not production.
// Requires authentication — user can only get token for themselves (or admin for anyone).
const devTokenLimiter = createRateLimit({ windowMs: 60_000, max: 3, keyBy: 'ip' });
router.post('/dev-token', auth, devTokenLimiter, (req, res) => {
  if (process.env.NODE_ENV === 'production' || process.env.DEV_TOKEN_ENABLED !== 'true') {
    return res.status(404).json({ success: false, error: '该功能未启用' });
  }
  const { phone } = req.body || {};
  if (!phone || !/^1[3-9]\d{9}$/.test(phone))
    return res.status(400).json({ success: false, error: '无效的手机号' });
  const u = get('SELECT id,phone,name,role,status FROM users WHERE phone = ?', [phone]);
  if (!u) return res.status(404).json({ success: false, error: '账号不存在' });
  // Only allow own phone number — no impersonation even for admin
  if (u.id !== req.user.id) {
    return res.status(403).json({ success: false, error: '只能获取自己的开发令牌' });
  }
  if (u.status === 'disabled' || u.status === 'deleted') return res.status(403).json({ success: false, error: '账号已禁用或已注销' });
  const token = jwt.sign({ id: u.id, phone: u.phone, role: u.role }, config.jwtSecret, { expiresIn: '1h' });
  res.json({ success: true, data: { id: u.id, phone: u.phone, name: u.name, role: u.role, token, dev_mode: true } });
});
