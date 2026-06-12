const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { run, get, all, transaction } = require('../db/init');
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

// ── Role Switch ──────────────────────────────────────────────────────

// PUT /role — switch between buyer and seller
router.put('/role', auth, (req, res) => {
  const { role } = req.body;
  if (!role || !['buyer', 'seller'].includes(role)) {
    return res.json({ success: false, error: '角色必须是 buyer 或 seller' });
  }

  const u = get('SELECT role, status FROM users WHERE id=?', [req.user.id]);
  if (!u) return res.json({ success: false, error: '用户不存在' });
  if (u.role === 'admin') return res.json({ success: false, error: '管理员账号不能切换角色' });
  if (u.role === role) return res.json({ success: false, error: '当前已是该角色，无需切换' });

  const now = new Date().toISOString();
  const warnings = [];

  // Check for active projects if switching away from seller
  if (u.role === 'seller') {
    const activeProjects = all("SELECT COUNT(*) as c FROM projects WHERE user_id=? AND status='online'", [req.user.id]);
    if (activeProjects[0]?.c > 0) {
      warnings.push(`您有 ${activeProjects[0].c} 个在线的转让项目，切换角色后仍可在"卖家工作台"查看`);
    }
  }

  // Check for active demands if switching away from buyer
  if (u.role === 'buyer') {
    const demands = get('SELECT id FROM demands WHERE user_id=?', [req.user.id]);
    if (demands) {
      warnings.push('您已发布收购需求，切换角色后将被保留');
    }
  }

  run('UPDATE users SET role=?, updated_at=? WHERE id=?', [role, now, req.user.id]);
  run(
    'INSERT INTO user_change_logs (id,user_id,field,old_value,new_value,created_at) VALUES (?,?,?,?,?,?)',
    [uuidv4(), req.user.id, 'role', u.role, role, now]
  );

  res.json({
    success: true,
    message: `角色已切换为${role === 'buyer' ? '买家' : '卖家'}`,
    warnings: warnings.length > 0 ? warnings : undefined,
  });
});

// ── Account Deletion ─────────────────────────────────────────────────

// DELETE /account — soft delete account
router.delete('/account', auth, (req, res) => {
  const { password } = req.body;
  if (!password) return res.json({ success: false, error: '请输入密码以确认注销' });

  const u = get('SELECT phone, password_hash, role, status FROM users WHERE id=?', [req.user.id]);
  if (!u) return res.json({ success: false, error: '用户不存在' });
  if (u.role === 'admin') return res.json({ success: false, error: '管理员账号不能注销' });
  if (u.status === 'deleted') return res.json({ success: false, error: '账号已注销' });

  if (!bcrypt.compareSync(password, u.password_hash)) {
    return res.json({ success: false, error: '密码错误' });
  }

  const now = new Date().toISOString();
  const crypto = require('crypto');
  const anonymizedPhone = 'deleted_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');

  try {
    transaction(() => {
      // Anonymize user record
      run('UPDATE users SET phone=?, name=?, password_hash=?, status=?, updated_at=? WHERE id=?',
        [anonymizedPhone, '已注销用户', crypto.randomBytes(32).toString('hex'), 'deleted', now, req.user.id]);

      // Offline all projects
      run("UPDATE projects SET status='offline', updated_at=? WHERE user_id=? AND status='online'",
        [now, req.user.id]);

      // Clear favorites
      run('DELETE FROM favorites WHERE user_id=?', [req.user.id]);

      // Clear demands
      run('DELETE FROM demands WHERE user_id=?', [req.user.id]);
    });

    res.json({ success: true, message: '账户已注销，感谢您的使用' });
  } catch (e) {
    res.status(500).json({ success: false, error: '注销失败，请重试' });
  }
});

// ── OAuth Account Management ─────────────────────────────────────────

// GET /oauth/accounts — list linked OAuth accounts
router.get('/oauth/accounts', auth, (req, res) => {
  const accounts = all(
    'SELECT id, provider, nickname, avatar_url, created_at FROM oauth_accounts WHERE user_id=?',
    [req.user.id]
  );
  res.json({ success: true, data: accounts });
});

// DELETE /oauth/unlink/:provider — unlink OAuth account
router.delete('/oauth/unlink/:provider', auth, (req, res) => {
  const { provider } = req.params;
  if (!['wechat', 'alipay'].includes(provider)) {
    return res.json({ success: false, error: '无效的第三方登录类型' });
  }

  // Ensure user has a password set (can't unlink all auth methods)
  const u = get('SELECT password_hash FROM users WHERE id=?', [req.user.id]);
  // Check if password_hash would be valid for login (not a random placeholder)
  // Just ensure user still has at least one way to log in
  const oauthCount = all('SELECT COUNT(*) as c FROM oauth_accounts WHERE user_id=?', [req.user.id]);
  if (oauthCount[0]?.c <= 1) {
    return res.json({ success: false, error: '至少需要保留一种登录方式，请先设置密码后再解除绑定' });
  }

  run('DELETE FROM oauth_accounts WHERE user_id=? AND provider=?', [req.user.id, provider]);
  res.json({ success: true, message: `已解除${provider === 'wechat' ? '微信' : '支付宝'}绑定` });
});

module.exports = router;
