const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/init');
const { auth } = require('../middleware/auth');
const { requireAdvanced } = require('../middleware/advanced');
const router = express.Router();

// ── Deal CRUD ────────────────────────────────────────────────────────

router.get('/', auth, (req, res) => {
  const deals = req.user.role === 'admin' ? all('SELECT * FROM deals ORDER BY created_at DESC') : all('SELECT * FROM deals WHERE seller_id=? OR buyer_id=? ORDER BY created_at DESC', [req.user.id, req.user.id]);
  res.json({ success: true, data: deals });
});

router.post('/', auth, requireAdvanced, (req, res) => {
  const { project_id, seller_id, buyer_id, seller_name, buyer_name, price, advisor, note } = req.body;
  if (!project_id || !seller_name || !buyer_name || !price) return res.status(400).json({ success: false, error: '请填写所有字段' });
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum <= 0) return res.status(400).json({ success: false, error: '交易价格无效' });

  // 项目归属校验：项目必须存在，卖方默认取项目所有者
  const project = get('SELECT id, user_id FROM projects WHERE id=?', [project_id]);
  if (!project) return res.status(404).json({ success: false, error: '项目不存在' });
  const sellerId = project.user_id;

  // 参与方校验：创建者必须是 admin、项目所有者（卖方）或指定买方
  const buyerId = buyer_id || '';
  if (req.user.role !== 'admin' && req.user.id !== sellerId && (!buyerId || req.user.id !== buyerId)) {
    return res.status(403).json({ success: false, error: '无权为该交易项目创建交易' });
  }
  if (buyerId && !get('SELECT id FROM users WHERE id=?', [buyerId])) {
    return res.status(400).json({ success: false, error: '买方用户不存在' });
  }

  const id = 'D' + Date.now().toString(36) + require('crypto').randomBytes(3).toString('hex'), now = new Date().toISOString(), st = JSON.stringify({ matching: now });
  run('INSERT INTO deals (id,project_id,seller_id,buyer_id,seller_name,buyer_name,price,advisor,note,stage,stage_time,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [id, project_id, sellerId, buyerId, seller_name, buyer_name, priceNum, advisor || 'Auto', note || '', 'matching', st, now, now]);
  run('INSERT INTO deal_events (id,deal_id,stage,action,detail,created_at) VALUES (?,?,?,?,?,?)',
    [uuidv4(), id, 'matching', 'Deal Created', seller_name + ' <-> ' + buyer_name + ', price ' + price, now]);
  res.json({ success: true, data: get('SELECT * FROM deals WHERE id=?', [id]) });
});

router.get('/:id', auth, (req, res) => {
  const d = get('SELECT * FROM deals WHERE id=?', [req.params.id]);
  if (!d) return res.status(404).json({ success: false, error: '交易不存在' });
  res.json({ success: true, data: d });
});

router.patch('/:id/stage', auth, (req, res) => {
  const d = get('SELECT * FROM deals WHERE id=?', [req.params.id]);
  if (!d) return res.status(404).json({ success: false, error: '交易不存在' });
  // Authorization: only seller, buyer, or admin of this deal can advance stage
  if (d.seller_id !== req.user.id && d.buyer_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: '无权操作此交易' });
  }
  const stage = req.body.stage, now = new Date().toISOString();
  let st = {};
  try { st = JSON.parse(d.stage_time || '{}'); } catch (e) { st = {}; }
  st[stage] = now;

  const labels = { matching: '匹配沟通', nda: '保密协议', due_diligence: '尽职调查', contract: '合同签署', handover: '交割移交', complete: '交易完成' };

  // 平台已转为免费审核制：交易完成不再计算成交佣金
  if (stage === 'complete') {
    const finalPrice = Number(req.body.final_price || d.final_price || d.price);
    run('UPDATE deals SET stage=?,stage_time=?,updated_at=?,final_price=? WHERE id=?',
      [stage, JSON.stringify(st), now, finalPrice, req.params.id]);
  } else {
    run('UPDATE deals SET stage=?,stage_time=?,updated_at=? WHERE id=?',
      [stage, JSON.stringify(st), now, req.params.id]);
  }

  run('INSERT INTO deal_events (id,deal_id,stage,action,detail,created_at) VALUES (?,?,?,?,?,?)',
    [uuidv4(), req.params.id, stage, 'Stage: ' + (labels[stage] || stage),
     'Advanced to ' + (labels[stage] || stage), now]);

  res.json({ success: true });
});

router.get('/:id/timeline', auth, (req, res) => {
  res.json({ success: true, data: all('SELECT * FROM deal_events WHERE deal_id=? ORDER BY created_at DESC', [req.params.id]) });
});

// ── 成交佣金支付（已下线：平台免费，不再收取佣金）─────────────────────

router.post('/:id/pay-commission', auth, (req, res) => {
  res.status(410).json({ success: false, error: '平台已转为免费审核制，成交佣金已取消' });
});

router.post('/:id/pay-commission/order', auth, (req, res) => {
  res.status(410).json({ success: false, error: '平台已转为免费审核制，成交佣金已取消' });
});

module.exports = router;
