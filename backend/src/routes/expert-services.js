/**
 * Expert Services — Platform-referred expert services (legal, accounting, tax, etc.)
 * PRD: 6,000-60,000 yuan, platform takes referral fee, remainder to expert
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all, transaction } = require('../db/init');
const { auth } = require('../middleware/auth');
const router = express.Router();

const SERVICE_TYPES = {
  legal: { title: '法律服务', description: '合同审查、尽职调查、法律意见书' },
  accounting: { title: '会计服务', description: '财务审计、资产评估、税务筹划' },
  tax: { title: '税务服务', description: '税务清算、税务合规审查、节税方案' },
  consulting: { title: '并购咨询', description: '交易结构设计、谈判支持、交割协助' },
};

const PLATFORM_FEE_RATE = 0.15; // 15% platform referral fee

// ── Expert Service CRUD ──────────────────────────────────────────────

// GET /expert-services/types — available service types
router.get('/types', (req, res) => {
  res.json({ success: true, data: SERVICE_TYPES });
});

// GET /expert-services — list user's expert service orders
router.get('/', auth, (req, res) => {
  const orders = all('SELECT * FROM expert_services WHERE user_id=? ORDER BY created_at DESC', [req.user.id]);
  res.json({ success: true, data: orders });
});

// POST /expert-services — create expert service order
router.post('/', auth, (req, res) => {
  const { deal_id, service_type, description, price } = req.body;
  if (!service_type || !SERVICE_TYPES[service_type]) return res.json({ success: false, error: '请选择服务类型' });
  if (!price || price < 6000 || price > 60000) return res.json({ success: false, error: '服务费用需在 ¥6,000 ~ ¥60,000 之间' });

  const platformFee = Math.round(price * PLATFORM_FEE_RATE * 100) / 100; // 15% platform fee
  const id = 'ES' + Date.now().toString(36) + require('crypto').randomBytes(2).toString('hex');
  const now = new Date().toISOString();

  run('INSERT INTO expert_services (id,user_id,deal_id,service_type,description,price,platform_fee,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
    [id, req.user.id, deal_id || null, service_type, description || '', price, platformFee, 'pending', now]);

  res.json({ success: true, data: { id, price, platform_fee: platformFee, expert_amount: price - platformFee } });
});

// POST /expert-services/:id/pay — pay from balance
router.post('/:id/pay', auth, (req, res) => {
  const order = get('SELECT * FROM expert_services WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  if (!order) return res.json({ success: false, error: '订单不存在' });
  if (order.status !== 'pending') return res.json({ success: false, error: '订单状态不正确' });

  const u = get('SELECT balance FROM users WHERE id=?', [req.user.id]);
  if (!u || u.balance < order.price) {
    return res.json({ success: false, error: '余额不足，需要 ¥' + order.price.toFixed(2), need_amount: order.price, balance: u ? u.balance : 0 });
  }

  const now = new Date().toISOString();
  try {
    transaction(() => {
      run('UPDATE users SET balance=balance-?,updated_at=? WHERE id=?', [order.price, now, req.user.id]);
      run('INSERT INTO payments (id,user_id,type,amount,balance_before,balance_after,pay_method,related_type,related_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [uuidv4(), req.user.id, 'expert_service', order.price, u.balance, u.balance - order.price, 'Balance', 'expert_service', order.id, now]);
      run('UPDATE expert_services SET status=?,pay_method=?,paid_at=? WHERE id=?', ['paid', 'Balance', now, order.id]);
    });
    res.json({ success: true, data: { price: order.price, platform_fee: order.platform_fee, balance_after: u.balance - order.price } });
  } catch (e) {
    res.status(500).json({ success: false, error: '支付失败' });
  }
});

// POST /expert-services/:id/pay/order — pay via WeChat/Alipay
router.post('/:id/pay/order', auth, async (req, res) => {
  const order = get('SELECT * FROM expert_services WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  if (!order) return res.json({ success: false, error: '订单不存在' });
  if (order.status !== 'pending') return res.json({ success: false, error: '订单状态不正确' });

  const { channel } = req.body;
  if (!['wechat_h5', 'alipay_h5'].includes(channel))
    return res.json({ success: false, error: 'Invalid channel' });

  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const paymentService = require('../services/payment');
  const result = await paymentService.createPaymentOrder(
    req.user.id,
    order.price,
    channel,
    ip,
    '专家服务 — ' + (SERVICE_TYPES[order.service_type]?.title || order.service_type),
    { businessType: 'expert_service', businessId: order.id }
  );

  if (!result.success) return res.json({ success: false, error: result.error });
  if (result.devPaid) {
    const now = new Date().toISOString();
    run('UPDATE expert_services SET status=?,pay_method=?,paid_at=? WHERE id=?', ['paid', channel, now, order.id]);
  }
  res.json({ success: true, data: { order_id: result.orderId, payment_url: result.paymentUrl, dev_paid: result.devPaid || false } });
});

// Admin: GET /expert-services/admin/all — all orders
router.get('/admin/all', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Admin only' });
  const { status, page, pageSize } = req.query;
  let sql = 'SELECT es.*, u.phone, u.name as user_name FROM expert_services es JOIN users u ON es.user_id=u.id WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND es.status=?'; params.push(status); }
  const countSql = sql.replace(/SELECT es\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const total = all(countSql, params)[0]?.total || 0;
  const pg = Math.max(1, parseInt(page) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize) || 50));
  sql += ' ORDER BY es.created_at DESC LIMIT ? OFFSET ?';
  params.push(ps, (pg - 1) * ps);
  res.json({ success: true, data: all(sql, params), pagination: { page: pg, pageSize: ps, total, totalPages: Math.ceil(total / ps) } });
});

// Admin: PUT /expert-services/:id/assign — assign expert
router.put('/:id/assign', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Admin only' });
  const { expert_name, expert_phone } = req.body;
  if (!expert_name || !expert_phone) return res.json({ success: false, error: '请填写专家信息' });

  const order = get('SELECT * FROM expert_services WHERE id=?', [req.params.id]);
  if (!order) return res.json({ success: false, error: '订单不存在' });
  if (order.status !== 'paid') return res.json({ success: false, error: '需先完成支付' });

  const now = new Date().toISOString();
  run('UPDATE expert_services SET expert_name=?,expert_phone=?,status=? WHERE id=?',
    [expert_name, expert_phone, 'assigned', req.params.id]);

  run('INSERT INTO messages (id,user_id,category,subject,body,related_type,related_id,created_at) VALUES (?,?,?,?,?,?,?,?)',
    [uuidv4(), order.user_id, 'system', '专家已分配',
     '您的' + (SERVICE_TYPES[order.service_type]?.title || '') + '专家已分配：' + expert_name + '，将在1个工作日内联系您。平台服务费：¥' + order.platform_fee.toFixed(2),
     'expert_service', order.id, now]);

  res.json({ success: true, data: { expert_name, expert_phone } });
});

// Admin: PUT /expert-services/:id/complete — mark as completed
router.put('/:id/complete', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Admin only' });
  const now = new Date().toISOString();
  run('UPDATE expert_services SET status=?,completed_at=? WHERE id=?', ['completed', now, req.params.id]);

  const order = get('SELECT user_id, service_type FROM expert_services WHERE id=?', [req.params.id]);
  if (order) {
    run('INSERT INTO messages (id,user_id,category,subject,body,related_type,related_id,created_at) VALUES (?,?,?,?,?,?,?,?)',
      [uuidv4(), order.user_id, 'system', '专家服务已完成',
       '您的' + (SERVICE_TYPES[order.service_type]?.title || '') + '服务已完成，如有问题请联系客服。',
       'expert_service', req.params.id, now]);
  }
  res.json({ success: true, data: { status: 'completed' } });
});

module.exports = router;
