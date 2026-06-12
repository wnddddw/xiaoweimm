/**
 * OAuth Service — WeChat & Alipay third-party login with dev-mode fallback
 */
const crypto = require('crypto');
const axios = require('axios');
const config = require('../config');

// ── Helpers ──────────────────────────────────────────────────────────
function isWechatOAuthConfigured() {
  return !!(config.wechatOAuthAppId && config.wechatOAuthSecret);
}

function isAlipayOAuthConfigured() {
  return !!(config.alipayOAuthAppId && config.alipayOAuthPrivateKey);
}

function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

// ── WeChat OAuth ─────────────────────────────────────────────────────

/**
 * Build WeChat Open Platform QR Connect authorization URL.
 * Dev mode: returns a mock dev:// URL.
 */
function getWechatAuthUrl(redirectUri, state) {
  if (!isWechatOAuthConfigured()) {
    const devState = state || generateState();
    return `dev://wechat-oauth?appid=wx_dev&redirect_uri=${encodeURIComponent(redirectUri)}&state=${devState}&response_type=code&scope=snsapi_login`;
  }
  const params = new URLSearchParams({
    appid: config.wechatOAuthAppId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'snsapi_login',
    state: state || generateState(),
  });
  return `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`;
}

/**
 * Exchange authorization code for access token.
 * Returns { openid, unionid?, access_token, refresh_token }.
 * Dev mode: returns mock data.
 */
async function wechatGetAccessToken(code) {
  if (!isWechatOAuthConfigured()) {
    return {
      openid: 'dev_wechat_' + code.slice(0, 8),
      unionid: 'dev_union_' + code.slice(0, 8),
      access_token: 'dev_access_token',
      refresh_token: 'dev_refresh_token',
    };
  }
  const res = await axios.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
    params: {
      appid: config.wechatOAuthAppId,
      secret: config.wechatOAuthSecret,
      code,
      grant_type: 'authorization_code',
    },
  });
  if (res.data.errcode) throw new Error(res.data.errmsg || 'WeChat OAuth failed');
  return res.data;
}

/**
 * Get WeChat user info.
 * Returns { openid, nickname, headimgurl, unionid? }.
 */
async function wechatGetUserInfo(accessToken, openId) {
  if (!isWechatOAuthConfigured()) {
    return {
      openid: openId || 'dev_open_id',
      nickname: '微信用户',
      headimgurl: '',
      unionid: 'dev_union',
    };
  }
  const res = await axios.get('https://api.weixin.qq.com/sns/userinfo', {
    params: { access_token: accessToken, openid: openId },
  });
  if (res.data.errcode) throw new Error(res.data.errmsg || 'WeChat userinfo failed');
  return res.data;
}

// ── Alipay OAuth ─────────────────────────────────────────────────────

/**
 * Build Alipay Open Platform authorization URL.
 * Dev mode: returns a mock dev:// URL.
 */
function getAlipayAuthUrl(redirectUri, state) {
  if (!isAlipayOAuthConfigured()) {
    const devState = state || generateState();
    return `dev://alipay-oauth?app_id=alipay_dev&redirect_uri=${encodeURIComponent(redirectUri)}&state=${devState}&scope=auth_user`;
  }
  const params = new URLSearchParams({
    app_id: config.alipayOAuthAppId,
    redirect_uri: redirectUri,
    scope: 'auth_user',
    state: state || generateState(),
  });
  return `https://openauth.alipay.com/oauth2/publicAppAuthorize.htm?${params.toString()}`;
}

/**
 * Exchange authorization code for Alipay access token.
 * Returns { user_id, access_token, refresh_token }.
 */
async function alipayGetAccessToken(code) {
  if (!isAlipayOAuthConfigured()) {
    return {
      user_id: 'dev_alipay_' + code.slice(0, 8),
      access_token: 'dev_access_token',
      refresh_token: 'dev_refresh_token',
    };
  }
  const params = {
    app_id: config.alipayOAuthAppId,
    method: 'alipay.system.oauth.token',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14),
    version: '1.0',
    grant_type: 'authorization_code',
    code,
  };
  // Build signature
  const signContent = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  const sign = crypto.createSign('RSA-SHA256').update(signContent).sign(config.alipayOAuthPrivateKey, 'base64');
  params.sign = sign;

  const res = await axios.get('https://openapi.alipay.com/gateway.do', { params });
  const body = res.data;
  if (body.alipay_system_oauth_token_response) {
    return body.alipay_system_oauth_token_response;
  }
  throw new Error(body.error_response?.sub_msg || 'Alipay OAuth failed');
}

/**
 * Get Alipay user info.
 * Returns { user_id, avatar?, nick_name? }.
 */
async function alipayGetUserInfo(accessToken) {
  if (!isAlipayOAuthConfigured()) {
    return {
      user_id: 'dev_alipay_user',
      avatar: '',
      nick_name: '支付宝用户',
    };
  }
  const params = {
    app_id: config.alipayOAuthAppId,
    method: 'alipay.user.info.share',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14),
    version: '1.0',
    auth_token: accessToken,
  };
  const signContent = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  const sign = crypto.createSign('RSA-SHA256').update(signContent).sign(config.alipayOAuthPrivateKey, 'base64');
  params.sign = sign;

  const res = await axios.get('https://openapi.alipay.com/gateway.do', { params });
  const body = res.data;
  if (body.alipay_user_info_share_response && body.alipay_user_info_share_response.code === '10000') {
    return body.alipay_user_info_share_response;
  }
  throw new Error(body.error_response?.sub_msg || 'Alipay userinfo failed');
}

module.exports = {
  getWechatAuthUrl,
  wechatGetAccessToken,
  wechatGetUserInfo,
  getAlipayAuthUrl,
  alipayGetAccessToken,
  alipayGetUserInfo,
  isWechatOAuthConfigured,
  isAlipayOAuthConfigured,
  generateState,
};
