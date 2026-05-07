import { GoogleGenAI } from '@google/genai';

// Берём тот же ключ и модель, что и в основном коде
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash';

if (!apiKey) {
  console.error('VITE_GEMINI_API_KEY is not defined. Provide it in .env.local / Vercel env.');
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export type CategorizedResult = {
  title: string;
  description: string;
  category: 'Task' | 'Idea';
  priority: number; // 1–5
};

export async function categorizeMessage(
  message: string,
  language: 'en' | 'ru' = 'en'
): Promise<CategorizedResult> {
  if (!apiKey) throw new Error('Missing Gemini API Key');

  const langInstruction = language === 'ru' ? 'Russian' : 'English';

  const prompt = `
Analyze the following user message and categorize it as either a "Task" (something actionable to be done) or an "Idea" (a concept, thought, or potential future project).

Then:
- Extract a concise, human-readable title (max 80 characters).
- Write a detailed but compact description (2–5 sentences).
- If it is an Idea, assign an initial priority from 1 (lowest) to 5 (highest) based on its apparent impact or urgency.
- If it is a Task, set priority based on urgency and importance.

Write BOTH title and description in ${langInstruction}.

Return STRICTLY a JSON object with this shape (no extra text):
{
  "title": string,
  "description": string,
  "category": "Task" | "Idea",
  "priority": number
}

User message:
"${message}"
`.trim();

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.4,
      },
    });

    const text = response.text || '';
    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch {
      // Попробуем вытащить JSON из текста, если модель добавила что-то вокруг
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error('Gemini returned non-JSON response: ' + text.slice(0, 200));
      }
      parsed = JSON.parse(match[0]);
    }

    const obj = parsed as Partial<CategorizedResult>;

    return {
      title: obj.title || message.slice(0, 80),
      description: obj.description || message,
      category: obj.category === 'Idea' ? 'Idea' : 'Task',
      priority:
        typeof obj.priority === 'number' && obj.priority >= 1 && obj.priority <= 5
          ? obj.priority
          : 3,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('"code":429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota exceeded')) {
      throw new Error('Gemini quota exceeded (429). Add billing / increase quota, or wait and retry.');
    }
    throw e;
  }
}

