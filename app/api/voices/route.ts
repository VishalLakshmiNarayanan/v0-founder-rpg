import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 500 })
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch voices' }, { status: response.status })
    }

    const data = await response.json()
    const voices = data.voices.map((v: any) => ({
      voice_id: v.voice_id,
      name: v.name,
      category: v.category,
      labels: v.labels,
    }))

    console.log('Available ElevenLabs voices:', JSON.stringify(voices, null, 2))
    return NextResponse.json({ voices })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
