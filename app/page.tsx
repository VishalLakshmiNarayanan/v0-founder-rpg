"use client"

import { useState, useCallback, useEffect } from 'react'
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
  const [gameData, setGameData] = useState<{ personas: any[], questions: any[], context: string } | null>(null)
  const [isTransitionComplete, setIsTransitionComplete] = useState(false)

  useEffect(() => {
    if (phase === 'transition' && gameData && isTransitionComplete) {
      setPhase('boardroom')
    }
  }, [phase, gameData, isTransitionComplete])

  const handleInitialize = useCallback(async (file: File | null, context: string) => {
    setPhase('transition')
    setIsTransitionComplete(false)
    setGameData(null)

    try {
      const formData = new FormData()
      if (file) formData.append('file', file)
      formData.append('context', context)

      const res = await fetch('/api/briefing', { method: 'POST', body: formData })
      const result = await res.json()
      if (result.success && result.data) {
        setGameData({
          personas: result.data.personas,
          questions: result.data.questions,
          context
        })
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleTransitionComplete = useCallback(() => {
    setIsTransitionComplete(true)
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
            gameData={gameData}
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
