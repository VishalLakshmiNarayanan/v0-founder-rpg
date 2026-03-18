"use client"

import { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { BriefingPhase } from '@/components/briefing-phase'
import { TransitionPhase } from '@/components/transition-phase'
import { BoardroomPhase } from '@/components/boardroom-phase'
import { ResultsPhase } from '@/components/results-phase'

type GamePhase = 'briefing' | 'transition' | 'boardroom' | 'results'

export default function ShadowCommittee() {
  const [phase, setPhase] = useState<GamePhase>('briefing')
  const [confidence, setConfidence] = useState(50)
  const [finalScore, setFinalScore] = useState(50)

  const handleInitialize = useCallback((file: File | null, context: string) => {
    setPhase('transition')
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
    setPhase('briefing')
  }, [])

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#001E44]">
      <AnimatePresence mode="wait">
        {phase === 'briefing' && (
          <BriefingPhase 
            key="briefing"
            onInitialize={handleInitialize} 
          />
        )}
        
        {phase === 'transition' && (
          <TransitionPhase 
            key="transition"
            onComplete={handleTransitionComplete} 
          />
        )}
        
        {phase === 'boardroom' && (
          <BoardroomPhase 
            key="boardroom"
            initialConfidence={confidence}
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
