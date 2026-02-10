
import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

// Initialize Groq API
const groq = new Groq({
    apiKey: (process.env.GROQ_API_KEY || '').trim(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages, role } = body; // Role: 'candidate' or 'examiner'

        if (!process.env.GROQ_API_KEY) {
            console.error('SERVER ERROR: GROQ_API_KEY is missing in process.env');
            return NextResponse.json({
                error: 'Groq API Key not configured',
                details: 'Please add GROQ_API_KEY to your .env file.'
            }, { status: 500 });
        }

        // tailored system instruction based on user role
        let systemInstruction = '';
        if (role === 'examiner') {
            systemInstruction = `
            You are an expert AI Assistant for an Examiner in an Online Examination System.
            Your goal is to help the examiner create high-quality exam questions, suggest topics, and explain proctoring policies.
            Be professional, concise, and helpful.
            `;
        } else {
            systemInstruction = `
            You are a friendly and helpful AI Tutor for a student/candidate.
            Your goal is to clarify doubts, explain academic concepts, and provide study tips.
            Do NOT provide direct answers to exam questions if the user asks during an exam (though you don't know real-time context, assume ethical boundaries).
             encourage learning.
            `;
        }

        // Groq requires messages in a specific format: { role: 'system' | 'user' | 'assistant', content: string }
        const formattedMessages = [
            { role: 'system', content: systemInstruction },
            ...messages.map((m: any) => ({
                role: m.role === 'model' ? 'assistant' : 'user', // Map 'model' back to 'assistant' for Groq
                content: m.content
            }))
        ];

        // List of models to try in order of preference
        const modelsToTry = [
            'llama-3.3-70b-versatile',
            'llama-3.1-8b-instant',
            'mixtral-8x7b-32768'
        ];

        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                // console.log(`Attempting to use Groq model: ${modelName}`);
                const chatCompletion = await groq.chat.completions.create({
                    messages: formattedMessages,
                    model: modelName,
                    temperature: 0.7,
                    max_tokens: 1024,
                    top_p: 1,
                    stream: false,
                    stop: null
                });

                const text = chatCompletion.choices[0]?.message?.content || '';
                return NextResponse.json({ text });

            } catch (error: any) {
                console.warn(`Groq Model ${modelName} failed:`, error.message);
                lastError = error;
                // If it's a rate limit or server error, maybe try next. 
                // If it's auth error, no point trying others, but for simplicity we loop.
            }
        }

        if (lastError) throw lastError;

    } catch (error: any) {
        console.error('Groq Chat Error:', error);
        return NextResponse.json({ error: 'Failed to generate response', details: error.message, stack: error.stack }, { status: 500 });
    }
}
