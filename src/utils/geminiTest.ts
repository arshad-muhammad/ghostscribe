import { GoogleGenerativeAI } from '@google/generative-ai';

export async function testGeminiAPI(apiKey: string) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try to list models first
    console.log('Attempting to list models...');
    const models = await genAI.listModels();
    console.log('Available models:', models);
    
    // Try the simplest possible generation
    console.log('Attempting to generate content...');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Hello, can you hear me?");
    const response = await result.response;
    const text = response.text();
    
    console.log('Generated text:', text);
    return {
      success: true,
      models,
      sampleText: text
    };
  } catch (error) {
    console.error('Gemini API test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 