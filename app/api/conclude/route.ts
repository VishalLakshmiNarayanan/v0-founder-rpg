import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { finalScore, chatHistory, meetingContext, judges, confidences } = await req.json();

    const judgesData = judges.map((j: any, idx: number) => 
      `${j.name} (${j.role}) - Final Confidence Score: ${confidences[idx]}`
    ).join('\n');

    const messages: any[] = [
      {
        role: 'system',
        content: `You are the master orchestrator concluding an executive boardroom simulation.
Here is the final overall context summary of the entire meeting:
"${meetingContext}"

The Founder finished with a final average confidence score of: ${finalScore}/100.

The board consisted of:
${judgesData}

Task: Analyze the provided complete chat history, the context, and the final scores. 
Provide a robust concluding report strictly output as JSON containing THREE top-level items:
1. "gistSummary": A strong, 1-paragraph summary of how the meeting went with strong judgement reasoning and justification.
2. "personaFeedback": An array of exactly 3 objects (one for each judge).
Each object MUST contain:
- "name": The persona's name.
- "thinking": A paragraph detailing their strict domain-focused final thoughts.
- "feedback": A direct, 1-2 sentence actionable takeaway.
3. "questionFeedback": An array analyzing EACH specific Question and Answer exchange from the meeting.
Each object MUST contain:
- "judge": The name of the judge who asked the question.
- "question": A summary of the question asked.
- "answer": A summary of the Founder's answer.
- "feedback": The specific feedback on why that answer worked or failed.

Output ONLY valid JSON matching this exact structure:
{
  "gistSummary": "...",
  "personaFeedback": [
    { "name": "...", "thinking": "...", "feedback": "..." }
  ],
  "questionFeedback": [
    { "judge": "...", "question": "...", "answer": "...", "feedback": "..." }
  ]
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
