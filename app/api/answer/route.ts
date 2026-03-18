import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { answer, question, context, judgeName, judgeRole, personaPrompt, nextJudgeName, nextJudgeRole, nextPersonaPrompt, chatHistory } = await req.json();

    const messages: any[] = [
      {
        role: 'system',
        content: `You are orchestrating an executive boardroom simulation.
Meeting Context:
"${context}"

CURRENT EVALUATOR:
You must embody ${judgeName} (${judgeRole}).
Their strict evaluation rules/domain limits:
"""
${personaPrompt}
"""
As the evaluator, assess the Founder's MOST RECENT response to the history. React purely from this persona's viewpoint. Determine a "scoreDelta" from -10 to +10, and an "emotion" ("smile", "neutral", or "worse").

NEXT INTERROGATOR:
After evaluating, you must immediately shift to embodying ${nextJudgeName} (${nextJudgeRole}).
Their instructions/domain limits:
"""
${nextPersonaPrompt}
"""
Based on the full conversation history, generate the NEXT question in the round-robin natively from this persona's perspective. It should drill into vulnerabilities or push the conversation forward based on what the Founder just said. Provide this as "nextQuestion".

You MUST output ONLY valid JSON in this exact format:
{
  "scoreDelta": 5,
  "emotion": "smile",
  "nextQuestion": "..."
}`
      },
      ...chatHistory.map((msg: any) => ({
        role: msg.role === 'Founder' ? 'user' : 'assistant',
        content: msg.role === 'Founder' ? msg.content : `[Action by ${msg.role}] asked: ${msg.content}`
      }))
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' }
    });

    const output = chatCompletion.choices[0]?.message?.content || '{}';
    const data = JSON.parse(output);

    // Validate enum
    if (!['smile', 'neutral', 'worse'].includes(data.emotion)) {
      data.emotion = 'neutral';
    }

    // Cap delta
    if (typeof data.scoreDelta !== 'number') data.scoreDelta = 0;
    data.scoreDelta = Math.max(-10, Math.min(10, data.scoreDelta));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
