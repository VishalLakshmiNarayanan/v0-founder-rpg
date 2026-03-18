import { generateText, Output } from 'ai'
import { z } from 'zod'

const personaSchema = z.object({
  personas: z.array(z.object({
    name: z.string().describe('A realistic professional name for this committee member'),
    role: z.string().describe('Their role/expertise area (2-3 words max)'),
    personality: z.string().describe('Brief personality description that affects how they question'),
    focusAreas: z.array(z.string()).describe('3-5 specific areas they will scrutinize based on the document'),
    toughQuestionStyle: z.string().describe('How they frame challenging questions'),
  })).length(3).describe('Exactly 3 committee members'),
  documentSummary: z.string().describe('Brief summary of what the document is about'),
  documentType: z.string().describe('Type of document: pitch_deck, business_plan, proposal, report, research, other'),
  keyTopics: z.array(z.string()).describe('5-7 key topics extracted from the document that should be discussed'),
  potentialWeaknesses: z.array(z.string()).describe('3-5 potential weaknesses or areas of concern the committee might probe'),
})

export async function POST(req: Request) {
  const { fileData, fileName, meetingContext } = await req.json()

  const systemPrompt = `You are an expert at analyzing documents and creating appropriate review committee personas.
Based on the document provided and the meeting context, you will:
1. Analyze the document to understand its purpose and content
2. Create 3 distinct committee member personas who would realistically review this type of document
3. Each persona should have different expertise areas relevant to the document
4. Identify key topics and potential weaknesses to explore

For different document types, create appropriate reviewers:
- Pitch deck/Business plan: VCs, industry experts, financial analysts
- Research paper: Domain experts, methodology experts, application specialists  
- Proposal: Stakeholders, technical reviewers, budget analysts
- Report: Executives, domain experts, implementation specialists

The personas should be challenging but fair, with realistic professional backgrounds.`

  try {
    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-4',
      output: Output.object({
        schema: personaSchema,
      }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Meeting Context: ${meetingContext || 'General document review'}\n\nAnalyze this document and create appropriate committee personas:`,
            },
            {
              type: 'file',
              data: fileData,
              mediaType: 'application/pdf',
              filename: fileName || 'document.pdf',
            },
          ],
        },
      ],
      system: systemPrompt,
    })

    return Response.json({ analysis: output })
  } catch (error) {
    console.error('Analysis error:', error)
    return Response.json(
      { error: 'Failed to analyze document' },
      { status: 500 }
    )
  }
}
