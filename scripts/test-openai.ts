import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import path from 'path';

// Fix path for executing from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testOpenAI() {
    console.log("Testing OpenAI Configuration...");
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.error("FAILED - No OPENAI_API_KEY found in .env.local");
        return;
    }

    const openai = new OpenAI({ apiKey });

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "Say 'Oasis AI integration active'." }],
            max_tokens: 15
        });

        console.log("SUCCESS - OpenAI returned:");
        console.log(response.choices[0].message.content);
    } catch (error) {
        console.error("FAILED - Error calling OpenAI:");
        console.error(error);
    }
}

testOpenAI();
