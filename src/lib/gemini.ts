/**
 * 材質檢索對話 API
 * 一律呼叫 /api/chat（Vercel Serverless 使用 OpenAI API，環境變數：OPENAI_API_KEY）
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * 發送使用者輸入，取得材質檢索回覆（單輪）
 */
export async function chatMaterialQuery(userMessage: string): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userMessage }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data?.error as string) || `HTTP ${res.status}`);
  }
  if (!data?.text) {
    throw new Error((data?.error as string) || '未取得回覆');
  }
  return data.text as string;
}