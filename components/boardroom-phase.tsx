"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Judge } from './judge'
import { ConfidenceMeter } from './confidence-meter'
import { DialogueHUD } from './dialogue-hud'
import type { JudgeEmotion } from '@/hooks/use-game-state'

const judges = [
  { name: 'Victoria Chen', role: 'Strategic Ops' },
  { name: 'Marcus Wei', role: 'Market Analysis' },
  { name: 'Richard Sterling', role: 'Financial Review' },
]

const sampleDialogues = [
  { judge: 1, text: "Your market positioning is intriguing, but I need to understand your competitive moat. What prevents a well-funded competitor from replicating your approach within 18 months?" },
  { judge: 0, text: "I've reviewed your financial projections. Your customer acquisition cost seems optimistic. Walk me through your unit economics assumptions." },
  { judge: 2, text: "The team composition concerns me. I see strong technical talent, but where's your go-to-market expertise? How do you plan to bridge that gap?" },
  { judge: 1, text: "Your Series A valuation asks for a significant premium. Convince me why this isn't just another B2B SaaS play with a fancy AI wrapper." },
  { judge: 0, text: "Let's talk about your runway. With current burn rate and this raise, you're looking at 18 months. What milestones must you hit to ensure Series B?" },
]

interface BoardroomPhaseProps {
  initialConfidence: number
  onConfidenceChange: (score: number) => void
  onGameEnd: (finalScore: number) => void
}

export function BoardroomPhase({ 
  initialConfidence, 
  onConfidenceChange,
  onGameEnd 
}: BoardroomPhaseProps) {
  const [confidence, setConfidence] = useState(initialConfidence)
  const [previousConfidence, setPreviousConfidence] = useState(initialConfidence)
  const [activeJudge, setActiveJudge] = useState(1)
  const [emotions, setEmotions] = useState<[JudgeEmotion, JudgeEmotion, JudgeEmotion]>(['neutral', 'neutral', 'neutral'])
  const [dialogueIndex, setDialogueIndex] = useState(0)
  const [currentDialogue, setCurrentDialogue] = useState('')
  const [turnCount, setTurnCount] = useState(0)

  useEffect(() => {
    // Initialize first dialogue
    const firstDialogue = sampleDialogues[0]
    setActiveJudge(firstDialogue.judge)
    setCurrentDialogue(firstDialogue.text)
  }, [])

  const handleResponse = useCallback((response: string) => {
    // Simple scoring based on response length and keywords
    const positiveKeywords = ['growth', 'scale', 'market', 'revenue', 'team', 'data', 'advantage', 'unique', 'proven', 'traction']
    const negativeKeywords = ['maybe', 'hope', 'think', 'probably', 'soon', 'eventually', 'working on']
    
    let scoreDelta = 0
    const lowerResponse = response.toLowerCase()
    
    positiveKeywords.forEach(keyword => {
      if (lowerResponse.includes(keyword)) scoreDelta += 3
    })
    
    negativeKeywords.forEach(keyword => {
      if (lowerResponse.includes(keyword)) scoreDelta -= 2
    })
    
    // Bonus for detailed responses
    if (response.length > 100) scoreDelta += 5
    if (response.length > 200) scoreDelta += 5
    
    // Random factor
    scoreDelta += Math.floor(Math.random() * 10) - 5
    
    // Update confidence
    setPreviousConfidence(confidence)
    const newConfidence = Math.max(0, Math.min(100, confidence + scoreDelta))
    setConfidence(newConfidence)
    onConfidenceChange(newConfidence)

    // Update emotions based on score change
    const newEmotions: [JudgeEmotion, JudgeEmotion, JudgeEmotion] = [...emotions]
    if (scoreDelta > 5) {
      newEmotions[activeJudge] = 'smile'
    } else if (scoreDelta < -3) {
      newEmotions[activeJudge] = 'worse'
    } else {
      newEmotions[activeJudge] = 'neutral'
    }
    setEmotions(newEmotions)

    // Progress to next turn
    const nextTurn = turnCount + 1
    setTurnCount(nextTurn)

    // Check for game end
    if (nextTurn >= sampleDialogues.length || newConfidence <= 10 || newConfidence >= 90) {
      setTimeout(() => onGameEnd(newConfidence), 1500)
      return
    }

    // Next dialogue after delay
    setTimeout(() => {
      const nextDialogue = sampleDialogues[nextTurn]
      setActiveJudge(nextDialogue.judge)
      setCurrentDialogue(nextDialogue.text)
      setDialogueIndex(nextTurn)
      
      // Reset other judges to neutral
      setEmotions(['neutral', 'neutral', 'neutral'])
    }, 1000)
  }, [confidence, emotions, activeJudge, turnCount, onConfidenceChange, onGameEnd])

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
            QUESTION {turnCount + 1}/{sampleDialogues.length}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
