/**
 * Diagnostic Orders — 估值诊断服务（免费，申请制）
 * 平台已转为免费审核制：高级会员免费申请，平台线下安排专家并联系。
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/init');
const { auth } = require('../middleware/auth');
const { requireAdvanced } = require('../middleware/advanced');
const router = express.Router();

const DIAGNOSTIC_PLANS = {
  basic: { title: '基础诊断', includes: ['项目概要书', '参考估值区间', '行业对比数据'] },
  standard: { title: '标准诊断', includes: ['基础诊断全部内容', '财务健康分析', '转让可行性评估', '专家一对一咨询'] },
  premium: { title: '高级诊断', includes: ['标准诊断全部内容', '深度尽职调查', '最优转让策略', '潜在买家匹配报告'] },
};

// ── Diagnostic Order CRUD ────────────────────────────────────────────

// GET /diagnostics — list user's diagnostic orders
router.get('/', auth, (req, res) => {
  const orders = all('SELECT * FROM diagnostic_orders WHERE user_id=? ORDER BY created_at DESC', [req.user.id]);
  res.json({ success: true, data: orders });
});

// GET /diagnostics/prices — 诊断方案（全部免费）
router.get('/prices', (req, res) => {
  res.json({ success: true, data: DIAGNOSTIC_PLANS, free: true, message: '平台已转为免费审核制，诊断服务免费申请' });
});

// POST /diagnostics — 申请免费诊断（需高级会员）
router.post('/', auth, requireAdvanced, (req, res) => {
  const { project_id, plan_type } = req.body;
  if (!project_id) return res.status(400).json({ success: false, error: '请选择关联项目' });
  if (!plan_type || !DIAGNOSTIC_PLANS[plan_type]) return res.status(400).json({ success: false, error: '请选择诊断方案' });

  // Verify project belongs to user
  const project = get('SELECT id FROM projects WHERE id=? AND user_id=?', [project_id, req.user.id]);
  if (!project) return res.status(404).json({ success: false, error: '项目不存在' });

  const id = 'DG' + Date.now().toString(36) + require('crypto').randomBytes(2).toString('hex');
  const now = new Date().toISOString();

  // Check for duplicate pending
  const existing = get("SELECT id FROM diagnostic_orders WHERE user_id=? AND project_id=? AND status='pending'", [req.user.id, project_id]);
  if (existing) return res.status(409).json({ success: false, error: '该项目已有申请中的诊断' });

  // 免费申请制：amount 恒为 0，平台审核后线下安排专家联系
  run('INSERT INTO diagnostic_orders (id,user_id,project_id,amount,status,pay_method,created_at) VALUES (?,?,?,?,?,?,?)',
    [id, req.user.id, project_id, 0, 'pending', 'Free', now]);

  res.json({ success: true, data: { id, amount: 0, plan_type }, message: '诊断申请已提交，平台将免费为您安排专家并线下联系' });
});

// POST /diagnostics/:id/pay — 已禁用：诊断服务免费
router.post('/:id/pay', auth, (req, res) => {
  res.status(410).json({ success: false, error: '平台已转为免费审核制，诊断服务免费，无需支付' });
});

// POST /diagnostics/:id/pay/order — 已禁用
router.post('/:id/pay/order', auth, (req, res) => {
  res.status(410).json({ success: false, error: '平台已转为免费审核制，诊断服务免费，无需支付' });
});

// Admin: GET /diagnostics/admin/all — all diagnostic orders (admin only)
// (registered in admin routes or separate mount)
router.get('/admin/all', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: '仅管理员可操作' });
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
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: '仅管理员可操作' });
  const { expert_name, expert_phone } = req.body;
  if (!expert_name || !expert_phone) return res.status(400).json({ success: false, error: '请填写专家信息' });

  const order = get('SELECT * FROM diagnostic_orders WHERE id=?', [req.params.id]);
  if (!order) return res.status(404).json({ success: false, error: '订单不存在' });
  if (order.status !== 'pending') return res.status(400).json({ success: false, error: '仅申请中的诊断可分配专家' });

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
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: '仅管理员可操作' });
  const order = get('SELECT * FROM diagnostic_orders WHERE id=?', [req.params.id]);
  if (!order) return res.status(404).json({ success: false, error: '订单不存在' });

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
