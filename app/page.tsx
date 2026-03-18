"use client"

import { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { BriefingPhase } from '@/components/briefing-phase'
import { TransitionPhase } from '@/components/transition-phase'
import { BoardroomPhase } from '@/components/boardroom-phase'
import { ResultsPhase } from '@/components/results-phase'
import type { DocumentAnalysis } from '@/hooks/use-game-state'

type GamePhase = 'briefing' | 'transition' | 'boardroom' | 'results'

export default function ShadowCommittee() {
  const [phase, setPhase] = useState<GamePhase>('briefing')
  const [confidence, setConfidence] = useState(50)
  const [finalScore, setFinalScore] = useState(50)
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  const handleInitialize = useCallback(async (file: File | null, context: string) => {
    if (!file) {
      setAnalyzeError('Please upload a PDF document')
      return
    }

    setIsAnalyzing(true)
    setAnalyzeError(null)

    try {
      // Convert file to base64
      const buffer = await file.arrayBuffer()
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      )

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64,
          fileName: file.name,
          meetingContext: context,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze document')
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      if (data.analysis) {
        setAnalysis(data.analysis)
        setPhase('transition')
      } else {
        throw new Error('No analysis returned')
      }
    } catch (error) {
      console.error('Analysis failed:', error)
      setAnalyzeError(
        error instanceof Error 
          ? error.message 
          : 'Failed to analyze document. Please try again.'
      )
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const handleTransitionComplete = useCallback(() => {
    setPhase('boardroom')
  }, [])

  const handleConfidenceChange = useCallback((score: number) => {
    setConfidence(score)
  }, [])

  const handleGameEnd = useCallback((score: number) => {
    setFinalScore(score)
    setPhase('results')
  }, [])

  const handleRestart = useCallback(() => {
    setConfidence(50)
    setFinalScore(50)
    setAnalysis(null)
    setAnalyzeError(null)
    setPhase('briefing')
  }, [])

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#001E44]">
      <AnimatePresence mode="wait">
        {phase === 'briefing' && (
          <BriefingPhase 
            key="briefing"
            onInitialize={handleInitialize}
            isLoading={isAnalyzing}
            error={analyzeError}
          />
        )}
        
        {phase === 'transition' && (
          <TransitionPhase 
            key="transition"
            onComplete={handleTransitionComplete}
            documentType={analysis?.documentType}
          />
        )}
        
        {phase === 'boardroom' && analysis && (
          <BoardroomPhase 
            key="boardroom"
            initialConfidence={confidence}
            analysis={analysis}
            onConfidenceChange={handleConfidenceChange}
            onGameEnd={handleGameEnd}
          />
        )}
        
        {phase === 'results' && (
          <ResultsPhase 
            key="results"
            finalScore={finalScore}
            onRestart={handleRestart}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
