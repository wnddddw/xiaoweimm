/**
 * Diagnostic Orders — Paid valuation diagnostic service for sellers
 * PRD: 3,000-15,000 yuan per diagnostic
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all, transaction } = require('../db/init');
const { auth } = require('../middleware/auth');
const router = express.Router();

const DIAGNOSTIC_PRICES = { basic: 3000, standard: 8000, premium: 15000 };

// ── Diagnostic Order CRUD ────────────────────────────────────────────

// GET /diagnostics — list user's diagnostic orders
router.get('/', auth, (req, res) => {
  const orders = all('SELECT * FROM diagnostic_orders WHERE user_id=? ORDER BY created_at DESC', [req.user.id]);
  res.json({ success: true, data: orders });
});

// GET /diagnostics/prices — available diagnostic plans
router.get('/prices', (req, res) => {
  res.json({
    success: true,
    data: {
      basic: { price: 3000, title: '基础诊断', includes: ['项目概要书', '参考估值区间', '行业对比数据'] },
      standard: { price: 8000, title: '标准诊断', includes: ['基础诊断全部内容', '财务健康分析', '转让可行性评估', '专家一对一咨询'] },
      premium: { price: 15000, title: '高级诊断', includes: ['标准诊断全部内容', '深度尽职调查', '最优转让策略', '潜在买家匹配报告'] },
    },
  });
});

// POST /diagnostics — create diagnostic order
router.post('/', auth, (req, res) => {
  const { project_id, plan_type, pay_method } = req.body;
  if (!project_id) return res.json({ success: false, error: '请选择关联项目' });
  if (!plan_type || !DIAGNOSTIC_PRICES[plan_type]) return res.json({ success: false, error: '请选择诊断方案' });

  // Verify project belongs to user
  const project = get('SELECT id FROM projects WHERE id=? AND user_id=?', [project_id, req.user.id]);
  if (!project) return res.json({ success: false, error: '项目不存在' });

  const amount = DIAGNOSTIC_PRICES[plan_type];
  const id = 'DG' + Date.now().toString(36) + require('crypto').randomBytes(2).toString('hex');
  const now = new Date().toISOString();

  // Check for duplicate pending
  const existing = get("SELECT id FROM diagnostic_orders WHERE user_id=? AND project_id=? AND status='pending'", [req.user.id, project_id]);
  if (existing) return res.json({ success: false, error: '该项目已有待支付的诊断订单' });

  run('INSERT INTO diagnostic_orders (id,user_id,project_id,amount,status,pay_method,created_at) VALUES (?,?,?,?,?,?,?)',
    [id, req.user.id, project_id, amount, 'pending', pay_method || 'Balance', now]);

  res.json({ success: true, data: { id, amount, plan_type } });
});

// POST /diagnostics/:id/pay — pay diagnostic order from balance
router.post('/:id/pay', auth, (req, res) => {
  const order = get('SELECT * FROM diagnostic_orders WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  if (!order) return res.json({ success: false, error: '订单不存在' });
  if (order.status !== 'pending') return res.json({ success: false, error: '订单状态不正确' });

  const u = get('SELECT balance FROM users WHERE id=?', [req.user.id]);
  if (!u || u.balance < order.amount) {
    return res.json({ success: false, error: '余额不足，需要 ¥' + order.amount.toFixed(2), need_amount: order.amount, balance: u ? u.balance : 0 });
  }

  const now = new Date().toISOString();
  try {
    transaction(() => {
      run('UPDATE users SET balance=balance-?,updated_at=? WHERE id=?', [order.amount, now, req.user.id]);
      run('INSERT INTO payments (id,user_id,type,amount,balance_before,balance_after,pay_method,related_type,related_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [uuidv4(), req.user.id, 'diagnostic', order.amount, u.balance, u.balance - order.amount, 'Balance', 'diagnostic', order.id, now]);
      run('UPDATE diagnostic_orders SET status=?,paid_at=? WHERE id=?', ['paid', now, order.id]);
    });
    res.json({ success: true, data: { amount: order.amount, balance_after: u.balance - order.amount } });
  } catch (e) {
    res.status(500).json({ success: false, error: '支付失败' });
  }
});

// POST /diagnostics/:id/pay/order — pay via WeChat/Alipay
router.post('/:id/pay/order', auth, async (req, res) => {
  const order = get('SELECT * FROM diagnostic_orders WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  if (!order) return res.json({ success: false, error: '订单不存在' });
  if (order.status !== 'pending') return res.json({ success: false, error: '订单状态不正确' });

  const { channel } = req.body;
  if (!['wechat_h5', 'alipay_h5'].includes(channel))
    return res.json({ success: false, error: 'Invalid channel' });

  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const paymentService = require('../services/payment');
  const result = await paymentService.createPaymentOrder(
    req.user.id,
    order.amount,
    channel,
    ip,
    '估值诊断 — ' + order.id,
    { businessType: 'diagnostic', businessId: order.id }
  );

  if (!result.success) return res.json({ success: false, error: result.error });
  if (result.devPaid) {
    // Auto-complete diagnostic payment in dev mode
    const now = new Date().toISOString();
    run('UPDATE diagnostic_orders SET status=?,paid_at=? WHERE id=?', ['paid', now, order.id]);
  }
  res.json({ success: true, data: { order_id: result.orderId, payment_url: result.paymentUrl, dev_paid: result.devPaid || false } });
});

// Admin: GET /diagnostics/admin/all — all diagnostic orders (admin only)
// (registered in admin routes or separate mount)
router.get('/admin/all', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Admin only' });
  const { status, page, pageSize } = req.query;
  let sql = 'SELECT d.*, u.phone, u.name as user_name, p.industry, p.province FROM diagnostic_orders d JOIN users u ON d.user_id=u.id LEFT JOIN projects p ON d.project_id=p.id WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND d.status=?'; params.push(status); }
  const countSql = sql.replace(/SELECT\s.+\sFROM/, 'SELECT COUNT(*) as total FROM').replace(/\sORDER\s+BY.+/, '').replace(/\sLIMIT\s.+/, '');
  const total = all(countSql, params)[0]?.total || 0;
  const pg = Math.max(1, parseInt(page) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize) || 50));
  sql += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
  params.push(ps, (pg - 1) * ps);
  res.json({ success: true, data: all(sql, params), pagination: { page: pg, pageSize: ps, total, totalPages: Math.ceil(total / ps) } });
});

// Admin: PUT /diagnostics/:id/assign — assign expert
router.put('/:id/assign', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Admin only' });
  const { expert_name, expert_phone } = req.body;
  if (!expert_name || !expert_phone) return res.json({ success: false, error: '请填写专家信息' });

  const order = get('SELECT * FROM diagnostic_orders WHERE id=?', [req.params.id]);
  if (!order) return res.json({ success: false, error: '订单不存在' });
  if (order.status !== 'paid') return res.json({ success: false, error: '需先完成支付' });

  const now = new Date().toISOString();
  run('UPDATE diagnostic_orders SET expert_name=?,expert_phone=?,status=?,assigned_at=? WHERE id=?',
    [expert_name, expert_phone, 'assigned', now, req.params.id]);

  // Notify user
  run('INSERT INTO messages (id,user_id,category,subject,body,related_type,related_id,created_at) VALUES (?,?,?,?,?,?,?,?)',
    [uuidv4(), order.user_id, 'system', '诊断专家已分配',
     '您的估值诊断已分配专家：' + expert_name + '（' + expert_phone + '），专家将在1个工作日内联系您。',
     'diagnostic', order.id, now]);

  res.json({ success: true, data: { expert_name, expert_phone } });
});

// Admin: PUT /diagnostics/:id/complete — upload report
router.put('/:id/complete', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Admin only' });
  const order = get('SELECT * FROM diagnostic_orders WHERE id=?', [req.params.id]);
  if (!order) return res.json({ success: false, error: '订单不存在' });

  const { report_url, report_summary } = req.body;
  const now = new Date().toISOString();
  run('UPDATE diagnostic_orders SET report_url=?,report_summary=?,status=?,completed_at=? WHERE id=?',
    [report_url || '', report_summary || '', 'completed', now, req.params.id]);

  run('INSERT INTO messages (id,user_id,category,subject,body,related_type,related_id,created_at) VALUES (?,?,?,?,?,?,?,?)',
    [uuidv4(), order.user_id, 'system', '诊断报告已完成',
     '您的估值诊断报告已完成' + (report_url ? '，点击查看：' + report_url : ''),
     'diagnostic', order.id, now]);

  res.json({ success: true, data: { status: 'completed' } });
});

module.exports = router;
