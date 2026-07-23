/**
 * Expert Services — 平台转介专家服务（法律/会计/税务/并购咨询）
 * 平台已转为免费审核制：高级会员免费提交需求，平台线下对接专家。
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/init');
const { auth } = require('../middleware/auth');
const { requireAdvanced } = require('../middleware/advanced');
const router = express.Router();

const SERVICE_TYPES = {
  legal: { title: '法律服务', description: '合同审查、尽职调查、法律意见书' },
  accounting: { title: '会计服务', description: '财务审计、资产评估、税务筹划' },
  tax: { title: '税务服务', description: '税务清算、税务合规审查、节税方案' },
  consulting: { title: '并购咨询', description: '交易结构设计、谈判支持、交割协助' },
};

// ── Expert Service CRUD ──────────────────────────────────────────────

// GET /expert-services/types — available service types
router.get('/types', (req, res) => {
  res.json({ success: true, data: SERVICE_TYPES, free: true, message: '平台已转为免费审核制，专家服务免费申请，平台线下对接' });
});

// GET /expert-services — list user's expert service orders
router.get('/', auth, (req, res) => {
  const orders = all('SELECT * FROM expert_services WHERE user_id=? ORDER BY created_at DESC', [req.user.id]);
  res.json({ success: true, data: orders });
});

// POST /expert-services — 申请专家服务（免费，需高级会员）
router.post('/', auth, requireAdvanced, (req, res) => {
  const { deal_id, service_type, description } = req.body;
  if (!service_type || !SERVICE_TYPES[service_type]) return res.status(400).json({ success: false, error: '请选择服务类型' });
  if (!description || !description.trim()) return res.status(400).json({ success: false, error: '请填写需求说明，平台将线下与您联系' });

  const id = 'ES' + Date.now().toString(36) + require('crypto').randomBytes(2).toString('hex');
  const now = new Date().toISOString();

  // 免费申请制：price/platform_fee 恒为 0
  run('INSERT INTO expert_services (id,user_id,deal_id,service_type,description,price,platform_fee,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
    [id, req.user.id, deal_id || null, service_type, description.trim(), 0, 0, 'pending', now]);

  res.json({ success: true, data: { id, price: 0, platform_fee: 0 }, message: '服务申请已提交，平台将免费为您对接专家并线下联系' });
});

// POST /expert-services/:id/pay — 已禁用：专家服务免费
router.post('/:id/pay', auth, (req, res) => {
  res.status(410).json({ success: false, error: '平台已转为免费审核制，专家服务免费，无需支付' });
});

// POST /expert-services/:id/pay/order — 已禁用
router.post('/:id/pay/order', auth, (req, res) => {
  res.status(410).json({ success: false, error: '平台已转为免费审核制，专家服务免费，无需支付' });
});

// Admin: GET /expert-services/admin/all — all orders
router.get('/admin/all', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: '仅管理员可操作' });
  const { status, page, pageSize } = req.query;
  let sql = 'SELECT es.*, u.phone, u.name as user_name FROM expert_services es JOIN users u ON es.user_id=u.id WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND es.status=?'; params.push(status); }
  const countSql = sql.replace(/SELECT\s.+\sFROM/, 'SELECT COUNT(*) as total FROM').replace(/\sORDER\s+BY.+/, '').replace(/\sLIMIT\s.+/, '');
  const total = all(countSql, params)[0]?.total || 0;
  const pg = Math.max(1, parseInt(page) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize) || 50));
  sql += ' ORDER BY es.created_at DESC LIMIT ? OFFSET ?';
  params.push(ps, (pg - 1) * ps);
  res.json({ success: true, data: all(sql, params), pagination: { page: pg, pageSize: ps, total, totalPages: Math.ceil(total / ps) } });
});

// Admin: PUT /expert-services/:id/assign — assign expert
router.put('/:id/assign', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: '仅管理员可操作' });
  const { expert_name, expert_phone } = req.body;
  if (!expert_name || !expert_phone) return res.status(400).json({ success: false, error: '请填写专家信息' });

  const order = get('SELECT * FROM expert_services WHERE id=?', [req.params.id]);
  if (!order) return res.status(404).json({ success: false, error: '订单不存在' });
  if (order.status !== 'pending') return res.status(400).json({ success: false, error: '仅申请中的服务可分配专家' });

  const now = new Date().toISOString();
  run('UPDATE expert_services SET expert_name=?,expert_phone=?,status=? WHERE id=?',
    [expert_name, expert_phone, 'assigned', req.params.id]);

  run('INSERT INTO messages (id,user_id,category,subject,body,related_type,related_id,created_at) VALUES (?,?,?,?,?,?,?,?)',
    [uuidv4(), order.user_id, 'system', '专家已分配',
     '您的' + (SERVICE_TYPES[order.service_type]?.title || '') + '专家已分配：' + expert_name + '，将在1个工作日内免费与您联系。',
     'expert_service', order.id, now]);

  res.json({ success: true, data: { expert_name, expert_phone } });
});

// Admin: PUT /expert-services/:id/complete — mark as completed
router.put('/:id/complete', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: '仅管理员可操作' });
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
