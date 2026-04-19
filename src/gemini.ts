import { GoogleGenerativeAI } from "@google/generative-ai";

// Mengambil kunci dari file .env (yang ada VITE_ di depannya)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash" // Sesuaikan dengan model yang kamu mau
});