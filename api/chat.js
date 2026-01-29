/**
 * Vercel Serverless API：代理 OpenAI 檢索，避免瀏覽器 CORS、API Key 不暴露
 * 環境變數：OPENAI_API_KEY（Vercel 後台設定）
 */
const systemPrompt = `你是一位永續建材檢索助理。根據使用者的描述，推薦合適的材質並簡要說明理由（強度、耐候、環保、成本等）。回答請簡潔、條列，並註明可參考的標準或認證（如 ASTM、ISO、CNS）若適用。`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY 未設定。請在 Vercel 專案 Settings > Environment Variables 新增並重新部署。',
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
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = data?.error?.message || data?.error?.code || `HTTP ${response.status}`;
      throw new Error(errMsg);
    }

    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error('OpenAI 未回傳文字');
    }
    return res.status(200).json({ text });
  } catch (err) {
    console.error('[api/chat]', err);
    const errMessage = err?.message || '檢索失敗';
    return res.status(500).json({ error: errMessage });
  }
};
