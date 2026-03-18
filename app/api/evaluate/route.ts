import { generateText, Output } from 'ai'
import { z } from 'zod'

const evaluationSchema = z.object({
  scoreDelta: z.number().min(-20).max(20).describe('Change in confidence score (-20 to +20)'),
  emotion: z.enum(['smile', 'neutral', 'worse']).describe('Judge reaction'),
  feedback: z.string().describe('Brief internal assessment (not shown to user)'),
  strengthsNoted: z.array(z.string()).describe('What the answer did well'),
  weaknessesNoted: z.array(z.string()).describe('What could be improved'),
})

export async function POST(req: Request) {
  const { 
    question, 
    answer, 
    expectedTopics,
    judgeName,
    judgePersonality,
    documentSummary,
    documentText,
    currentConfidence
  } = await req.json()

  const systemPrompt = `You are evaluating a response in a Shadow Committee review session.

EVALUATING JUDGE: ${judgeName}
JUDGE PERSONALITY: ${judgePersonality}

DOCUMENT SUMMARY: ${documentSummary}

DOCUMENT CONTENT (for fact-checking):
${documentText ? documentText.slice(0, 6000) : 'Not available'}

THE QUESTION ASKED: ${question}

TOPICS A GOOD ANSWER SHOULD ADDRESS: ${expectedTopics.join(', ')}

CURRENT CONFIDENCE: ${currentConfidence}%

Evaluate the answer fairly but critically. Consider:
1. Did they address the core question?
2. Did they cover the expected topics?
3. Was the response specific or vague?
4. Did they show confidence and competence?
5. Were there any red flags or evasions?

Scoring guide:
- Excellent, comprehensive answer: +10 to +20
- Good, solid answer: +5 to +10  
- Adequate but room for improvement: -5 to +5
- Weak or evasive answer: -10 to -5
- Very poor, missed the point: -15 to -10
- Concerning answer that raises red flags: -20 to -15

The judge's emotion should reflect the score:
- smile: score > +5
- neutral: score between -5 and +5
- worse: score < -5`

  try {
    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-4',
      output: Output.object({
        schema: evaluationSchema,
      }),
      messages: [
        {
          role: 'user',
          content: `The candidate answered: "${answer}"`,
        },
      ],
      system: systemPrompt,
    })

    return Response.json({ evaluation: output })
  } catch (error) {
    console.error('Evaluation error:', error)
    return Response.json(
      { error: 'Failed to evaluate response' },
      { status: 500 }
    )
  }
}
