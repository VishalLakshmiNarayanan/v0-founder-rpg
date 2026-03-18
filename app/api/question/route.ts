import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { context, judgeName, judgeRole, personaPrompt, chatHistory, activeConcern, coveredConcernTexts } = await req.json();

    const coveredList = Array.isArray(coveredConcernTexts) && coveredConcernTexts.length > 0
      ? coveredConcernTexts.map((t: string, i: number) => `  ${i + 1}. ${t}`).join('\n')
      : '  (none — this is the first question)';

    const messages: any[] = [
      {
        role: 'system',
        content: `You are ${judgeName}, ${judgeRole}, in an executive boardroom evaluation.
Meeting context: "${context}"

Your persona rules:
"""
${personaPrompt}
"""

Your task: Ask the Founder ONE sharp, focused question about this specific gap you've identified:
"${activeConcern?.text || 'their overall pitch'}"

Rules:
- ONE question only. One or two sentences maximum. No preamble, no multi-part questions.
- Speak in your natural voice as ${judgeName} — direct, professional, pointed.
- Do NOT reference or rehash these already-covered topics: ${coveredList}

Output strictly valid JSON:
{
  "question": "..."
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

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
