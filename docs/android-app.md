# xiaoweimm 安卓 App

当前安卓版本采用 React Native + WebView 封装现有网页，优先保证能快速安装、演示和复用现有业务页面。

## 本地运行

1. 启动网页和接口服务：

   ```bat
   cd /d D:\xin
   npm run dev
   ```

2. 启动安卓调试包：

   ```bat
   cd /d D:\xin\mobile
   npx react-native run-android
   ```

安卓模拟器访问电脑本机服务使用 `http://10.0.2.2:3001/index.html`，已在 `mobile/src/WebApp.tsx` 默认配置。

## 打包 APK

```bat
cd /d D:\xin\mobile\android
gradlew.bat assembleRelease
```

生成路径：

```text
D:\xin\mobile\android\app\build\outputs\apk\release\app-release.apk
```

## 上线前配置

正式发布时，把 `mobile/src/WebApp.tsx` 中的默认地址替换为服务器地址，例如：

```text
https://你的域名/index.html
```

同时建议先完成：

- 修复网页中仍存在的乱码文本。
- 将后端接口部署到公网服务器。
- 配置正式签名证书。
- 替换默认 App 图标和启动图。
