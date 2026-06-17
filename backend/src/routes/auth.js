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

const resetPwdSendLimiter = createRateLimit({ windowMs: 60000, max: 1, keyBy: 'ip+phone' });
const resetPwdVerifyLimiter = createRateLimit({ windowMs: 300000, max: 5, keyBy: 'ip+phone' });

router.post('/sms-code', smsLimiter, async (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return res.json({ success: false, error: '无效的手机号' });
  }

  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  try {
    const result = await smsService.sendSmsCode(phone, ip);
    res.json(result);
  } catch (error) {
    res.json({ success: false, error: error.message || '短信发送失败' });
  }
});

function autoAgreeAgreements(userId) {
  try {
    const agreements = all('SELECT id FROM agreements WHERE is_active=1');
    const now = new Date().toISOString();
    for (const agreement of agreements) {
      run('INSERT OR IGNORE INTO user_agreements (id, user_id, agreement_id, agreed_at) VALUES (?,?,?,?)',
        [uuidv4(), userId, agreement.id, now]);
    }
  } catch (error) {
    // Agreement sync is non-critical for registration/login.
  }
}

router.post('/register', validateMiddleware(schemas.register), async (req, res) => {
  const { phone, code, name, role, password } = req.body;
  const actualPassword = password || require('crypto').randomBytes(12).toString('hex');

  if (!phone || !code) return res.json({ success: false, error: '手机号和验证码不能为空' });
  if (!/^1[3-9]\d{9}$/.test(phone)) return res.json({ success: false, error: '无效的手机号' });
  if (!smsService.verifySmsCode(phone, code)) return res.json({ success: false, error: '验证码错误或已过期' });
  if (get('SELECT id FROM users WHERE phone = ?', [phone])) return res.json({ success: false, error: '该手机号已注册' });

  const id = uuidv4();
  const hash = bcrypt.hashSync(actualPassword, 10);
  const now = new Date().toISOString();
  const userRole = role || 'buyer';

  run('INSERT INTO users (id,phone,password_hash,name,role,member_level,member_expire,auto_renew,avatar_url,verify_status,status,balance,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [id, phone, hash, name || '', userRole, 'free', null, 0, null, 'none', 'active', 0, now, now]);
  autoAgreeAgreements(id);

  const token = jwt.sign({ id, phone, role: userRole }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  res.json({ success: true, data: { id, phone, name: name || '', role: userRole, token } });
});

router.post('/login', loginLimiter, validateMiddleware(schemas.login), (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.json({ success: false, error: '手机号和密码不能为空' });

  const user = get('SELECT * FROM users WHERE phone = ?', [phone]);
  if (!user) return res.json({ success: false, error: '账号不存在' });
  if (user.status === 'disabled' || user.status === 'deleted') return res.json({ success: false, error: '账号已禁用或已注销' });
  if (!bcrypt.compareSync(password, user.password_hash)) return res.json({ success: false, error: '密码错误' });

  const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  res.json({ success: true, data: { id: user.id, phone: user.phone, name: user.name, role: user.role, member_level: user.member_level, verify_status: user.verify_status, token } });
});

router.post('/login-sms', loginLimiter, validateMiddleware(schemas.loginSms), (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.json({ success: false, error: '手机号和验证码不能为空' });
  if (!/^1[3-9]\d{9}$/.test(phone)) return res.json({ success: false, error: '无效的手机号' });
  if (!smsService.verifySmsCode(phone, code)) return res.json({ success: false, error: '验证码错误或已过期' });

  const user = get('SELECT * FROM users WHERE phone = ?', [phone]);
  if (!user) return res.json({ success: false, error: '账号不存在' });
  if (user.status === 'disabled' || user.status === 'deleted') return res.json({ success: false, error: '账号已禁用或已注销' });

  const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  res.json({ success: true, data: { id: user.id, phone: user.phone, name: user.name, role: user.role, member_level: user.member_level, verify_status: user.verify_status, token } });
});

router.get('/me', auth, (req, res) => {
  const user = get('SELECT id,phone,name,role,member_level,member_expire,auto_renew,verify_status,status,balance,created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.json({ success: false, error: '账号不存在' });
  res.json({ success: true, data: user });
});

router.post('/reset-password/send-code', resetPwdSendLimiter, async (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) return res.json({ success: false, error: '无效的手机号' });

  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const user = get('SELECT id FROM users WHERE phone = ? AND status = ?', [phone, 'active']);
  if (user) {
    try {
      await smsService.sendSmsCode(phone, ip);
    } catch (error) {
      // Keep response generic to avoid account enumeration.
    }
  }
  res.json({ success: true, message: '如果该手机号已注册，验证码将发送至您的手机' });
});

router.post('/reset-password/verify', resetPwdVerifyLimiter, (req, res) => {
  const { phone, code, new_password } = req.body;
  if (!phone || !code || !new_password) return res.json({ success: false, error: '手机号、验证码和新密码不能为空' });
  if (!/^1[3-9]\d{9}$/.test(phone)) return res.json({ success: false, error: '无效的手机号' });
  if (new_password.length < 6) return res.json({ success: false, error: '新密码至少6位' });
  if (!smsService.verifySmsCode(phone, code)) return res.json({ success: false, error: '验证码错误或已过期' });

  const user = get('SELECT id FROM users WHERE phone = ? AND status = ?', [phone, 'active']);
  if (!user) return res.json({ success: false, error: '账号不存在或已注销' });

  const now = new Date().toISOString();
  const hash = bcrypt.hashSync(new_password, 10);
  run('UPDATE users SET password_hash=?, updated_at=? WHERE id=?', [hash, now, user.id]);
  res.json({ success: true, message: '密码重置成功' });
});

router.get('/oauth/wechat/url', (req, res) => {
  const redirectUri = req.query.redirect_uri || 'http://localhost:3001/';
  const state = oauthService.generateState();
  const url = oauthService.getWechatAuthUrl(redirectUri, state);
  res.json({ success: true, data: { url, state } });
});

router.get('/oauth/alipay/url', (req, res) => {
  const redirectUri = req.query.redirect_uri || 'http://localhost:3001/';
  const state = oauthService.generateState();
  const url = oauthService.getAlipayAuthUrl(redirectUri, state);
  res.json({ success: true, data: { url, state } });
});

async function handleOAuthCallback(provider, providerUserId, userInfo) {
  const existing = get('SELECT user_id FROM oauth_accounts WHERE provider=? AND open_id=?', [provider, providerUserId]);
  let userId;
  let isNew = false;

  if (existing) {
    userId = existing.user_id;
    const user = get('SELECT status FROM users WHERE id=?', [userId]);
    if (!user || user.status === 'deleted') return { success: false, error: '账号已注销' };
  } else {
    isNew = true;
    userId = uuidv4();
    const now = new Date().toISOString();
    const placeholderPhone = provider === 'wechat' ? 'wx_' : 'alipay_';
    const randomPwd = require('crypto').randomBytes(12).toString('hex');
    const hash = bcrypt.hashSync(randomPwd, 10);
    const nickname = userInfo.nickname || userInfo.nick_name || (provider === 'wechat' ? '微信用户' : '支付宝用户');

    run('INSERT INTO users (id,phone,password_hash,name,role,member_level,member_expire,auto_renew,avatar_url,verify_status,status,balance,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [userId, placeholderPhone + Date.now(), hash, nickname, 'buyer', 'free', null, 0, userInfo.avatar || userInfo.headimgurl || '', 'none', 'active', 0, now, now]);
    autoAgreeAgreements(userId);
  }

  const now = new Date().toISOString();
  const oauthId = uuidv4();
  try {
    run('INSERT OR REPLACE INTO oauth_accounts (id, user_id, provider, open_id, union_id, nickname, avatar_url, raw_data, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [oauthId, userId, provider, providerUserId, userInfo.unionid || userInfo.user_id || null, userInfo.nickname || userInfo.nick_name || '', userInfo.avatar || userInfo.headimgurl || '', JSON.stringify(userInfo), now]);
  } catch (error) {
    const existingOauth = get('SELECT id FROM oauth_accounts WHERE provider=? AND open_id=?', [provider, providerUserId]);
    if (existingOauth) {
      run('UPDATE oauth_accounts SET nickname=?, avatar_url=?, raw_data=? WHERE id=?',
        [userInfo.nickname || userInfo.nick_name || '', userInfo.avatar || userInfo.headimgurl || '', JSON.stringify(userInfo), existingOauth.id]);
    }
  }

  const user = get('SELECT id,phone,name,role,member_level,verify_status FROM users WHERE id=?', [userId]);
  const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  return { success: true, data: { id: user.id, phone: user.phone, name: user.name, role: user.role, member_level: user.member_level, verify_status: user.verify_status, token, is_new: isNew } };
}

router.post('/oauth/wechat/callback', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.json({ success: false, error: '缺少授权码' });
  try {
    const tokenData = await oauthService.wechatGetAccessToken(code);
    const userInfo = await oauthService.wechatGetUserInfo(tokenData.access_token, tokenData.openid);
    const result = await handleOAuthCallback('wechat', tokenData.openid, userInfo);
    res.json(result);
  } catch (error) {
    res.json({ success: false, error: error.message || '微信登录失败' });
  }
});

router.post('/oauth/alipay/callback', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.json({ success: false, error: '缺少授权码' });
  try {
    const tokenData = await oauthService.alipayGetAccessToken(code);
    const userInfo = await oauthService.alipayGetUserInfo(tokenData.access_token);
    const result = await handleOAuthCallback('alipay', tokenData.user_id || userInfo.user_id, userInfo);
    res.json(result);
  } catch (error) {
    res.json({ success: false, error: error.message || '支付宝登录失败' });
  }
});

router.post('/dev-token', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, error: 'Not found' });
  }

  const { phone } = req.body || {};
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) return res.json({ success: false, error: '无效的手机号' });

  const user = get('SELECT id,phone,name,role,status FROM users WHERE phone = ?', [phone]);
  if (!user) return res.json({ success: false, error: '账号不存在' });
  if (user.status === 'disabled' || user.status === 'deleted') return res.json({ success: false, error: '账号已禁用或已注销' });

  const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role }, config.jwtSecret, { expiresIn: '7d' });
  res.json({ success: true, data: { id: user.id, phone: user.phone, name: user.name, role: user.role, token, dev_mode: true } });
});

module.exports = router;
