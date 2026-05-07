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

When a user gives you a request, you must return ONLY the professional prompt text. Do not include introductory text like "Here is your prompt:" or explanations. 

Example Input from user: "НЕ ЗАПУСКАЕТ САМ МАЙКНРАФТ ТОЛЬКО ГРУЗМИТ ЧТОТО И ВСЕ И ДИЗАЙН АХУЕННЫЙМ СДЕЛАЙ АНИМАЦИИ ДОБАВЬ"
Your Output: "Create a modern, highly polished Minecraft launcher application. The core requirement is to fix the launch mechanism: the 'Play' button must properly execute the Minecraft game sequence (via minecraft-launcher or direct java -jar execution), rather than freezing on a loading state. 

Additionally, perform a complete UI/UX overhaul. The design must be sleek and contemporary, utilizing a dark theme with vibrant Minecraft-green accents and pixel-art inspired typography. Integrate smooth, high-quality animations including element fade-ins, satisfying hover effects on interactive elements, click feedback on the launch button, and a dynamic animated background or subtle particle effects. The final deliverable must look exceptionally professional and native."`;

export async function generateProfessionalPrompt(userRequest: string): Promise<string> {
  if (!apiKey) throw new Error("Missing Gemini API Key");
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: userRequest,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    return response.text || "Failed to generate prompt.";
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('"code":429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota exceeded')) {
      throw new Error("Gemini quota exceeded (429). Add billing / increase quota, or wait and retry.");
    }
    throw e;
  }
}
