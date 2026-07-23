# 小微买卖微信小程序

本目录是微信小程序工程，采用 `web-view` 壳方式承载现有 H5 站点（`HTML/` 目录），
后续可在不改动 H5 的前提下快速上线小程序版本。

## 目录结构

```
miniprogram/
├── project.config.json   # 开发者工具工程配置（当前为测试号 touristappid）
├── app.json / app.js / app.wxss
└── pages/index/          # 唯一的 web-view 页面
```

## 导入与运行

1. 打开微信开发者工具 → 导入项目 → 选择本目录（`miniprogram/`）。
2. 当前 `appid` 为 `touristappid`（测试号），可直接预览；正式发布前需替换为企业小程序的 AppID。
3. H5 地址在 `app.js` 的 `globalData.h5BaseUrl` 中配置，目前是占位 `https://example.com`，请替换为正式域名。

## 上线前置条件（重要）

- **企业主体**：`web-view` 组件仅对企业主体小程序开放，个人主体不可用。
- **业务域名**：在小程序后台「开发管理 → 业务域名」中添加 H5 域名，
  并按要求把校验文件放到域名根目录。
- **HTTPS + ICP 备案**：H5 站点必须使用 HTTPS，且域名需完成 ICP 备案。
- 开发者工具里可临时勾选「不校验合法域名」用于本地调试，真机预览/发布必须完成上述配置。

## 上线检查清单

- [ ] 替换 `project.config.json` 中的 `appid`
- [ ] 替换 `app.js` 中的 `h5BaseUrl` 为正式 HTTPS 域名
- [ ] 后台配置业务域名并放置校验文件
- [ ] 真机预览验证登录、会员申请、发布项目等核心流程
- [ ] 提交审核并发布
