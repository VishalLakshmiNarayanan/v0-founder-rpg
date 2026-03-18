"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Judge } from './judge'
import { ConfidenceMeter } from './confidence-meter'
import { DialogueHUD } from './dialogue-hud'
import type { JudgeEmotion, DocumentAnalysis } from '@/hooks/use-game-state'
import { Spinner } from '@/components/ui/spinner'

interface BoardroomPhaseProps {
  initialConfidence: number
  analysis: DocumentAnalysis
  onConfidenceChange: (score: number) => void
  onGameEnd: (finalScore: number) => void
}

export function BoardroomPhase({ 
  initialConfidence, 
  analysis,
  onConfidenceChange,
  onGameEnd 
}: BoardroomPhaseProps) {
  const [confidence, setConfidence] = useState(initialConfidence)
  const [previousConfidence, setPreviousConfidence] = useState(initialConfidence)
  const [activeJudge, setActiveJudge] = useState(1)
  const [emotions, setEmotions] = useState<[JudgeEmotion, JudgeEmotion, JudgeEmotion]>(['neutral', 'neutral', 'neutral'])
  const [currentDialogue, setCurrentDialogue] = useState('')
  const [questionNumber, setQuestionNumber] = useState(0)
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([])
  const [previousAnswers, setPreviousAnswers] = useState<string[]>([])
  const [expectedTopics, setExpectedTopics] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEvaluating, setIsEvaluating] = useState(false)
  
  const totalQuestions = 5

  // Generate first question on mount
  useEffect(() => {
    generateQuestion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generateQuestion = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personas: analysis.personas,
          documentSummary: analysis.documentSummary,
          keyTopics: analysis.keyTopics,
          potentialWeaknesses: analysis.potentialWeaknesses,
          previousQuestions,
          previousAnswers,
          currentConfidence: confidence,
          questionNumber: questionNumber + 1,
          totalQuestions,
        }),
      })

      const data = await response.json()
      
      if (data.question) {
        setActiveJudge(data.question.judgeIndex)
        setCurrentDialogue(data.question.question)
        setExpectedTopics(data.question.expectedTopics)
        // Reset emotions when new question starts
        setEmotions(['neutral', 'neutral', 'neutral'])
      }
    } catch (error) {
      console.error('Failed to generate question:', error)
      // Fallback question
      setCurrentDialogue("Let's discuss the key aspects of your proposal. What makes your approach unique?")
    } finally {
      setIsLoading(false)
    }
  }, [analysis, previousQuestions, previousAnswers, confidence, questionNumber])

  const handleResponse = useCallback(async (response: string) => {
    setIsEvaluating(true)
    
    try {
      const evalResponse = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentDialogue,
          answer: response,
          expectedTopics,
          judgeName: analysis.personas[activeJudge]?.name,
          judgePersonality: analysis.personas[activeJudge]?.personality,
          documentSummary: analysis.documentSummary,
          currentConfidence: confidence,
        }),
      })

      const evalData = await evalResponse.json()
      
      if (evalData.evaluation) {
        const { scoreDelta, emotion } = evalData.evaluation
        
        // Update confidence
        setPreviousConfidence(confidence)
        const newConfidence = Math.max(0, Math.min(100, confidence + scoreDelta))
        setConfidence(newConfidence)
        onConfidenceChange(newConfidence)

        // Update emotion for the active judge
        const newEmotions: [JudgeEmotion, JudgeEmotion, JudgeEmotion] = ['neutral', 'neutral', 'neutral']
        newEmotions[activeJudge] = emotion
        setEmotions(newEmotions)

        // Store Q&A history
        setPreviousQuestions(prev => [...prev, currentDialogue])
        setPreviousAnswers(prev => [...prev, response])
        
        const nextQuestion = questionNumber + 1
        setQuestionNumber(nextQuestion)

        // Check for game end
        if (nextQuestion >= totalQuestions || newConfidence <= 10 || newConfidence >= 95) {
          setTimeout(() => onGameEnd(newConfidence), 1500)
          return
        }

        // Generate next question after delay
        setTimeout(() => {
          generateQuestion()
        }, 1500)
      }
    } catch (error) {
      console.error('Failed to evaluate response:', error)
      // Fallback: random small adjustment
      const fallbackDelta = Math.floor(Math.random() * 10) - 3
      const newConfidence = Math.max(0, Math.min(100, confidence + fallbackDelta))
      setConfidence(newConfidence)
      onConfidenceChange(newConfidence)
      
      setPreviousQuestions(prev => [...prev, currentDialogue])
      setPreviousAnswers(prev => [...prev, response])
      setQuestionNumber(prev => prev + 1)
      
      setTimeout(() => generateQuestion(), 1000)
    } finally {
      setIsEvaluating(false)
    }
  }, [
    currentDialogue, 
    expectedTopics, 
    analysis, 
    activeJudge, 
    confidence, 
    questionNumber, 
    onConfidenceChange, 
    onGameEnd,
    generateQuestion
  ])

  const judges = analysis.personas.map(p => ({
    name: p.name,
    role: p.role,
  }))

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

      {/* Loading Overlay */}
      {(isLoading || isEvaluating) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-40 flex items-center justify-center bg-[#001E44]/50"
        >
          <div className="glass rounded-xl p-6 border border-[#FFC627]/30 flex items-center gap-4">
            <Spinner className="text-[#FFC627]" />
            <span className="font-mono text-sm text-[#FFC627]">
              {isLoading ? 'Committee is deliberating...' : 'Evaluating response...'}
            </span>
          </div>
        </motion.div>
      )}

      {/* Dialogue HUD */}
      <DialogueHUD
        dialogue={currentDialogue}
        speakerName={judges[activeJudge]?.name || 'Committee'}
        onRespond={handleResponse}
        disabled={isLoading || isEvaluating}
      />

      {/* Turn indicator */}
      <div className="absolute top-4 right-4 z-30">
        <div className="glass rounded-lg px-4 py-2 border border-[#4A5568]/30">
          <span className="font-mono text-xs text-[#A0AEC0]">
            QUESTION {questionNumber + 1}/{totalQuestions}
          </span>
        </div>
      </div>

      {/* Document context hint */}
      <div className="absolute top-4 left-4 z-30 max-w-xs">
        <div className="glass rounded-lg px-4 py-2 border border-[#4A5568]/30">
          <span className="font-mono text-xs text-[#A0AEC0] uppercase tracking-wider">
            {analysis.documentType.replace('_', ' ')}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
