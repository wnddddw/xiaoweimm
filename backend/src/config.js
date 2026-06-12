require('dotenv').config();
const crypto = require('crypto');

/**
 * Load a secret from env, or auto-generate for development.
 * In production, missing secrets cause immediate startup failure.
 */
function getSecret(envName, purpose) {
  const value = process.env[envName];
  if (value && value.length >= 32) return value;

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    throw new Error(`FATAL: ${envName} not set or too short (required in production for ${purpose})`);
  }

  // Development fallback: auto-generate, warn loudly
  const generated = crypto.randomBytes(64).toString('hex');
  console.warn('');
  console.warn('================================================================');
  console.warn(`[DEV WARNING] ${envName} not set - auto-generated`);
  console.warn(`[DEV WARNING] Tokens will be invalidated on every server restart`);
  console.warn(`[DEV WARNING] Add to .env: ${envName}=${generated}`);
  console.warn('================================================================');
  console.warn('');
  return generated;
}

module.exports = {
  port: parseInt(process.env.PORT || '3001'),

  // JWT secrets - environment-aware
  jwtSecret: getSecret('JWT_SECRET', 'signing access tokens'),
  jwtRefreshSecret: getSecret('JWT_REFRESH_SECRET', 'signing refresh tokens'),
  jwtExpiresIn: '15m',
  jwtRefreshExpiresIn: '7d',
  smsCodeLength: 6,

  // Paths
  dbPath: process.env.DB_PATH || './data/xiaoweimm.db',
  uploadDir: process.env.UPLOAD_DIR || './uploads',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3002',

  // Aliyun SMS
  smsAccessKeyId: process.env.SMS_ACCESS_KEY_ID || '',
  smsAccessKeySecret: process.env.SMS_ACCESS_KEY_SECRET || '',
  smsSignName: process.env.SMS_SIGN_NAME || '',
  smsTemplateCode: process.env.SMS_TEMPLATE_CODE || '',
  smsDevMode: process.env.SMS_DEV_MODE === 'true',

  // WeChat Pay
  wechatAppId: process.env.WECHAT_APP_ID || '',
  wechatMchId: process.env.WECHAT_MCH_ID || '',
  wechatApiKey: process.env.WECHAT_API_KEY || '',
  wechatNotifyUrl: process.env.WECHAT_NOTIFY_URL || 'https://api.example.com/api/payments/callback/wechat',

  // Alipay
  alipayAppId: process.env.ALIPAY_APP_ID || '',
  alipayPrivateKey: process.env.ALIPAY_PRIVATE_KEY || '',
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
  alipayNotifyUrl: process.env.ALIPAY_NOTIFY_URL || 'https://api.example.com/api/payments/callback/alipay',
  alipayReturnUrl: process.env.ALIPAY_RETURN_URL || 'https://example.com/payment-result',
};
