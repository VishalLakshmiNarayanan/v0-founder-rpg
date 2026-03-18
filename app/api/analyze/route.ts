import { generateText, Output } from 'ai'
import { z } from 'zod'
import pdf from 'pdf-parse'

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

async function extractTextFromPDF(base64Data: string): Promise<string> {
  try {
    // Remove data URL prefix if present
    const base64Clean = base64Data.replace(/^data:application\/pdf;base64,/, '')
    const buffer = Buffer.from(base64Clean, 'base64')
    const data = await pdf(buffer)
    return data.text
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

export async function POST(req: Request) {
  const { fileData, fileName, meetingContext } = await req.json()

  // Extract text from the PDF
  let documentText: string
  try {
    documentText = await extractTextFromPDF(fileData)
  } catch {
    return Response.json(
      { error: 'Failed to read PDF. Please ensure the file is a valid PDF document.' },
      { status: 400 }
    )
  }

  // Truncate if too long (keep first ~15000 chars for context window)
  const truncatedText = documentText.length > 15000 
    ? documentText.slice(0, 15000) + '\n\n[Document truncated for analysis...]' 
    : documentText

  const systemPrompt = `You are an expert at analyzing documents and creating appropriate review committee personas.
Based on the document text provided and the meeting context, you will:
1. Analyze the document to understand its purpose and content
2. Create 3 distinct committee member personas who would realistically review this type of document
3. Each persona should have different expertise areas relevant to the document
4. Identify key topics and potential weaknesses to explore

For different document types, create appropriate reviewers:
- Pitch deck/Business plan: VCs, industry experts, financial analysts
- Research paper: Domain experts, methodology experts, application specialists  
- Proposal: Stakeholders, technical reviewers, budget analysts
- Report: Executives, domain experts, implementation specialists
- Technical documentation: Engineers, architects, security experts
- Legal documents: Lawyers, compliance officers, risk analysts
- Marketing materials: Marketing experts, brand strategists, consumer analysts

The personas should be challenging but fair, with realistic professional backgrounds.
Base your analysis ONLY on the actual content of the document provided.`

  try {
    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-4',
      output: Output.object({
        schema: personaSchema,
      }),
      messages: [
        {
          role: 'user',
          content: `Meeting Context: ${meetingContext || 'General document review'}

Document Name: ${fileName || 'document.pdf'}

=== DOCUMENT CONTENT ===
${truncatedText}
=== END DOCUMENT ===

Based on the above document content, analyze it and create appropriate committee personas for a rigorous review session.`,
        },
      ],
      system: systemPrompt,
    })

    // Include the extracted text in the response for use in questions
    return Response.json({ 
      analysis: output,
      documentText: truncatedText 
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return Response.json(
      { error: 'Failed to analyze document' },
      { status: 500 }
    )
  }
}
