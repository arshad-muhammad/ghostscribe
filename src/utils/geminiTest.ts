import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const testGeminiAPI = async () => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Hello, how are you?');
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error testing Gemini API:', error);
    throw error;
  }
}; 