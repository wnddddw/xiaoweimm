const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all, transaction } = require('../db/init');
const { auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const { createRateLimit } = require('../middleware/rateLimit');
const paymentService = require('../services/payment');
const router = express.Router();

const MAX_RECHARGE_AMOUNT = 500000; // ¥500,000 max per recharge
const isProduction = () => process.env.NODE_ENV === 'production';
const allowManualRecharge = () => process.env.PAYMENT_ALLOW_MANUAL_RECHARGE === 'true';

// Rate limiter for recharge — 5 per hour per user
const rechargeLimiter = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyBy: 'ip',
});

// ── Balance & History ──────────────────────────────────────────────

router.get('/balance', auth, (req, res) => {
  res.json({ success: true, data: { balance: get('SELECT balance FROM users WHERE id=?', [req.user.id]).balance } });
});

router.get('/history', auth, (req, res) => {
  res.json({ success: true, data: all('SELECT * FROM payments WHERE user_id=? ORDER BY created_at DESC', [req.user.id]) });
});

router.get('/bills', auth, (req, res) => {
  res.json({ success: true, data: all('SELECT * FROM bills WHERE user_id=? ORDER BY created_at DESC', [req.user.id]) });
});

// ── Payment Order ──────────────────────────────────────────────────

// POST /payments/order — Create a payment order (WeChat H5 / Alipay H5)
router.post('/order', auth, async (req, res) => {
  const { amount, channel, subject } = req.body;
  if (!amount || amount <= 0) return res.json({ success: false, error: 'Invalid amount' });
  if (amount > MAX_RECHARGE_AMOUNT) return res.json({ success: false, error: `单笔上限 ¥${MAX_RECHARGE_AMOUNT.toLocaleString()}` });
  if (!['wechat_h5', 'alipay_h5'].includes(channel))
    return res.json({ success: false, error: 'Invalid channel' });

  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const result = await paymentService.createPaymentOrder(
    req.user.id, Number(amount), channel, ip, subject || 'Balance Recharge',
    { businessType: 'recharge' }
  );

  if (!result.success) return res.json({ success: false, error: result.error });
  res.json({ success: true, data: {
    order_id: result.orderId,
    payment_url: result.paymentUrl,
    dev_paid: result.devPaid || false,
  }});
});

// GET /payments/order/:id — Query order status
router.get('/order/:id', auth, (req, res) => {
  const order = get(
    'SELECT id, channel, amount, subject, business_type, business_id, status, out_trade_no, created_at, paid_at FROM payment_orders WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (!order) return res.json({ success: false, error: 'Order not found' });
  res.json({ success: true, data: order });
});

// ── Payment Callbacks (public — no auth, called by gateways) ───────

// WeChat async notify — receives raw XML body
router.post('/callback/wechat', (req, res) => {
  let rawBody;
  if (Buffer.isBuffer(req.body)) {
    rawBody = req.body.toString('utf8');
  } else {
    rawBody = req.body;
  }

  // Basic size check for raw XML body
  if (Buffer.byteLength(rawBody || '', 'utf8') > 128 * 1024) {
    console.error('[WECHAT CB] Payload too large, rejected');
    res.set('Content-Type', 'text/xml');
    return res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[Payload too large]]></return_msg></xml>');
  }

  if (!isProduction()) console.log('[WECHAT CB] received');
  const result = paymentService.processPaymentCallback('wechat_h5', rawBody);

  const resp = result.success
    ? '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>'
    : '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[' + result.message + ']]></return_msg></xml>';
  res.set('Content-Type', 'text/xml');
  res.send(resp);
});

// Alipay async notify — receives URL-encoded form data
router.post('/callback/alipay', (req, res) => {
  if (!isProduction()) console.log('[ALIPAY CB] received');
  const result = paymentService.processPaymentCallback('alipay_h5', req.body);
  res.send(result.success ? 'success' : 'fail');
});

// WeChat return URL — redirect user back to app/result page
router.get('/callback/wechat', (req, res) => {
  const { out_trade_no } = req.query;
  res.redirect(`/payment-result.html?order_id=${out_trade_no || ''}&channel=wechat`);
});

// Alipay return URL — redirect user back to app/result page
router.get('/callback/alipay', (req, res) => {
  const { out_trade_no } = req.query;
  res.redirect(`/payment-result.html?order_id=${out_trade_no || ''}&channel=alipay`);
});

// ── Recharge (DEV ONLY — requires admin in production) ─────────────

// POST /payments/recharge — manual balance recharge
// Manual recharge is disabled unless PAYMENT_ALLOW_MANUAL_RECHARGE=true.
router.post('/recharge', auth, rechargeLimiter, (req, res) => {
  if (!allowManualRecharge()) {
    return res.status(403).json({ success: false, error: 'Manual recharge is disabled' });
  }
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Only admins can manually recharge' });
  }

  const { amount, pay_method } = req.body;
  if (!amount || amount <= 0) return res.json({ success: false, error: 'Invalid amount' });
  if (amount > MAX_RECHARGE_AMOUNT) return res.json({ success: false, error: `单笔充值上限 ¥${MAX_RECHARGE_AMOUNT.toLocaleString()}` });

  const now = new Date().toISOString();

  try {
    transaction(() => {
      const u = get('SELECT balance FROM users WHERE id=?', [req.user.id]);
      if (!u) return res.json({ success: false, error: '用户不存在' });

      run('UPDATE users SET balance=balance+?,updated_at=? WHERE id=?', [amount, now, req.user.id]);
      run('INSERT INTO payments (id,user_id,type,amount,balance_before,balance_after,pay_method,created_at) VALUES (?,?,?,?,?,?,?,?)',
        [uuidv4(), req.user.id, 'recharge', amount, u.balance, u.balance + amount, pay_method || 'Admin', now]);
    });

    if (!isProduction()) console.log(`[DEV RECHARGE] User ${req.user.phone?.slice(-4)} +¥${amount}`);
    res.json({ success: true, data: { balance: get('SELECT balance FROM users WHERE id=?', [req.user.id]).balance } });
  } catch (e) {
    res.status(500).json({ success: false, error: '充值失败，请重试' });
  }
});

module.exports = router;
