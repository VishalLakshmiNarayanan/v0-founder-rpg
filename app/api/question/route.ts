import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { context, judgeName, judgeRole, personaPrompt, chatHistory, plannedQuestion } = await req.json();

    const messages: any[] = [
      {
        role: 'system',
        content: `You are orchestrating a round-robin executive boardroom simulation.
Meeting Context (Updated summary of the meeting so far):
"${context}"

YOUR ROLE:
You MUST completely embody ${judgeName} (${judgeRole}).
Your STRICT evaluation rules and domain limits:
"""
${personaPrompt}
"""

Task: Generate your NEXT question for the Founder. 
You are NOT a generic interviewer. You are a highly specialized ${judgeRole}.
${plannedQuestion ? `
CRITICAL INSTRUCTION: You initially planned to ask this vital question based strictly on the Founder's presentation materials:
"${plannedQuestion}"
You MUST ask this planned agenda question. You may acknowledge the Founder's last answer briefly, but you MUST immediately pivot back into YOUR explicit domain. DO NOT get distracted by the previous judge's topic.` : ''}

The question MUST:
1. Be hyper-focused ONLY on the DOMAIN of your persona (e.g. if you are financial, ask deeply about margins/costs; if marketing, focus purely on marketing). DO NOT adopt or continue the previous judge's line of questioning if it falls outside your domain.
2. NOT be a direct continuous follow-up to the Founder's last answer if that answer was about a different domain. You must pivot strictly back to YOUR domain and focus on YOUR rules and planned agenda.
3. Stress test the Founder by finding vulnerabilities matching your specific expertise and the Meeting Context.
4. Speak exactly in the voice, tone, and professional perspective of ${judgeName}.

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
