# 原生 App Release APK 真机测试记录

测试时间：2026-07-05 15:45-15:52  
测试设备：Redmi Note 9 Pro / `8d26584a`  
测试 APK：`D:\xin\mobile\android\app\build\outputs\apk\release\app-release.apk`  
包名：`com.wnddd`

## 环境状态

- ADB 设备已连接，状态为 `device`。
- 本地服务可访问：`http://127.0.0.1:3001/api/health` 返回成功。
- 静态入口可访问：`http://127.0.0.1:3001/index.html` 返回 `200`。
- 已建立端口映射：`adb reverse tcp:3001 tcp:3001`。

## 测试结果

- App 可启动，未复现旧包的 `libjsctooling.so` 启动崩溃。
- 卖家账号 `13800138001 / 123456` 登录成功，进入“卖家工作台 / 发布项目”页。
- 买家账号 `13800138002 / 123456` 登录成功，进入“买家工作台 / 收购需求”页。
- 卖家发布页点击空表单“提交审核”有明确反馈：`请选择行业和细分行业`。
- 横屏已限制：`AndroidManifest.xml` 中 `MainActivity` 设置了 `android:screenOrientation='portrait'`。

## 发现问题

- 当前 APK 仍是 WebView 壳，界面树显示 `android.webkit.WebView`，不是完整原生页面栈。
- 登录弹窗仍使用浏览器原生 `alert`，提示标题会显示 `网址为“http://127.0.0.1”的网页显示：`，不适合正式 App。
- 发布项目和收购需求表单可用，但移动端体验仍偏长表单，后续应继续优化分组、折叠和提交反馈。
- `backend/src/db/seed.js` 中打印的卖家测试密码与当前数据库状态存在不一致风险，需要后续统一。

## 证据文件

- `D:\xin\screenshot_seller_login_success_check.png`
- `D:\xin\screenshot_seller_submit_empty.png`
- `D:\xin\screenshot_buyer_login_result.png`
- `D:\xin\logcat_seller_login_success_check.txt`
- `D:\xin\logcat_seller_submit_empty.txt`
- `D:\xin\logcat_buyer_login_result.txt`
