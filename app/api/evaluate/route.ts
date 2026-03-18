import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const {
      answer,
      question,
      context,
      judgeName,
      judgeRole,
      personaPrompt,
      chatHistory,
      activeConcernId,
      activePersonaIndex,
      allPersonaConcerns,
      turnCount
    } = await req.json();

    // Resolve the active concern's text
    const activeConcernText = Array.isArray(allPersonaConcerns)
      ? allPersonaConcerns[activePersonaIndex]?.find((c: any) => c.id === activeConcernId)?.text ?? 'Unknown concern'
      : 'Unknown concern';

    // Build list of other personas' open concerns for cross-resolution
    const otherOpenLines: string[] = [];
    if (Array.isArray(allPersonaConcerns)) {
      allPersonaConcerns.forEach((personaConcerns: any[], pIdx: number) => {
        if (pIdx === activePersonaIndex) return;
        personaConcerns
          .filter((c: any) => !c.covered && !c.resolved)
          .forEach((c: any) => {
            otherOpenLines.push(`  - [${c.id}] ${c.text}`);
          });
      });
    }
    const otherOpenConcernsText = otherOpenLines.length > 0
      ? otherOpenLines.join('\n')
      : '(none — all other concerns are already addressed)';

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

CONCERN RESOLUTION EVALUATION:
The specific concern from ${judgeName} that was targeted by today's question (ID: ${activeConcernId}): "${activeConcernText}"

Other open concerns across ALL board members that could also be addressed by this answer:
${otherOpenConcernsText}

Provide:
1. "scoreDelta" indicating exactly how your confidence changed based on the rules above.
2. "emotion" ("smile", "neutral", or "worse").
3. "updatedContext": a brief updated summary of the meeting context reflecting the new information provided by the user.
4. "reasoning": A detailed feedback monologue explaining exactly how you calculated the score delta using the FIXED criteria above, citing the specific logic the user provided.
5. "resolvedConcernIds": Array of concern IDs that the Founder's answer has adequately resolved. Include the active concern ID (${activeConcernId}) if scoreDelta >= 3. Only include IDs where the answer directly and sufficiently addressed the concern's substance. Can be empty array [].
6. "crossResolvedConcerns": Array of objects for OTHER personas' concerns that this answer ALSO clearly resolved (rarer — only when the answer directly addresses the concern). Format: [{"personaIndex": 1, "concernId": "p1_c2"}]. Can be empty array [].
7. "newConcern": If the Founder's answer revealed a NEW critical gap in your domain not already covered by existing concerns, provide a brief noun clause (e.g., "Unexplained dependency on a single supplier"). Otherwise return null. Only generate if genuinely new and not covered by existing concerns. Return null if turn count is high (${turnCount}).

Output strictly valid JSON:
{
  "scoreDelta": 5,
  "emotion": "smile",
  "updatedContext": "...",
  "reasoning": "...",
  "resolvedConcernIds": [],
  "crossResolvedConcerns": [],
  "newConcern": null
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
    console.log(`Resolved Concern IDs: ${JSON.stringify(data.resolvedConcernIds)}`);
    console.log(`Cross Resolved: ${JSON.stringify(data.crossResolvedConcerns)}`);
    console.log(`New Concern: ${data.newConcern}`);
    console.log(`Reasoning/Feedback: ${data.reasoning}`);
    console.log(`================================================\n`);

    // Validate emotion enum
    if (!['smile', 'neutral', 'worse'].includes(data.emotion)) {
      data.emotion = 'neutral';
    }

    // Cap delta
    if (typeof data.scoreDelta !== 'number') data.scoreDelta = 0;
    data.scoreDelta = Math.max(-10, Math.min(10, data.scoreDelta));

    // Validate resolvedConcernIds
    if (!Array.isArray(data.resolvedConcernIds)) data.resolvedConcernIds = [];
    data.resolvedConcernIds = data.resolvedConcernIds.filter((id: any) => typeof id === 'string');

    // Validate crossResolvedConcerns
    if (!Array.isArray(data.crossResolvedConcerns)) data.crossResolvedConcerns = [];
    data.crossResolvedConcerns = data.crossResolvedConcerns.filter(
      (cr: any) => typeof cr?.personaIndex === 'number' && typeof cr?.concernId === 'string'
    );

    // Validate newConcern
    if (typeof data.newConcern !== 'string' || data.newConcern.trim() === '') {
      data.newConcern = null;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
