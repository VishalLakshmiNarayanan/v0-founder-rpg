import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import pdfParse from 'pdf-parse';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const context = formData.get('context') as string;

    let parsedText = '';
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        const pdfData = await pdfParse(buffer);
        parsedText = pdfData.text.slice(0, 15000); // Send robust context snippet
      } catch (err) {
        console.error("PDF parsing failed", err);
      }
    }

    const prompt = `
      You are generating seed data for an executive boardroom simulation where the user represents a team pitching something.
      Extract a summary from the knowledge base and with the provided user context, create 3 personas.
      
      Here is the overall context for the meeting provided by the user: "${context}"
      Here is the text extracted from their uploaded PDF deck/summary (knowledge base):
      """
      ${parsedText}
      """

      Based ONLY on this context, output a JSON with exactly 6 fields:
      1. "persona1": Describe the first persona (must be a female character). The object should contain "name", "role", "initial_confidence" (an integer from 0 to 100), and "prompt" (where the prompt specifies the person's behavior, perspectives, beliefs, domain, rules, instructions, capabilities, role, etc). 
         METHOD TO CALCULATE initial_confidence: Evaluate how well the uploaded slide text aligns with the meeting context and this persona's specific domain. If the slides directly address their domain well, give a moderate/high start (e.g., 60-75). If their domain is ignored in the slides, start them lower (e.g., 30-45). Do not default to 50.
      2. "persona2": Describe the second persona (must be a male character). The object should contain "name", "role", "initial_confidence" (calculated using the method above), and "prompt".
      3. "persona3": Describe the third persona (must be a male character). The object should contain "name", "role", "initial_confidence" (calculated using the method above), and "prompt".
      4. "systemprompt": This prompt controls the conversation of the entire meeting and also defines the user, role, behavior of the personas collectively.
      5. "meetinggoal": The specific goal of this meeting, which depends on the context of the meeting.
      6. "questions": Exactly 5 progressive questions that these personas will ask the user. Questions must be highly specific to the uploaded text and context provided. Each question must specify the "judge" index (0, 1, or 2) indicating who will ask it. Format: [{"judge": 0, "text": "..."}, ...]

      Return ONLY a valid JSON object in this exact format:
      {
        "persona1": { "name": "...", "role": "...", "initial_confidence": 50, "prompt": "..." },
        "persona2": { "name": "...", "role": "...", "initial_confidence": 50, "prompt": "..." },
        "persona3": { "name": "...", "role": "...", "initial_confidence": 50, "prompt": "..." },
        "systemprompt": "...",
        "meetinggoal": "...",
        "questions": [
          { "judge": 0, "text": "..." }
        ]
      }
    `;

    // Console logs removed for cleaner terminal output during parsing.

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });

    const output = chatCompletion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(output);

    console.log(JSON.stringify({
      persona1: parsed.persona1,
      persona2: parsed.persona2,
      persona3: parsed.persona3,
      systemprompt: parsed.systemprompt,
      meetinggoal: parsed.meetinggoal
    }, null, 2));

    // Map new fields back to the expected array format for backwards compatibility with the frontend
    const data = {
      personas: [
        { ...parsed.persona1, evaluationPrompt: parsed.persona1?.prompt },
        { ...parsed.persona2, evaluationPrompt: parsed.persona2?.prompt },
        { ...parsed.persona3, evaluationPrompt: parsed.persona3?.prompt }
      ],
      systemprompt: parsed.systemprompt,
      meetinggoal: parsed.meetinggoal,
      questions: parsed.questions && parsed.questions.length > 0 ? parsed.questions : [
        { judge: 0, text: "Let's begin. Based on your presentation, can you outline your core value proposition?" }
      ],
      outcomes: {
        success: { title: "APPROVED", subtitle: "Favorable outcome", message: "The Committee recommends proceeding." },
        conditional: { title: "CONDITIONAL", subtitle: "Requires further review", message: "The Committee suggests a follow-up session." },
        failure: { title: "DECLINED", subtitle: "Unfavorable outcome", message: "The Committee recommends significant pivots." }
      }
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
