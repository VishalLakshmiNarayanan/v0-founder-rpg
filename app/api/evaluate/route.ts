import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { answer, question, context, judgeName, judgeRole, personaPrompt, chatHistory } = await req.json();

    const messages: any[] = [
      {
        role: 'system',
        content: `You are an evaluator in an executive boardroom simulation.
Meeting Context:
"${context}"

CURRENT EVALUATOR:
Embody ${judgeName} (${judgeRole}).
Strict evaluation rules/domain limits:
"""
${personaPrompt}
"""

CRITICAL SCORING LOGIC INSTRUCTIONS:
Evaluate the FOUNDER's LOGIC and JUSTIFICATION, not just factual perfection.
You must use the following FIXED criteria to calculate the numerical scoreDelta:
- (+5 to +10): Flawless logic, highly defensible, directly addresses concerns with strong strategic reasoning.
- (+1 to +4): Good logic, handles pushback decently, addresses the core issue but lacks some specifics regarding your domain.
- (0): Neutral, vague, or partially evasive answer that neither harms nor helps definitively.
- (-1 to -4): Poor logic, slightly evasive, or reveals minor gaps in domain knowledge.
- (-5 to -10): Terrible logic, completely evasive, hostile, or reveals critical vulnerabilities/ignorance in your specific domain.

Provide:
1. "scoreDelta" indicating exactly how your confidence changed based on the rules above.
2. "emotion" ("smile", "neutral", or "worse").
3. "updatedContext": a brief updated summary of the meeting context reflecting the new information provided by the user.
4. "reasoning": A detailed feedback monologue explaining exactly how you calculated the score delta using the FIXED criteria above, citing the specific logic the user provided. Make it explicitly clear why you think it's good or lacking.

Output strictly valid JSON:
{
  "scoreDelta": 5,
  "emotion": "smile",
  "updatedContext": "...",
  "reasoning": "..."
}`
      },
      ...chatHistory.map((msg: any) => ({
        role: msg.role === 'Founder' ? 'user' : 'assistant',
        content: msg.role === 'Founder' ? msg.content : `[Action by ${msg.role}] asked: ${msg.content}`
      }))
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });

    const output = chatCompletion.choices[0]?.message?.content || '{}';
    const data = JSON.parse(output);

    console.log(`\n====== EVALUATION RESULT: ${judgeName} ======`);
    console.log(`Score Delta: ${data.scoreDelta}`);
    console.log(`Emotion: ${data.emotion}`);
    console.log(`Reasoning/Feedback: ${data.reasoning}`);
    console.log(`================================================\n`);

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
