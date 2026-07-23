const express = require('express');
const { get, all } = require('../db/init');
const { auth } = require('../middleware/auth');
const router = express.Router();

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

// POST /payments/order — 已禁用：平台已转为免费审核制，不再提供充值/支付下单
router.post('/order', auth, (req, res) => {
  res.status(410).json({ success: false, error: '平台已转为免费审核制，支付功能已下线' });
});

// GET /payments/order/:id — Query order status
router.get('/order/:id', auth, (req, res) => {
  const order = get(
    'SELECT id, channel, amount, subject, status, out_trade_no, created_at, paid_at FROM payment_orders WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (!order) return res.status(404).json({ success: false, error: '订单不存在' });
  res.json({ success: true, data: order });
});

// ── Payment Callbacks (已禁用：平台已转为免费审核制) ─────────────────

router.post('/callback/wechat', (req, res) => {
  res.set('Content-Type', 'text/xml');
  res.status(410).send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[平台已转为免费审核制，支付功能已下线]]></return_msg></xml>');
});

router.post('/callback/alipay', (req, res) => {
  res.status(410).send('fail');
});

// WeChat/Alipay return URL — 支付已下线，直接返回说明
router.get('/callback/wechat', (req, res) => {
  res.status(410).json({ success: false, error: '平台已转为免费审核制，支付功能已下线' });
});

router.get('/callback/alipay', (req, res) => {
  res.status(410).json({ success: false, error: '平台已转为免费审核制，支付功能已下线' });
});

// POST /payments/recharge — 已禁用
router.post('/recharge', auth, (req, res) => {
  res.status(410).json({ success: false, error: '平台已转为免费审核制，充值功能已下线' });
});

module.exports = router;
