import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { answer, question, context, judgeName, judgeRole } = await req.json();

    const prompt = `
      You are an expert judging a response in a simulated executive briefing / boardroom pitch.
      Meeting context: "${context}"
      Judge (Persona): ${judgeName} - ${judgeRole}
      Question asked by the judge: "${question}"
      User's response: "${answer}"

      Evaluate the user's response based on logic, reasoning, confidence, and relevancy to the specific question and overall context. Be harsh; this is an executive boardroom. A generic answer is bad.
      Provide a "scoreDelta" from -10 to +10 indicating how much their confidence score changes.
      Provide "emotion" which must be strictly one of: "smile" (for an excellent, convincing answer), "neutral" (for an okay answer), or "worse" (for a poor, terrible, or evasive answer).

      Return ONLY a valid JSON object in this format:
      {
        "scoreDelta": 5,
        "emotion": "smile"
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
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
