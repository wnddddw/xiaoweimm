# 小微买卖 — 遗留事项清单

> 整理于 2026-07-22，基于当日全量代码扫描、冒烟测试与真机验证。

## 🔴 上线前必须处理

- [ ] **生产 API 域名不可达**：`api.xiaoweimm.com` 当前无法访问，正式 Release 包（`__DEV__=false` 时 `mobile/src/utils/constants.ts` 指向该域名）在真机上无法登录。需确认后端部署状态或更新域名配置。
- [ ] **微信支付 V2 → V3 迁移**：`backend/src/services/payment.js` 使用 MD5 签名（V2 接口），微信官方已推 V3（RSA/SHA256），建议规划迁移。
- [ ] **生产凭据核查**：确认 `docs/test-accounts.md` 不含真实账号；确认 git 历史中无真实密钥、keystore 密码（数据库与 uploads 已于 2026-07-22 移出跟踪，但历史提交中仍可检出，敏感的话需考虑清理历史或轮换凭据）。

## 🟡 代码质量

- [ ] **HomeScreen 契约测试失败（既有问题）**：`mobile/src/native-app-contract.test.js` 有 6 条断言失败（hero 文案、CTA/footer、pendingRole 相关），改动前即失败。二选一：补回 HomeScreen 落地页文案，或修正测试期望值。
- [ ] **后端零测试**：建议至少为 `backend/src/routes` 的 auth / payments 加集成测试。
- [ ] **`mobile/src/WebApp.tsx` 死代码**：旧 WebView 壳已被纯原生导航取代，且其引用的 `HTML/` 已删除，建议删除该文件及相关引用。
- [ ] **根 `package.json` 定位混乱**：`serve` 脚本指向不存在的文件；依赖只有 openai + playwright（测试辅助），建议清理或注明用途。
- [ ] **构建脚本固化**：把「重新生成 JS bundle + assembleRelease」固化进 `mobile/android/build-release.bat`，避免再次用到过期 bundle。

## 🟢 清理类（低优先）

- [ ] `.agents/` 和 `.claude/` 下 4 个文件被意外改坏（未提交），确认后执行 `git checkout -- .agents .claude` 丢弃。
- [ ] 根目录 47 个未跟踪调试残留：截图、`window_*.xml`、logcat 日志、`_backup_2026-06-11.zip`、一次性修复脚本（`fix_all_admin.py` 等），建议归档或删除。
- [ ] 移动端 30+ 个文件 CRLF/LF 行尾不一致，建议统一（可配 `.gitattributes`）。
- [ ] 补 `README.md`：从 `xin.md` 提炼架构、启动步骤（backend seed → npm start → mobile run-android）、环境变量清单。

## ✅ 已完成（2026-07-22）

- Git 卫生整理：1100+ 构建产物 / 数据库 / 上传文件移出跟踪，`.gitignore` 补全
- 后端源码编码乱码与 BOM 头修复（`01401d3`）
- 移动端统一设计规范 + 全页面美化（`cb50ffc`，新增 `mobile/src/theme.ts`）
- 内置过期 JS bundle 问题根治（`852e5b3`）
- 真机三角色（管理员/卖家/买家）登录与核心功能验证通过
