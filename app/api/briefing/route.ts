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

      Based ONLY on this context, output a JSON with exactly 5 fields:
      1. "persona1": Describe the first persona (must be a female character). The object should contain "name", "role", "initial_confidence" (an integer from 0 to 100), "prompt" (where the prompt specifies the person's behavior, perspectives, beliefs, domain, rules, instructions, capabilities, role, etc), and "concerns" (an array of exactly 3 concern objects specific to this persona's domain).
         METHOD TO CALCULATE initial_confidence: Evaluate how well the uploaded slide text aligns with the meeting context and this persona's specific domain. If the slides directly address their domain well, give a moderate/high start (e.g., 60-75). If their domain is ignored in the slides, start them lower (e.g., 30-45). Do not default to 50.
         METHOD TO GENERATE concerns: Identify exactly 3 specific gaps, risks, or unanswered questions that this persona would care about based on their domain and the uploaded material. Phrase each concern as a noun clause (NOT a question), e.g. "Unclear customer acquisition cost justification" or "No evidence of regulatory approval pathway". Concerns must be domain-specific and grounded in what is missing or unclear from the uploaded material. Use IDs "p0_c0", "p0_c1", "p0_c2" for persona 1's concerns.
      2. "persona2": Describe the second persona (must be a male character). The object should contain "name", "role", "initial_confidence" (calculated using the method above), "prompt", and "concerns" (exactly 3 concern objects using IDs "p1_c0", "p1_c1", "p1_c2").
      3. "persona3": Describe the third persona (must be a male character). The object should contain "name", "role", "initial_confidence" (calculated using the method above), "prompt", and "concerns" (exactly 3 concern objects using IDs "p2_c0", "p2_c1", "p2_c2").
      4. "systemprompt": This prompt controls the conversation of the entire meeting and also defines the user, role, behavior of the personas collectively.
      5. "meetinggoal": The specific goal of this meeting, which depends on the context of the meeting.

      Return ONLY a valid JSON object in this exact format:
      {
        "persona1": { "name": "...", "role": "...", "initial_confidence": 50, "prompt": "...", "concerns": [{"id": "p0_c0", "text": "..."}, {"id": "p0_c1", "text": "..."}, {"id": "p0_c2", "text": "..."}] },
        "persona2": { "name": "...", "role": "...", "initial_confidence": 50, "prompt": "...", "concerns": [{"id": "p1_c0", "text": "..."}, {"id": "p1_c1", "text": "..."}, {"id": "p1_c2", "text": "..."}] },
        "persona3": { "name": "...", "role": "...", "initial_confidence": 50, "prompt": "...", "concerns": [{"id": "p2_c0", "text": "..."}, {"id": "p2_c1", "text": "..."}, {"id": "p2_c2", "text": "..."}] },
        "systemprompt": "...",
        "meetinggoal": "..."
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

    const mapConcerns = (rawConcerns: any[], prefix: string) => {
      if (!Array.isArray(rawConcerns)) return [];
      return rawConcerns.slice(0, 3).map((c: any, i: number) => ({
        id: c.id || `${prefix}_c${i}`,
        text: c.text || '',
        covered: false,
        resolved: false,
      }));
    };

    // Map new fields back to the expected array format for backwards compatibility with the frontend
    const data = {
      personas: [
        { ...parsed.persona1, evaluationPrompt: parsed.persona1?.prompt, concerns: mapConcerns(parsed.persona1?.concerns, 'p0') },
        { ...parsed.persona2, evaluationPrompt: parsed.persona2?.prompt, concerns: mapConcerns(parsed.persona2?.concerns, 'p1') },
        { ...parsed.persona3, evaluationPrompt: parsed.persona3?.prompt, concerns: mapConcerns(parsed.persona3?.concerns, 'p2') },
      ],
      systemprompt: parsed.systemprompt,
      meetinggoal: parsed.meetinggoal,
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
