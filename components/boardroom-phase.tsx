"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Judge } from './judge'
import { ConfidenceMeter } from './confidence-meter'
import { DialogueHUD } from './dialogue-hud'
import type { JudgeEmotion } from '@/hooks/use-game-state'

interface BoardroomPhaseProps {
  initialConfidence: number
  onConfidenceChange: (score: number) => void
  onGameEnd: (finalScore: number) => void
  gameData: { personas: any[], questions: any[], context: string } | null
}

export function BoardroomPhase({ 
  initialConfidence, 
  onConfidenceChange,
  onGameEnd,
  gameData
}: BoardroomPhaseProps) {
  const [confidence, setConfidence] = useState(initialConfidence)
  const [previousConfidence, setPreviousConfidence] = useState(initialConfidence)
  const [activeJudge, setActiveJudge] = useState(1)
  const [emotions, setEmotions] = useState<[JudgeEmotion, JudgeEmotion, JudgeEmotion]>(['neutral', 'neutral', 'neutral'])
  const [dialogueIndex, setDialogueIndex] = useState(0)
  const [currentDialogue, setCurrentDialogue] = useState('')
  const [turnCount, setTurnCount] = useState(0)

  const [isEvaluating, setIsEvaluating] = useState(false)

  const judges = gameData?.personas || [
    { name: 'Loading...', role: '...' },
    { name: 'Loading...', role: '...' },
    { name: 'Loading...', role: '...' }
  ]
  const dialogues = gameData?.questions || []

  useEffect(() => {
    if (dialogues.length > 0) {
      const firstDialogue = dialogues[0]
      setActiveJudge(firstDialogue.judge)
      setCurrentDialogue(firstDialogue.text)
    }
  }, [dialogues])

  const handleResponse = useCallback(async (response: string) => {
    if (isEvaluating || dialogues.length === 0) return;
    setIsEvaluating(true);

    try {
      const currentJudge = judges[activeJudge];
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: response,
          question: currentDialogue,
          context: gameData?.context || '',
          judgeName: currentJudge.name,
          judgeRole: currentJudge.role
        })
      });

      const result = await res.json();
      const scoreDelta = result?.data?.scoreDelta || 0;
      let emotion = result?.data?.emotion || 'neutral';
      if (!['smile', 'neutral', 'worse'].includes(emotion)) emotion = 'neutral';

      // Update confidence
      setPreviousConfidence(confidence)
      const newConfidence = Math.max(0, Math.min(100, confidence + scoreDelta))
      setConfidence(newConfidence)
      onConfidenceChange(newConfidence)

      // Update emotions
      const newEmotions: [JudgeEmotion, JudgeEmotion, JudgeEmotion] = [...emotions]
      newEmotions[activeJudge] = emotion as JudgeEmotion
      setEmotions(newEmotions)

      // Progress to next turn
      const nextTurn = turnCount + 1
      setTurnCount(nextTurn)

      // Check for game end
      if (nextTurn >= dialogues.length || newConfidence <= 10 || newConfidence >= 90) {
        setTimeout(() => onGameEnd(newConfidence), 1500)
        return
      }

      // Next dialogue after delay
      setTimeout(() => {
        const nextDialogue = dialogues[nextTurn]
        setActiveJudge(nextDialogue.judge)
        setCurrentDialogue(nextDialogue.text)
        setDialogueIndex(nextTurn)
        
        // Reset emotions to neutral
        setEmotions(['neutral', 'neutral', 'neutral'])
        setIsEvaluating(false);
      }, 3000)

    } catch (e) {
      console.error(e);
      setIsEvaluating(false);
    }
  }, [confidence, emotions, activeJudge, turnCount, onConfidenceChange, onGameEnd, currentDialogue, gameData, isEvaluating, dialogues, judges])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-10"
    >
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/room-b8NCwcb8pRbXg7lhiJ1isN5D0X7znH.png')`,
        }}
      />
      
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#001E44]/30 via-transparent to-[#001E44]/70" />

      {/* Top HUD - Confidence Meter */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute top-0 left-0 right-0 z-30 pt-4 px-4"
      >
        <div className="glass rounded-xl p-4 max-w-2xl mx-auto border border-[#FFC627]/20">
          <ConfidenceMeter score={confidence} previousScore={previousConfidence} />
        </div>
      </motion.div>

      {/* Judges */}
      <div className="absolute inset-0 flex items-end justify-center pb-48 px-4">
        <div className="flex items-end justify-center gap-4 md:gap-8 lg:gap-12">
          {judges.map((judge, index) => (
            <Judge
              key={index}
              index={index}
              emotion={emotions[index]}
              isActive={activeJudge === index}
              name={judge.name}
              role={judge.role}
            />
          ))}
        </div>
      </div>

      {/* Dialogue HUD */}
      <DialogueHUD
        dialogue={currentDialogue}
        speakerName={judges[activeJudge]?.name || 'Committee'}
        onRespond={handleResponse}
      />

      {/* Turn indicator */}
      <div className="absolute top-4 right-4 z-30">
        <div className="glass rounded-lg px-4 py-2 border border-[#4A5568]/30">
          <span className="font-mono text-xs text-[#A0AEC0]">
            QUESTION {turnCount + 1}/{Math.max(1, dialogues.length)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
