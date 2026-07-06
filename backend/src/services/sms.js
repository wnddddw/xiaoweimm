/**
 * SMS Service — Aliyun SMS with rate limiting & dev fallback
 */
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/init');
const config = require('../config');

// ── In-memory rate limiter ──────────────────────────────────────────
const rateMap = new Map(); // phone → { lastSent, hourCount, hourWindow }

const RATE_COOLDOWN_MS = process.env.SMS_DEV_MODE === 'true' ? 0 : 60_000;
const RATE_HOUR_LIMIT = process.env.SMS_DEV_MODE === 'true' ? 999 : 5;
const RATE_IP_DAILY_LIMIT = process.env.SMS_DEV_MODE === 'true' ? 999 : 10;
const ipDaily = new Map();            // ip → { date, count }

function checkRateLimit(phone, ip) {
  const now = Date.now();
  const entry = rateMap.get(phone);

  // 60s cooldown
  if (entry && (now - entry.lastSent) < RATE_COOLDOWN_MS) {
    const remain = Math.ceil((RATE_COOLDOWN_MS - (now - entry.lastSent)) / 1000);
    return { ok: false, error: `请 ${remain} 秒后重试` };
  }

  // hourly limit
  if (entry && entry.hourWindow === Math.floor(now / 3_600_000)) {
    if (entry.hourCount >= RATE_HOUR_LIMIT) {
      return { ok: false, error: '请求过于频繁，请稍后重试' };
    }
  }

  // IP daily limit
  const today = new Date().toDateString();
  const ipEntry = ipDaily.get(ip);
  if (ipEntry && ipEntry.date === today && ipEntry.count >= RATE_IP_DAILY_LIMIT) {
    return { ok: false, error: '今日请求次数已达上限，请明天再试' };
  }

  return { ok: true };
}

function recordRate(phone, ip) {
  const now = Date.now();
  const hourWindow = Math.floor(now / 3_600_000);
  let entry = rateMap.get(phone);
  if (!entry || entry.hourWindow !== hourWindow) {
    entry = { lastSent: now, hourCount: 0, hourWindow };
  }
  entry.lastSent = now;
  entry.hourCount++;
  rateMap.set(phone, entry);

  const today = new Date().toDateString();
  let ipE = ipDaily.get(ip);
  if (!ipE || ipE.date !== today) ipE = { date: today, count: 0 };
  ipE.count++;
  ipDaily.set(ip, ipE);
}

// ── Code generation (cryptographically secure) ──────────────────────
function generateCode(length) {
  const crypto = require('crypto');
  let code = '';
  for (let i = 0; i < length; i++) code += crypto.randomInt(0, 10);
  return code;
}

// ── Aliyun SMS sender ─────────────────────────────────────────────
async function sendAliyunSms(phone, code) {
  // Dev mode fallback — no credentials configured
  if (!config.smsAccessKeyId || !config.smsAccessKeySecret || !config.smsSignName || !config.smsTemplateCode) {
    if (process.env.SMS_DEV_MODE !== 'true') {
      throw new Error('SMS service not configured. Set SMS_DEV_MODE=true for development bypass.');
    }
    console.log(`[SMS DEV] code sent to ***${phone.slice(-4)} (SMS_DEV_MODE enabled)`);
    return { success: true, devMode: true };
  }

  try {
    // Dynamically require Aliyun SDK to avoid crash when not installed
    const DysmsapiClient = require('@alicloud/dysmsapi20170525');
    const client = new DysmsapiClient({
      accessKeyId: config.smsAccessKeyId,
      accessKeySecret: config.smsAccessKeySecret,
      endpoint: 'dysmsapi.aliyuncs.com',
    });

    await client.sendSms({
      phoneNumbers: phone,
      signName: config.smsSignName,
      templateCode: config.smsTemplateCode,
      templateParam: JSON.stringify({ code }),
    });

    console.log(`[SMS] Sent to ***${phone.slice(-4)}`);
    return { success: true };
  } catch (err) {
    console.error(`[SMS ERROR] ${err.message}`);
    throw new Error('SMS send failed');
  }
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Send verification code to phone.
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
async function sendSmsCode(phone, ip) {
  // Validate
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return { success: false, error: '无效的手机号' };
  }

  // Rate limit
  const rate = checkRateLimit(phone, ip);
  if (!rate.ok) return { success: false, error: rate.error };

  // Generate code & expire time
  const code = generateCode(config.smsCodeLength);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60_000); // 5 min

  // Store hashed code in DB — never store plaintext
  const id = uuidv4();
  const codeHash = bcrypt.hashSync(code, 10);
  run(
    'INSERT INTO sms_codes (id, phone, code, expires_at, used, created_at) VALUES (?,?,?,?,0,?)',
    [id, phone, codeHash, expiresAt.toISOString(), now.toISOString()]
  );

  // Send via Aliyun (or console fallback)
  const result = await sendAliyunSms(phone, code);
  recordRate(phone, ip);

  if (result.devMode) {
    // NEVER return the code in the API response — log to server console only
    console.log(`[SMS DEV] Code for ***${phone.slice(-4)}: ${code} (DEV ONLY — use this code to login)`);
    return { success: true, data: { message: 'Dev mode — check server logs for code', dev_mode: true, expires_at: expiresAt.toISOString() } };
  }

  return { success: true, data: { message: 'Code sent', expires_at: expiresAt.toISOString() } };
}

/**
 * Verify SMS code against stored records.
 * @returns {boolean}
 */
function verifySmsCode(phone, code) {
  if (!phone || !code) return false;
  const now = new Date().toISOString();
  // Codes are hashed — retrieve all unexpired codes and compare with bcrypt
  const rows = all(
    'SELECT id, code FROM sms_codes WHERE phone = ? AND used = 0 AND expires_at > ? ORDER BY created_at DESC',
    [phone, now]
  );
  for (const row of rows) {
    if (bcrypt.compareSync(code, row.code)) {
      // Mark as used
      run('UPDATE sms_codes SET used = 1 WHERE id = ?', [row.id]);
      return true;
    }
  }
  return false;
}

/**
 * Clean up expired or used codes. Called periodically.
 */
function cleanExpiredCodes() {
  try {
    const now = new Date().toISOString();
    run("DELETE FROM sms_codes WHERE expires_at < ? OR used = 1", [now]);
  } catch (e) { /* ignore */ }
}

// Clean on load + every 30 minutes
cleanExpiredCodes();
setInterval(cleanExpiredCodes, 30 * 60_000);

module.exports = { sendSmsCode, verifySmsCode, cleanExpiredCodes };
