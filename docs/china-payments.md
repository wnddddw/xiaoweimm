# 中国大陆线上支付接入说明

本项目后端已预留微信支付 H5 与支付宝手机网站支付接口，统一通过 `/api/payments/order` 创建订单，通过异步回调确认支付结果。

## 支付通道

- 微信支付：H5 支付，接口 `/api/payments/callback/wechat`
- 支付宝：手机网站支付，接口 `/api/payments/callback/alipay`
- 支付结果以支付平台异步通知为准，前端不能自行判定成功。

## 必填环境变量

```env
NODE_ENV=production
CORS_ORIGIN=https://你的前端域名

WECHAT_APP_ID=
WECHAT_MCH_ID=
WECHAT_API_KEY=
WECHAT_NOTIFY_URL=https://你的后端域名/api/payments/callback/wechat

ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=
ALIPAY_PUBLIC_KEY=
ALIPAY_NOTIFY_URL=https://你的后端域名/api/payments/callback/alipay
ALIPAY_RETURN_URL=https://你的前端域名/payment.html

PAYMENT_ALLOW_MANUAL_RECHARGE=false
PAYMENT_DEV_AUTO_FUND=false
```

## 上线检查

- 后端必须使用 HTTPS 公网域名，微信/支付宝无法回调 `localhost`。
- 微信商户平台需开通 H5 支付，并配置 H5 支付域名。
- 支付宝开放平台需开通手机网站支付，并使用 RSA2。
- `.env` 不提交到仓库，线上使用环境变量或密钥管理服务注入。
- 手工充值接口默认关闭，只能在明确设置 `PAYMENT_ALLOW_MANUAL_RECHARGE=true` 且管理员登录时使用。
- 订单状态只接受支付平台签名回调更新。
