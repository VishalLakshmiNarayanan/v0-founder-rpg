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
      Here is the overall context for the meeting provided by the user: "${context}"
      Here is the text extracted from their uploaded PDF deck/summary:
      """
      ${parsedText}
      """

      Based ONLY on this context and logic, provide:
      1. "personas": Exactly 3 detailed Personas (committee members/judges). Each needs a "name" and a "role" (like "Strategic Ops" or "Financial Review").
      2. "questions": Exactly 5 progressive questions that these personas will ask the user. Questions must be highly specific to the uploaded text and context provided. Each question must specify the "judge" index (0, 1, or 2) indicating who will ask it.

      Return ONLY a valid JSON object in this exact format:
      {
        "personas": [
          {"name": "...", "role": "..."}
        ],
        "questions": [
          {"judge": 0, "text": "..."}
        ]
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
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
