# 連假倒數計時器

給公司同事用的連假倒數小網站。純前端（Vue 3 + Vite），沒有後端；
同事選擇的倒數目標與主題偏好只存在各自瀏覽器的 localStorage。

## 本機預覽

```bash
npm install
npm run dev
```

打開終端機顯示的網址（通常是 http://localhost:5173）。

## 更新連假日期

編輯 `src/data/holidays.js`，新增或修改項目即可。

## 部署到 Cloudflare（靜態網站）

在 Cloudflare 後台連接此 GitHub repository，設定：

- 組建命令：`npm run build`
- 部署命令：`npx wrangler deploy`

`wrangler.jsonc` 已設定把 `dist` 資料夾當成靜態資產上傳。
