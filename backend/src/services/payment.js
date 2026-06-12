/**
 * Payment Service — WeChat H5 + Alipay H5 with dev fallback
 */
const crypto = require('crypto');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { run, get } = require('../db/init');
const config = require('../config');

// Aliyun SDK re-export for sms service access
const XMLParser = require('fast-xml-parser').XMLParser;
const XMLBuilder = require('fast-xml-parser').XMLBuilder;

// ── Utilities ──────────────────────────────────────────────────────

function generateOrderId() {
  return 'W' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function generateNonce(len = 32) {
  return crypto.randomBytes(len).toString('hex').slice(0, len);
}

function md5(str) {
  return crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase();
}

function sha256(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex').toUpperCase();
}

function hmacSha256(str, key) {
  return crypto.createHmac('sha256', key).update(str, 'utf8').digest('hex').toUpperCase();
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

// ── WeChat H5 ──────────────────────────────────────────────────────

function isWechatConfigured() {
  return !!(config.wechatAppId && config.wechatMchId && config.wechatApiKey);
}

async function wechatCreateOrder(amount, orderId, subject, ip) {
  if (!isWechatConfigured()) {
    if (process.env.NODE_ENV !== 'production') console.log(`[PAY DEV] WeChat not configured, order=${orderId}`);
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

  const parser = new XMLParser({ ignoreAttributes: false });
  const result = parser.parse(res.data).xml;

  if (result.return_code !== 'SUCCESS' || result.result_code !== 'SUCCESS') {
    throw new Error(result.err_code_des || result.return_msg || 'WeChat order failed');
  }

  return { paymentUrl: result.mweb_url, outTradeNo: orderId };
}

function wechatVerifyCallback(xmlBody) {
  const parser = new XMLParser({ ignoreAttributes: false });
  const data = parser.parse(xmlBody).xml;

  // Re-compute sign and compare
  const receivedSign = data.sign;
  const computed = wechatSign(data, config.wechatApiKey);

  if (receivedSign !== computed) {
    console.error('[WECHAT CB] Sign mismatch');
    return null;
  }
  if (data.return_code !== 'SUCCESS') return null;

  return {
    outTradeNo: data.out_trade_no,
    transactionId: data.transaction_id,
    totalFee: parseInt(data.total_fee) / 100,
    raw: data,
  };
}

// ── Alipay H5 ──────────────────────────────────────────────────────

function isAlipayConfigured() {
  return !!(config.alipayAppId && config.alipayPrivateKey && config.alipayPublicKey);
}

async function alipayCreateOrder(amount, orderId, subject) {
  if (!isAlipayConfigured()) {
    if (process.env.NODE_ENV !== 'production') console.log(`[PAY DEV] Alipay not configured, order=${orderId}`);
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

/**
 * Create a payment order and get H5 payment URL.
 * @returns {{ success: boolean, orderId?: string, paymentUrl?: string, error?: string }}
 */
async function createPaymentOrder(userId, amount, channel, ip, subject) {
  if (!amount || amount <= 0) return { success: false, error: 'Invalid amount' };
  if (!['wechat_h5', 'alipay_h5'].includes(channel)) return { success: false, error: 'Invalid channel' };

  const orderId = generateOrderId();
  const now = new Date().toISOString();

  // Insert pending order
  run(
    `INSERT INTO payment_orders (id, user_id, channel, amount, subject, status, created_at)
     VALUES (?,?,?,?,?,'pending',?)`,
    [orderId, userId, channel, amount, subject || 'Recharge', now]
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
      // Dev mode: ONLY auto-fund if explicit env var is set, otherwise just record pending order
      if (process.env.PAYMENT_DEV_AUTO_FUND === 'true') {
        const u = get('SELECT balance FROM users WHERE id = ?', [userId]);
        run('UPDATE users SET balance = balance + ?, updated_at = ? WHERE id = ?', [amount, now, userId]);
        run(
          'INSERT INTO payments (id, user_id, type, amount, balance_before, balance_after, pay_method, status, related_type, related_id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
          [uuidv4(), userId, 'recharge', amount, u ? u.balance : 0, (u ? u.balance : 0) + amount, channel, 'completed', 'order', orderId, now]
        );
        run('UPDATE payment_orders SET status = ?, paid_at = ?, out_trade_no = ? WHERE id = ?',
          ['paid', now, 'dev_' + orderId, orderId]);
        return { success: true, orderId, paymentUrl: result.paymentUrl, devPaid: true };
      }
      // Safe default: create pending order, user must manually approve or configure real payment
      console.log(`[PAY DEV] Payment not configured. Order ${orderId} created as pending. Set PAYMENT_DEV_AUTO_FUND=true to auto-fund.`);
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
 * @returns {{ success: boolean, message?: string }}
 */
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

  // Idempotency
  if (order.status === 'paid') {
    return { success: true, message: 'Already paid' };
  }

  const now = new Date().toISOString();

  // Update order
  run(
    'UPDATE payment_orders SET status = ?, paid_at = ?, callback_data = ? WHERE id = ?',
    ['paid', now, JSON.stringify(verified.raw), order.id]
  );

  // Update user balance
  const u = get('SELECT balance FROM users WHERE id = ?', [order.user_id]);
  if (u) {
    run('UPDATE users SET balance = balance + ?, updated_at = ? WHERE id = ?', [order.amount, now, order.user_id]);
    run(
      'INSERT INTO payments (id, user_id, type, amount, balance_before, balance_after, pay_method, status, related_type, related_id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [uuidv4(), order.user_id, 'recharge', order.amount, u.balance, u.balance + order.amount, order.channel, 'completed', 'order', order.id, now]
    );
  }

  if (process.env.NODE_ENV !== 'production') console.log(`[PAY CB] Order ${order.id} paid via ${channel}`);
  return { success: true, message: 'OK' };
}

module.exports = { createPaymentOrder, processPaymentCallback };
