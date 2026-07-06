const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all, transaction } = require('../db/init');
const { auth } = require('../middleware/auth');
const router = express.Router();
const prices = { personal: 300, company: 600, vip: 1800 };

// ── Membership Benefits ──────────────────────────────────────────────

const tierBenefits = {
  free: [
    { title: '浏览公开项目', description: '查看平台上所有公开的转让项目', icon: 'eye' },
    { title: '基础筛选', description: '按行业、地区、预算范围筛选项目', icon: 'filter' },
  ],
  personal: [
    { title: '非公开项目查看', description: '解锁非公开项目的详细信息', icon: 'lock-open' },
    { title: '新项目优先通知', description: '新上线项目1小时内推送通知', icon: 'bell' },
    { title: '直接联系卖家', description: '获取卖家联系方式，直接沟通', icon: 'chat' },
  ],
  company: [
    { title: '高级数据分析', description: '行业估值分析报告和市场趋势', icon: 'chart' },
    { title: '成交顾问对接', description: '专属成交顾问提供全程服务', icon: 'user-tie' },
    { title: '线下活动报名', description: '优先参与线下并购对接活动', icon: 'calendar' },
  ],
  vip: [
    { title: '全部权益', description: '享受个人会员和企业会员的全部权益', icon: 'crown' },
    { title: '专属顾问团队', description: '资深并购顾问团队全程服务', icon: 'users' },
    { title: '优先成交撮合', description: '平台优先撮合匹配，加速成交', icon: 'rocket' },
    { title: '定制化报告', description: '按需生成定制化行业分析报告', icon: 'file-text' },
  ],
};

// GET /benefits — membership tier benefits (public)
router.get('/benefits', (req, res) => {
  res.json({ success: true, data: tierBenefits });
});

// ── Membership Info & Upgrade ────────────────────────────────────────

router.get('/', auth, (req, res) => { const u = get('SELECT member_level,member_expire,auto_renew FROM users WHERE id=?', [req.user.id]); res.json({ success: true, data: u }); });
router.post('/upgrade', auth, (req, res) => {
  const { plan_type, pay_method } = req.body;
  if (!prices[plan_type]) return res.status(400).json({ success: false, error: '无效的会员方案' });
  const amount = prices[plan_type], u = get('SELECT balance FROM users WHERE id=?', [req.user.id]);
  if (u.balance < amount) return res.status(400).json({ success: false, error: '余额不足' });
  const now = new Date().toISOString(), expire = new Date(); expire.setMonth(expire.getMonth() + 1);
  try {
    transaction(() => {
      run('UPDATE users SET member_level=?,member_expire=?,auto_renew=1,balance=balance-?,updated_at=? WHERE id=?', [plan_type, expire.toISOString(), amount, now, req.user.id]);
      run('INSERT INTO membership_orders (id,user_id,plan_type,amount,pay_method,period_start,period_end,created_at) VALUES (?,?,?,?,?,?,?,?)', ['ORD' + Date.now(), req.user.id, plan_type, amount, pay_method || 'Balance', now, expire.toISOString(), now]);
      run('INSERT INTO payments (id,user_id,type,amount,balance_before,balance_after,pay_method,created_at) VALUES (?,?,?,?,?,?,?,?)', [uuidv4(), req.user.id, 'membership', amount, u.balance, u.balance - amount, pay_method || 'Balance', now]);
    });
    res.json({ success: true, data: { plan_type, amount } });
  } catch (e) {
    res.status(500).json({ success: false, error: '交易失败，请重试' });
  }
});
router.put('/auto-renew', auth, (req, res) => { run('UPDATE users SET auto_renew=?,updated_at=? WHERE id=?', [req.body.auto_renew ? 1 : 0, new Date().toISOString(), req.user.id]); res.json({ success: true }); });
router.get('/orders', auth, (req, res) => { res.json({ success: true, data: all('SELECT * FROM membership_orders WHERE user_id=? ORDER BY created_at DESC', [req.user.id]) }); });

// ── Subscription Management ──────────────────────────────────────────

// GET /subscription — detailed subscription status
router.get('/subscription', auth, (req, res) => {
  const u = get('SELECT member_level, member_expire, auto_renew, balance FROM users WHERE id=?', [req.user.id]);
  if (!u) return res.status(404).json({ success: false, error: '用户不存在' });

  const now = new Date();
  const expireDate = u.member_expire ? new Date(u.member_expire) : null;
  const daysLeft = expireDate ? Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24)) : null;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  res.json({
    success: true,
    data: {
      level: u.member_level,
      expire_date: u.member_expire,
      auto_renew: !!u.auto_renew,
      balance: u.balance,
      days_left: daysLeft,
      is_expired: isExpired,
      renew_amount: u.member_level !== 'free' ? ({ personal: 300, company: 600, vip: 1800 })[u.member_level] : 0,
    },
  });
});

// POST /cancel — cancel auto-renewal subscription
router.post('/cancel', auth, (req, res) => {
  const u = get('SELECT member_level, auto_renew FROM users WHERE id=?', [req.user.id]);
  if (!u.auto_renew) return res.status(400).json({ success: false, error: '未开启自动续费' });

  const now = new Date().toISOString();
  run('UPDATE users SET auto_renew=0, updated_at=? WHERE id=?', [now, req.user.id]);
  res.json({ success: true, message: '已取消自动续费，当前会员权益将持续到到期日' });
});

module.exports = router;
