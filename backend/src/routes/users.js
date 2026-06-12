const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/init');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const smsService = require('../services/sms');
const router = express.Router();

// ── Profile ──────────────────────────────────────────────────────────

// GET /profile — full user info
router.get('/profile', auth, (req, res) => {
  const u = get(
    'SELECT id,phone,name,email,company_name,wechat_id,role,member_level,' +
    'member_expire,auto_renew,verify_status,status,balance,avatar_url,created_at ' +
    'FROM users WHERE id=?',
    [req.user.id]
  );
  if (!u) return res.json({ success: false, error: '用户不存在' });
  res.json({ success: true, data: u });
});

// PUT /profile — multi-field update with change log
router.put('/profile', auth, (req, res) => {
  const { name, email, company_name, wechat_id } = req.body;
  const now = new Date().toISOString();
  const u = get('SELECT name,email,company_name,wechat_id FROM users WHERE id=?', [req.user.id]);
  if (!u) return res.json({ success: false, error: '用户不存在' });

  const updatable = { name, email, company_name, wechat_id };
  const sets = [];
  const params = [];

  for (const [key, val] of Object.entries(updatable)) {
    if (val !== undefined && String(val) !== String(u[key] || '')) {
      sets.push(`${key}=?`);
      params.push(val);
      run(
        'INSERT INTO user_change_logs (id,user_id,field,old_value,new_value,created_at) VALUES (?,?,?,?,?,?)',
        [uuidv4(), req.user.id, key, u[key] || '', val, now]
      );
    }
  }

  if (sets.length === 0) {
    return res.json({ success: true, message: '没有变更' });
  }

  params.push(now, req.user.id);
  run(`UPDATE users SET ${sets.join(',')},updated_at=? WHERE id=?`, params);
  res.json({ success: true, message: '更新成功' });
});

// PUT /password — change password
router.put('/password', auth, (req, res) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password || new_password.length < 6) {
    return res.json({ success: false, error: '新密码至少6位' });
  }
  const u = get('SELECT password_hash FROM users WHERE id=?', [req.user.id]);
  if (!bcrypt.compareSync(old_password, u.password_hash)) {
    return res.json({ success: false, error: '原密码错误' });
  }
  const now = new Date().toISOString();
  run('UPDATE users SET password_hash=?,updated_at=? WHERE id=?',
    [bcrypt.hashSync(new_password, 10), now, req.user.id]);
  res.json({ success: true, message: '密码修改成功' });
});

// ── Avatar ───────────────────────────────────────────────────────────

// POST /avatar — upload avatar image
router.post('/avatar', auth, (req, res) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) return res.json({ success: false, error: err.message });
    if (!req.file) return res.json({ success: false, error: '请选择图片' });

    const url = '/uploads/' + req.file.filename;
    const now = new Date().toISOString();
    run('UPDATE users SET avatar_url=?,updated_at=? WHERE id=?', [url, now, req.user.id]);
    res.json({ success: true, data: { avatar_url: url } });
  });
});

// ── Phone Change ─────────────────────────────────────────────────────

// PUT /phone — change phone number (SMS verified)
router.put('/phone', auth, (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return res.json({ success: false, error: '无效的手机号' });
  }
  if (!smsService.verifySmsCode(phone, code)) {
    return res.json({ success: false, error: '验证码错误或已过期' });
  }
  if (get('SELECT id FROM users WHERE phone=? AND id!=?', [phone, req.user.id])) {
    return res.json({ success: false, error: '手机号已被其他账号使用' });
  }
  const now = new Date().toISOString();
  const old = get('SELECT phone FROM users WHERE id=?', [req.user.id]);
  run('UPDATE users SET phone=?,updated_at=? WHERE id=?', [phone, now, req.user.id]);
  run(
    'INSERT INTO user_change_logs (id,user_id,field,old_value,new_value,created_at) VALUES (?,?,?,?,?,?)',
    [uuidv4(), req.user.id, 'phone', old.phone, phone, now]
  );
  res.json({ success: true, message: '手机号更换成功' });
});

// ── Change Logs ──────────────────────────────────────────────────────

// GET /change-logs — personal info change history
router.get('/change-logs', auth, (req, res) => {
  const logs = all(
    'SELECT field, old_value, new_value, created_at FROM user_change_logs ' +
    'WHERE user_id=? ORDER BY created_at DESC LIMIT 50',
    [req.user.id]
  );
  res.json({ success: true, data: logs });
});

module.exports = router;
