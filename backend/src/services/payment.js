/**
 * Payment Service — WeChat H5 + Alipay H5 with dev fallback
 *
 * 【已禁用】平台已转为免费审核制：所有支付下单/回调入口已在
 * routes/payments.js 统一返回 410，本模块不再被任何路由引用，
 * 仅保留作历史参考，切勿重新挂载。
 */
const crypto = require('crypto');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { run, get, transaction } = require('../db/init');
const config = require('../config');

const XMLParser = require('fast-xml-parser').XMLParser;
const XMLBuilder = require('fast-xml-parser').XMLBuilder;

// ── Utilities ──────────────────────────────────────────────────────

function generateOrderId() {
  // Cryptographically secure order ID (was Math.random(), predictable)
  return 'W' + Date.now().toString(36) + crypto.randomBytes(6).toString('hex');
}

function generateNonce(len = 32) {
  return crypto.randomBytes(len).toString('hex').slice(0, len);
}

function md5(str) {
  return crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase();
}

function safeEqual(a, b) {
  if (!a || !b) return false;
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

// ── XML Parser with size limit (prevents XML bomb attacks) ────────

const XML_MAX_SIZE = 128 * 1024; // 128 KB max XML payload
const XML_OPTIONS = { ignoreAttributes: false };

function safeParseXML(xmlStr) {
  if (!xmlStr || typeof xmlStr !== 'string') return null;
  if (Buffer.byteLength(xmlStr, 'utf8') > XML_MAX_SIZE) {
    console.error('[PAY XML] Payload exceeds size limit, rejected');
    return null;
  }
  try {
    const parser = new XMLParser(XML_OPTIONS);
    return parser.parse(xmlStr);
  } catch (e) {
    console.error('[PAY XML] Parse error:', e.message);
    return null;
  }
}

// WeChat: sort params alphabetically, join with &, append &key=xxx, MD5
function wechatSign(params, apiKey) {
  const sorted = Object.keys(params)
    .filter(k => k !== 'sign' && params[k] !== '' && params[k] !== undefined)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return md5(sorted + '&key=' + apiKey);
}

// Alipay: sort params, concat with &, RSA256 sign → base64
function alipaySign(params, privateKeyPem) {
  const sorted = Object.keys(params)
    .filter(k => k !== 'sign' && k !== 'sign_type' && params[k] !== '' && params[k] !== undefined)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(sorted, 'utf8');
  return sign.sign(privateKeyPem, 'base64');
}

function alipayVerify(params, signature, publicKeyPem) {
  const sorted = Object.keys(params)
    .filter(k => k !== 'sign' && k !== 'sign_type' && params[k] !== '' && params[k] !== undefined)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(sorted, 'utf8');
  return verify.verify(publicKeyPem, signature, 'base64');
}

// ── Production Guard ───────────────────────────────────────────────

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

// ── WeChat H5 ──────────────────────────────────────────────────────

function isWechatConfigured() {
  return !!(config.wechatAppId && config.wechatMchId && config.wechatApiKey);
}

async function wechatCreateOrder(amount, orderId, subject, ip) {
  if (!isWechatConfigured()) {
    if (!isProduction()) console.log(`[PAY DEV] WeChat not configured, order=${orderId}`);
    return { devMode: true, paymentUrl: `dev://wechat?orderId=${orderId}&amount=${amount}` };
  }

  const params = {
    appid: config.wechatAppId,
    mch_id: config.wechatMchId,
    nonce_str: generateNonce(),
    body: subject || 'xiaoweimm Recharge',
    out_trade_no: orderId,
    total_fee: Math.round(amount * 100), // yuan → fen
    spbill_create_ip: ip || '127.0.0.1',
    notify_url: config.wechatNotifyUrl,
    trade_type: 'MWEB',
    scene_info: JSON.stringify({ h5_info: { type: 'Wap', wap_url: config.alipayReturnUrl, wap_name: 'xiaoweimm' } }),
  };
  params.sign = wechatSign(params, config.wechatApiKey);

  const builder = new XMLBuilder({ ignoreAttributes: false, format: false });
  const xml = '<xml>' + builder.build(params) + '</xml>';

  const res = await axios.post('https://api.mch.weixin.qq.com/pay/unifiedorder', xml, {
    headers: { 'Content-Type': 'text/xml' },
    timeout: 10000,
  });

  const parsed = safeParseXML(res.data);
  if (!parsed || !parsed.xml) throw new Error('Invalid WeChat response');

  const result = parsed.xml;

  if (result.return_code !== 'SUCCESS' || result.result_code !== 'SUCCESS') {
    throw new Error(result.err_code_des || result.return_msg || 'WeChat order failed');
  }

  return { paymentUrl: result.mweb_url, outTradeNo: orderId };
}

function wechatVerifyCallback(xmlBody) {
  const parsed = safeParseXML(xmlBody);
  if (!parsed || !parsed.xml) {
    console.error('[WECHAT CB] XML parse failed or oversized');
    return null;
  }
  const data = parsed.xml;

  // Re-compute sign and compare
  const receivedSign = data.sign;
  const computed = wechatSign(data, config.wechatApiKey);

  if (!safeEqual(receivedSign, computed)) {
    console.error('[WECHAT CB] Sign mismatch');
    return null;
  }
  if (data.return_code !== 'SUCCESS') return null;

  return {
    outTradeNo: data.out_trade_no,
    transactionId: data.transaction_id,
    totalFee: parseInt(data.total_fee) / 100, // fen → yuan
    raw: data,
  };
}

// ── Alipay H5 ──────────────────────────────────────────────────────

function isAlipayConfigured() {
  return !!(config.alipayAppId && config.alipayPrivateKey && config.alipayPublicKey);
}

async function alipayCreateOrder(amount, orderId, subject) {
  if (!isAlipayConfigured()) {
    if (!isProduction()) console.log(`[PAY DEV] Alipay not configured, order=${orderId}`);
    return { devMode: true, paymentUrl: `dev://alipay?orderId=${orderId}&amount=${amount}` };
  }

  const bizContent = JSON.stringify({
    out_trade_no: orderId,
    total_amount: amount.toFixed(2),
    subject: subject || 'xiaoweimm Recharge',
    product_code: 'QUICK_WAP_WAY',
  });

  const params = {
    app_id: config.alipayAppId,
    method: 'alipay.trade.wap.pay',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, '+0800').replace(/T/, ' '),
    version: '1.0',
    notify_url: config.alipayNotifyUrl,
    return_url: config.alipayReturnUrl,
    biz_content: bizContent,
  };

  params.sign = alipaySign(params, config.alipayPrivateKey);

  const qs = Object.keys(params)
    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
    .join('&');

  const paymentUrl = 'https://openapi.alipay.com/gateway.do?' + qs;

  return { paymentUrl, outTradeNo: orderId };
}

function alipayVerifyCallback(params, signature) {
  if (!signature) return null;
  if (!alipayVerify(params, signature, config.alipayPublicKey)) {
    console.error('[ALIPAY CB] Sign mismatch');
    return null;
  }

  const tradeStatus = params.trade_status;
  if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') return null;

  return {
    outTradeNo: params.out_trade_no,
    transactionId: params.trade_no,
    totalFee: parseFloat(params.total_amount),
    raw: params,
  };
}

// ── Unified Service Interface ──────────────────────────────────────

// Maximum single payment amount (yuan) — prevents overflow and fraud
const MAX_PAYMENT_AMOUNT = 500000; // 500K yuan per transaction

/**
 * Create a payment order and get H5 payment URL.
 * @returns {{ success: boolean, orderId?: string, paymentUrl?: string, devPaid?: boolean, error?: string }}
 */
async function createPaymentOrder(userId, amount, channel, ip, subject, options = {}) {
  if (!amount || amount <= 0) return { success: false, error: 'Invalid amount' };
  if (amount > MAX_PAYMENT_AMOUNT) return { success: false, error: `单笔支付上限 ¥${MAX_PAYMENT_AMOUNT.toLocaleString()}` };
  if (!['wechat_h5', 'alipay_h5'].includes(channel)) return { success: false, error: 'Invalid channel' };

  const orderId = generateOrderId();
  const now = new Date().toISOString();
  const businessType = options.businessType || 'recharge';
  const businessId = options.businessId || '';

  // Insert pending order
  run(
    `INSERT INTO payment_orders (id, user_id, channel, amount, subject, business_type, business_id, status, created_at)
     VALUES (?,?,?,?,?,?,?,'pending',?)`,
    [orderId, userId, channel, amount, subject || 'Recharge', businessType, businessId, now]
  );

  // Call gateway
  try {
    let result;
    if (channel === 'wechat_h5') {
      result = await wechatCreateOrder(amount, orderId, subject, ip);
    } else {
      result = await alipayCreateOrder(amount, orderId, subject);
    }

    if (result.devMode) {
      // Dev mode: ONLY auto-fund if explicit env var is set AND not in production
      if (process.env.PAYMENT_DEV_AUTO_FUND === 'true' && !isProduction() && businessType === 'recharge') {
        const u = get('SELECT balance FROM users WHERE id = ?', [userId]);
        transaction(() => {
          run('UPDATE users SET balance = balance + ?, updated_at = ? WHERE id = ?', [amount, now, userId]);
          run(
            'INSERT INTO payments (id, user_id, type, amount, balance_before, balance_after, pay_method, status, related_type, related_id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
            [uuidv4(), userId, 'recharge', amount, u ? u.balance : 0, (u ? u.balance : 0) + amount, channel, 'completed', 'order', orderId, now]
          );
          run('UPDATE payment_orders SET status = ?, paid_at = ?, out_trade_no = ? WHERE id = ?',
            ['paid', now, 'dev_' + orderId, orderId]);
        });
        return { success: true, orderId, paymentUrl: result.paymentUrl, devPaid: true };
      }
      // Safe default: create pending order, user must manually approve or configure real payment
      if (!isProduction()) console.log(`[PAY DEV] Payment not configured. Order ${orderId} created as pending. Set PAYMENT_DEV_AUTO_FUND=true to auto-fund.`);
      return { success: true, orderId, paymentUrl: result.paymentUrl, devPaid: false };
    }

    // Update order with gateway info
    run('UPDATE payment_orders SET out_trade_no = ?, payment_url = ? WHERE id = ?',
      [result.outTradeNo, result.paymentUrl, orderId]);

    return { success: true, orderId, paymentUrl: result.paymentUrl };
  } catch (e) {
    run('UPDATE payment_orders SET status = ? WHERE id = ?', ['failed', orderId]);
    return { success: false, error: e.message };
  }
}

/**
 * Process a payment gateway callback.
 * Verifies: signature, order existence, amount match, idempotency.
 * @returns {{ success: boolean, message?: string }}
 */
function applyPaidOrder(order, verified, now) {
  const businessType = order.business_type || 'recharge';
  const businessId = order.business_id || '';

  run(
    'UPDATE payment_orders SET status = ?, paid_at = ?, callback_data = ? WHERE id = ?',
    ['paid', now, JSON.stringify(verified.raw), order.id]
  );

  if (businessType === 'recharge') {
    const u = get('SELECT balance FROM users WHERE id = ?', [order.user_id]);
    if (!u) throw new Error('User not found');
    run('UPDATE users SET balance = balance + ?, updated_at = ? WHERE id = ?', [order.amount, now, order.user_id]);
    run(
      'INSERT INTO payments (id, user_id, type, amount, balance_before, balance_after, pay_method, status, related_type, related_id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [uuidv4(), order.user_id, 'recharge', order.amount, u.balance, u.balance + order.amount, order.channel, 'completed', 'order', order.id, now]
    );
    return;
  }

  if (businessType === 'commission') {
    const bill = get(
      "SELECT id,status FROM bills WHERE user_id=? AND type='commission' AND related_type='deal' AND related_id=? ORDER BY created_at DESC LIMIT 1",
      [order.user_id, businessId]
    );
    if (!bill) throw new Error('Commission bill not found');
    if (bill.status !== 'paid') {
      run('UPDATE bills SET status=?,pay_time=? WHERE id=?', ['paid', now, bill.id]);
    }
    run(
      'INSERT INTO payments (id, user_id, type, amount, balance_before, balance_after, pay_method, status, related_type, related_id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [uuidv4(), order.user_id, 'commission', order.amount, null, null, order.channel, 'completed', 'deal', businessId, now]
    );
    return;
  }

  if (businessType === 'diagnostic') {
    run('UPDATE diagnostic_orders SET status=?, paid_at=? WHERE id=? AND user_id=?', ['paid', now, businessId, order.user_id]);
    run(
      'INSERT INTO payments (id, user_id, type, amount, balance_before, balance_after, pay_method, status, related_type, related_id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [uuidv4(), order.user_id, 'diagnostic', order.amount, null, null, order.channel, 'completed', 'diagnostic', businessId, now]
    );
    return;
  }

  if (businessType === 'expert_service') {
    run('UPDATE expert_services SET status=?, paid_at=? WHERE id=? AND user_id=?', ['paid', now, businessId, order.user_id]);
    run(
      'INSERT INTO payments (id, user_id, type, amount, balance_before, balance_after, pay_method, status, related_type, related_id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [uuidv4(), order.user_id, 'expert_service', order.amount, null, null, order.channel, 'completed', 'expert_service', businessId, now]
    );
    return;
  }

  throw new Error('Unsupported business type: ' + businessType);
}

function processPaymentCallback(channel, rawData) {
  let verified;

  if (channel === 'wechat_h5') {
    verified = wechatVerifyCallback(rawData);
  } else if (channel === 'alipay_h5') {
    const { sign, sign_type, ...params } = rawData;
    verified = alipayVerifyCallback(params, sign);
  } else {
    return { success: false, message: 'Unknown channel' };
  }

  if (!verified) {
    console.error(`[PAY CB] Verification failed for ${channel}`);
    return { success: false, message: 'Verification failed' };
  }

  // Lookup order
  const order = get('SELECT * FROM payment_orders WHERE out_trade_no = ?', [verified.outTradeNo]);
  if (!order) {
    console.error(`[PAY CB] Order not found: ${verified.outTradeNo}`);
    return { success: false, message: 'Order not found' };
  }

  // Verify callback amount matches order amount (prevents amount tampering)
  if (Math.abs(verified.totalFee - order.amount) > 0.01) {
    console.error(`[PAY CB] Amount mismatch: callback=${verified.totalFee} order=${order.amount}`);
    return { success: false, message: 'Amount mismatch' };
  }

  // Idempotency — prevent double-spend
  if (order.status === 'paid') {
    return { success: true, message: 'Already paid' };
  }

  const now = new Date().toISOString();

  // Use transaction for atomic balance update
  try {
    transaction(() => {
      applyPaidOrder(order, verified, now);
    });

    if (!isProduction()) console.log(`[PAY CB] Order ${order.id} paid via ${channel}, ¥${order.amount}`);
    return { success: true, message: 'OK' };
  } catch (e) {
    console.error('[PAY CB] Transaction failed:', e.message);
    return { success: false, message: 'Transaction failed' };
  }
}

module.exports = { createPaymentOrder, processPaymentCallback };
