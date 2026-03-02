import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  // Graceful fallback for dev if key is missing
  console.warn('OPENAI_API_KEY is not defined in environment variables');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'missing-key',
});

// Helper for embeddings
export async function getEmbedding(text: string) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.replace(/\n/g, ' '),
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error getting embedding:', error);
    throw error;
  }
}
