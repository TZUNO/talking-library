# AI 對話介面設計（The Talking Library）

永續建材檢索 AI 介面研究專案：引導式 (Template) / 自由式 (Free-form) 人因實驗。

Original Figma: [AI 對話介面設計](https://www.figma.com/design/dNyZw77BUfI77a4yjIKt9E/AI-%E5%B0%8D%E8%A9%B1%E4%BB%8B%E9%9D%A2%E8%A8%AD%E8%A8%88)

## 本地開發

1. `npm i` 安裝依賴  
2. 複製 `.env.example` 為 `.env`，填入 `VITE_GAS_LOG_URL`、`VITE_GEMINI_API_KEY`  
3. `npm run dev` 啟動開發伺服器  

## 環境變數檢查

- **VITE_GAS_LOG_URL**：請使用 GAS **新部署後**的 Web App 網址，否則實驗資料會送錯端點。  
- **VITE_GEMINI_API_KEY** 或 **GEMINI_API_KEY**：Gemini API Key。  
  - 正式環境（Vercel）：檢索經由 `/api/chat` Serverless 呼叫，API Key 請在 Vercel **Settings > Environment Variables** 設定（任選其一即可），**改動後需重新部署**。  
  - 開發環境：前端直接呼叫 Gemini，需在 `.env` 設定 `VITE_GEMINI_API_KEY`。  

## 型別說明（實驗數據）

- `clickPath` 為 **string[]**（例如 `["template-1", "submit"]`），前端以 JSON 送出；GAS 端可用 `JSON.stringify(data.clickPath)` 寫入試算表以保留完整點擊順序。  

## Vercel 部署

1. 在 Vercel 專案 **Settings > Environment Variables** 新增：  
   - `VITE_GAS_LOG_URL` = 你的 GAS Web App 網址  
   - `VITE_GEMINI_API_KEY` = 你的 Gemini API Key  
2. 重新部署後，受測者可用 **`https://your-app.vercel.app/?userId=p001`** 進入，App 會自動從 URL 讀取 `userId`。
  