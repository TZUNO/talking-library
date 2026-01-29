/**
 * Gemini 1.5 Flash API - 永續建材檢索對話
 * 使用 @google/generative-ai，API Key 請設為 VITE_GEMINI_API_KEY
 */

import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? '';
const MODEL = 'gemini-1.5-flash';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

let cachedModel: GenerativeModel | null = null;

function getModel(): GenerativeModel {
  if (!API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY 未設定');
  }
  if (!cachedModel) {
    const genAI = new GoogleGenerativeAI(API_KEY);
    cachedModel = genAI.getGenerativeModel({ model: MODEL });
  }
  return cachedModel;
}

/**
 * 發送使用者輸入，取得材質檢索回覆（單輪）
 * - 正式環境：呼叫 Vercel /api/chat（避免 CORS、API Key 不暴露）
 * - 開發環境：直接呼叫 Gemini SDK（需 .env 的 VITE_GEMINI_API_KEY）
 */
export async function chatMaterialQuery(userMessage: string): Promise<string> {
  if (import.meta.env.PROD) {
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

  const m = getModel();
  const result = await m.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: systemPrompt + '\n\n' + userMessage }],
      },
    ],
  });
  const response = result.response;
  if (!response.text) {
    throw new Error('Gemini 未回傳文字');
  }
  return response.text();
}

const systemPrompt = `你是一位永續建材檢索助理。根據使用者的描述，推薦合適的材質並簡要說明理由（強度、耐候、環保、成本等）。回答請簡潔、條列，並註明可參考的標準或認證（如 ASTM、ISO、CNS）若適用。`;