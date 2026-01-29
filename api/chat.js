/**
 * Vercel Serverless API：代理 Gemini 檢索，避免瀏覽器 CORS、API Key 不暴露
 * 環境變數：VITE_GEMINI_API_KEY 或 GEMINI_API_KEY（Vercel 後台設定）
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

const systemPrompt = `你是一位永續建材檢索助理。根據使用者的描述，推薦合適的材質並簡要說明理由（強度、耐候、環保、成本等）。回答請簡潔、條列，並註明可參考的標準或認證（如 ASTM、ISO、CNS）若適用。`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY 未設定。請在 Vercel 專案 Settings > Environment Variables 新增並重新部署。',
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const message = body?.message?.trim();
  if (!message) {
    return res.status(400).json({ error: '缺少 message 欄位' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt + '\n\n' + message }],
        },
      ],
    });
    const response = result.response;
    const text = response?.text?.();
    if (!text) {
      throw new Error('Gemini 未回傳文字');
    }
    return res.status(200).json({ text });
  } catch (err) {
    console.error('[api/chat]', err);
    const message = err?.message || '檢索失敗';
    return res.status(500).json({ error: message });
  }
}
