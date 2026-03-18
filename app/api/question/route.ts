import { generateText, Output } from 'ai'
import { z } from 'zod'

const questionSchema = z.object({
  question: z.string().describe('The challenging question to ask'),
  judgeIndex: z.number().min(0).max(2).describe('Which judge (0, 1, or 2) asks this question'),
  expectedTopics: z.array(z.string()).describe('Topics a good answer should address'),
  followUpHint: z.string().nullable().describe('Potential follow-up if answer is weak'),
})

export async function POST(req: Request) {
  const { 
    personas, 
    documentSummary, 
    keyTopics, 
    potentialWeaknesses,
    previousQuestions,
    previousAnswers,
    currentConfidence,
    questionNumber,
    totalQuestions
  } = await req.json()

  const questionHistory = previousQuestions?.map((q: string, i: number) => 
    `Q${i + 1}: ${q}\nA${i + 1}: ${previousAnswers?.[i] || 'No answer'}`
  ).join('\n\n') || 'No previous questions'

  const systemPrompt = `You are generating questions for a Shadow Committee review session.

COMMITTEE MEMBERS:
${personas.map((p: { name: string; role: string; personality: string; focusAreas: string[]; toughQuestionStyle: string }, i: number) => 
  `${i}. ${p.name} (${p.role})
   Personality: ${p.personality}
   Focus Areas: ${p.focusAreas.join(', ')}
   Question Style: ${p.toughQuestionStyle}`
).join('\n\n')}

DOCUMENT: ${documentSummary}

KEY TOPICS TO EXPLORE: ${keyTopics.join(', ')}

POTENTIAL WEAKNESSES: ${potentialWeaknesses.join(', ')}

CONVERSATION SO FAR:
${questionHistory}

CURRENT STATE:
- Question ${questionNumber} of ${totalQuestions}
- Current confidence score: ${currentConfidence}%
- ${currentConfidence < 40 ? 'The candidate is struggling - consider giving them a chance to recover with a fair question' : 
   currentConfidence > 70 ? 'The candidate is doing well - time for a more challenging question' : 
   'Keep balanced pressure'}

Generate the next question. Rules:
1. Don't repeat topics already covered
2. Match the question style to the assigned judge's personality
3. Questions should be specific to the actual document content
4. Progress from foundational to more challenging questions
5. Each judge should get roughly equal turns`

  try {
    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-4',
      output: Output.object({
        schema: questionSchema,
      }),
      messages: [
        {
          role: 'user',
          content: 'Generate the next committee question based on the context provided.',
        },
      ],
      system: systemPrompt,
    })

    return Response.json({ question: output })
  } catch (error) {
    console.error('Question generation error:', error)
    return Response.json(
      { error: 'Failed to generate question' },
      { status: 500 }
    )
  }
}
