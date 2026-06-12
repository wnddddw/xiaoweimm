const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/init');
const { auth } = require('../middleware/auth');
const paymentService = require('../services/payment');
const router = express.Router();

// ── Balance & History (existing) ─────────────────────────────────────

router.get('/balance', auth, (req, res) => {
  res.json({ success: true, data: { balance: get('SELECT balance FROM users WHERE id=?', [req.user.id]).balance } });
});

router.get('/history', auth, (req, res) => {
  res.json({ success: true, data: all('SELECT * FROM payments WHERE user_id=? ORDER BY created_at DESC', [req.user.id]) });
});

router.get('/bills', auth, (req, res) => {
  res.json({ success: true, data: all('SELECT * FROM bills WHERE user_id=? ORDER BY created_at DESC', [req.user.id]) });
});

// ── Payment Order (new) ──────────────────────────────────────────────

// POST /payments/order — Create a payment order (WeChat H5 / Alipay H5)
router.post('/order', auth, async (req, res) => {
  const { amount, channel, subject } = req.body;
  if (!amount || amount <= 0) return res.json({ success: false, error: 'Invalid amount' });
  if (!['wechat_h5', 'alipay_h5'].includes(channel))
    return res.json({ success: false, error: 'Invalid channel' });

  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const result = await paymentService.createPaymentOrder(
    req.user.id, Number(amount), channel, ip, subject || 'Balance Recharge'
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
    'SELECT id, channel, amount, subject, status, out_trade_no, created_at, paid_at FROM payment_orders WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (!order) return res.json({ success: false, error: 'Order not found' });
  res.json({ success: true, data: order });
});

// ── Payment Callbacks (public — no auth) ─────────────────────────────

// WeChat async notify — receives raw XML body
router.post('/callback/wechat', (req, res) => {
  let rawBody;
  if (Buffer.isBuffer(req.body)) {
    rawBody = req.body.toString('utf8');
  } else {
    rawBody = req.body;
  }
  console.log('[WECHAT CB]', rawBody);
  const result = paymentService.processPaymentCallback('wechat_h5', rawBody);

  // WeChat expects XML response
  const resp = result.success
    ? '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>'
    : '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[' + result.message + ']]></return_msg></xml>';
  res.set('Content-Type', 'text/xml');
  res.send(resp);
});

// Alipay async notify — receives URL-encoded form data
router.post('/callback/alipay', (req, res) => {
  console.log('[ALIPAY CB]', req.body);
  const result = paymentService.processPaymentCallback('alipay_h5', req.body);
  // Alipay expects literal 'success' or 'fail'
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

// ── Direct recharge (dev fallback) ───────────────────────────────────
router.post('/recharge', auth, (req, res) => {
  const { amount, pay_method } = req.body;
  if (!amount || amount <= 0) return res.json({ success: false, error: 'Invalid amount' });
  const u = get('SELECT balance FROM users WHERE id=?', [req.user.id]),
    now = new Date().toISOString();
  run('UPDATE users SET balance=balance+?,updated_at=? WHERE id=?', [amount, now, req.user.id]);
  run('INSERT INTO payments (id,user_id,type,amount,balance_before,balance_after,pay_method,created_at) VALUES (?,?,?,?,?,?,?,?)',
    [uuidv4(), req.user.id, 'recharge', amount, u.balance, u.balance + amount, pay_method || 'WeChat', now]);
  res.json({ success: true, data: { balance: u.balance + amount } });
});

module.exports = router;
