import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
// Рабочий дефолт: существующая модель Gemini
// Можно переопределить через VITE_GEMINI_MODEL, например на "gemini-2.0-pro"
const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash';

if (!apiKey) {
  console.error("VITE_GEMINI_API_KEY is not defined. Provide it in .env.local.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const SYSTEM_INSTRUCTION = `You are a world-class prompt engineer. Your job is to take a user's rough, messy request and transform it into a highly professional, structured, and powerful prompt that can be fed into an LLM or AI generation model.

When a user gives you a request, you must return ONLY the professional prompt text. Do not include introductory text like "Here is your prompt:" or explanations.`;

function localFallbackPrompt(userRequest: string): string {
  const cleaned = userRequest.trim();
  return [
    'You are an advanced prompt rewriter.',
    'Rewrite the following user request into a clear, detailed, professional prompt for an LLM.',
    'Focus on: goal, constraints, style, and output format.',
    '',
    'User request:',
    cleaned || '[empty input]',
  ].join('\n');
}

export async function generateProfessionalPrompt(userRequest: string): Promise<string> {
  // Если нет ключа — сразу локальный фоллбек, без попыток к API
  if (!apiKey) {
    console.warn("Missing Gemini API Key, using local fallback prompt.");
    return localFallbackPrompt(userRequest);
  }
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: userRequest,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) {
      console.warn("Empty response from Gemini, using local fallback.");
      return localFallbackPrompt(userRequest);
    }
    return text;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Gemini call failed, falling back to local prompt:", msg);
    // При любой ошибке (429, сеть, что угодно) – не роняем сайт, а даём рабочий результат
    return localFallbackPrompt(userRequest);
  }
}
