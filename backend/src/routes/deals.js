const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all, transaction } = require('../db/init');
const { auth } = require('../middleware/auth');
const router = express.Router();

// ── Deal CRUD ────────────────────────────────────────────────────────

router.get('/', auth, (req, res) => {
  const deals = req.user.role === 'admin' ? all('SELECT * FROM deals ORDER BY created_at DESC') : all('SELECT * FROM deals WHERE seller_id=? OR buyer_id=? ORDER BY created_at DESC', [req.user.id, req.user.id]);
  res.json({ success: true, data: deals });
});

router.post('/', auth, (req, res) => {
  const { project_id, seller_id, buyer_id, seller_name, buyer_name, price, advisor, note } = req.body;
  if (!project_id || !seller_name || !buyer_name || !price) return res.status(400).json({ success: false, error: '请填写所有字段' });
  const id = 'D' + Date.now().toString(36) + require('crypto').randomBytes(3).toString('hex'), now = new Date().toISOString(), st = JSON.stringify({ matching: now });
  run('INSERT INTO deals (id,project_id,seller_id,buyer_id,seller_name,buyer_name,price,advisor,note,stage,stage_time,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [id, project_id, seller_id || '', buyer_id || '', seller_name, buyer_name, price, advisor || 'Auto', note || '', 'matching', st, now, now]);
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

  const labels = { matching: 'Matching', nda: 'NDA', due_diligence: 'Due Diligence', contract: 'Contract', payment: 'Payment', handover: 'Handover', complete: 'Complete' };

  // ── Commission on deal completion ──
  if (stage === 'complete') {
    const finalPrice = req.body.final_price || d.final_price || d.price;
    const commission = Math.max(finalPrice * 0.02, 6000); // 2% or min 6000
    try {
      transaction(() => {
        // Update deal
        run('UPDATE deals SET stage=?,stage_time=?,updated_at=?,final_price=? WHERE id=?',
          [stage, JSON.stringify(st), now, finalPrice, req.params.id]);

        // Generate commission bill for buyer (if buyer_id exists)
        if (d.buyer_id) {
          const billId = uuidv4();
          run('INSERT INTO bills (id,user_id,type,item,amount,status,related_type,related_id,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
            [billId, d.buyer_id, 'commission', '成交佣金 — 交易 #' + req.params.id, commission, 'unpaid', 'deal', req.params.id, now]);

          // Send notification to buyer
          run('INSERT INTO messages (id,user_id,category,subject,body,related_type,related_id,created_at) VALUES (?,?,?,?,?,?,?,?)',
            [uuidv4(), d.buyer_id, 'system', '成交佣金待支付',
             '交易已完成，佣金金额：¥' + commission.toFixed(2) + '（成交价 ¥' + finalPrice.toFixed(2) + ' × 2%，最低 ¥6,000）',
             'deal', req.params.id, now]);
        }
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: '佣金计算失败' });
    }
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

// ── Pay Commission Bill ──────────────────────────────────────────────

// POST /deals/:id/pay-commission — pay the commission bill for a completed deal
router.post('/:id/pay-commission', auth, (req, res) => {
  const d = get('SELECT * FROM deals WHERE id=? AND (buyer_id=? OR seller_id=?)', [req.params.id, req.user.id, req.user.id]);
  if (!d) return res.status(404).json({ success: false, error: '交易不存在' });
  if (d.stage !== 'complete') return res.status(400).json({ success: false, error: '交易尚未完成' });

  const finalPrice = d.final_price || d.price;
  const commission = Math.max(finalPrice * 0.02, 6000);

  // Find the bill by related_type + related_id
  const bill = get("SELECT id, status FROM bills WHERE user_id=? AND type='commission' AND related_type='deal' AND related_id=? ORDER BY created_at DESC LIMIT 1",
    [d.buyer_id || req.user.id, req.params.id]);
  if (!bill) return res.status(404).json({ success: false, error: '未找到佣金账单' });
  if (bill.status === 'paid') return res.status(409).json({ success: false, error: '佣金已支付' });

  // Check balance
  const u = get('SELECT balance FROM users WHERE id=?', [req.user.id]);
  if (!u || u.balance < commission) {
    return res.status(400).json({ success: false, error: '余额不足，需要支付 ¥' + commission.toFixed(2), need_amount: commission, balance: u ? u.balance : 0 });
  }

  const now = new Date().toISOString();
  try {
    transaction(() => {
      run('UPDATE users SET balance=balance-?,updated_at=? WHERE id=?', [commission, now, req.user.id]);
      run('INSERT INTO payments (id,user_id,type,amount,balance_before,balance_after,pay_method,related_type,related_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [uuidv4(), req.user.id, 'commission', commission, u.balance, u.balance - commission, 'Balance', 'deal', req.params.id, now]);
      run('UPDATE bills SET status=?,pay_time=? WHERE id=?', ['paid', now, bill.id]);
    });
    res.json({ success: true, data: { commission, balance_after: u.balance - commission } });
  } catch (e) {
    res.status(500).json({ success: false, error: '支付失败' });
  }
});

// POST /deals/:id/pay-commission/order — pay commission via WeChat/Alipay
router.post('/:id/pay-commission/order', auth, async (req, res) => {
  const d = get('SELECT * FROM deals WHERE id=? AND (buyer_id=? OR seller_id=?)', [req.params.id, req.user.id, req.user.id]);
  if (!d) return res.status(404).json({ success: false, error: '交易不存在' });
  if (d.stage !== 'complete') return res.status(400).json({ success: false, error: '交易尚未完成' });

  const finalPrice = d.final_price || d.price;
  const commission = Math.max(finalPrice * 0.02, 6000);
  const { channel } = req.body;
  if (!['wechat_h5', 'alipay_h5'].includes(channel))
    return res.status(400).json({ success: false, error: '无效的支付渠道' });

  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const paymentService = require('../services/payment');
  const result = await paymentService.createPaymentOrder(
    req.user.id,
    commission,
    channel,
    ip,
    '成交佣金 — Deal #' + req.params.id,
    { businessType: 'commission', businessId: req.params.id }
  );

  if (!result.success) return res.status(500).json({ success: false, error: result.error });
  res.json({ success: true, data: { order_id: result.orderId, payment_url: result.paymentUrl, commission } });
});

module.exports = router;
