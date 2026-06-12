const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all, transaction } = require('../db/init');
const { auth } = require('../middleware/auth');
const router = express.Router();
const prices = { personal: 300, company: 600, vip: 1800 };
router.get('/', auth, (req, res) => { const u = get('SELECT member_level,member_expire,auto_renew FROM users WHERE id=?', [req.user.id]); res.json({ success: true, data: u }); });
router.post('/upgrade', auth, (req, res) => {
  const { plan_type, pay_method } = req.body;
  if (!prices[plan_type]) return res.json({ success: false, error: 'Invalid plan' });
  const amount = prices[plan_type], u = get('SELECT balance FROM users WHERE id=?', [req.user.id]);
  if (u.balance < amount) return res.json({ success: false, error: 'Insufficient balance' });
  const now = new Date().toISOString(), expire = new Date(); expire.setMonth(expire.getMonth() + 1);
  try {
    transaction(() => {
      run('UPDATE users SET member_level=?,member_expire=?,auto_renew=1,balance=balance-?,updated_at=? WHERE id=?', [plan_type, expire.toISOString(), amount, now, req.user.id]);
      run('INSERT INTO membership_orders (id,user_id,plan_type,amount,pay_method,period_start,period_end,created_at) VALUES (?,?,?,?,?,?,?,?)', ['ORD' + Date.now(), req.user.id, plan_type, amount, pay_method || 'Balance', now, expire.toISOString(), now]);
      run('INSERT INTO payments (id,user_id,type,amount,balance_before,balance_after,pay_method,created_at) VALUES (?,?,?,?,?,?,?,?)', [uuidv4(), req.user.id, 'membership', amount, u.balance, u.balance - amount, pay_method || 'Balance', now]);
    });
    res.json({ success: true, data: { plan_type, amount } });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Transaction failed' });
  }
});
router.put('/auto-renew', auth, (req, res) => { run('UPDATE users SET auto_renew=?,updated_at=? WHERE id=?', [req.body.auto_renew ? 1 : 0, new Date().toISOString(), req.user.id]); res.json({ success: true }); });
router.get('/orders', auth, (req, res) => { res.json({ success: true, data: all('SELECT * FROM membership_orders WHERE user_id=? ORDER BY created_at DESC', [req.user.id]) }); });
module.exports = router;
