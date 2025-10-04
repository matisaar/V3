import { GoogleGenAI } from "@google/genai";

let runtimeGeminiKey: string | null = null;

export function setGeminiApiKey(key: string) {
  runtimeGeminiKey = key;
}

export function getGeminiApiKey(): string | null {
  // Priority: runtime override -> Vite env -> process.env (legacy)
  if (runtimeGeminiKey) return runtimeGeminiKey;
  // Vite exposes vars via import.meta.env
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  // Fallback to process.env if available (server-side)
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && (process.env.GEMINI_API_KEY || process.env.API_KEY)) {
    // @ts-ignore
    return process.env.GEMINI_API_KEY || process.env.API_KEY;
  }
  return null;
}

export function getGeminiAI() {
  const key = getGeminiApiKey();
  if (!key) {
    // Create without key to allow library to fallback if configured elsewhere
    return new GoogleGenAI({ apiKey: undefined as any });
  }
  return new GoogleGenAI({ apiKey: key });
}
