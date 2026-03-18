"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Judge } from './judge'
import { DialogueHUD } from './dialogue-hud'
import type { JudgeEmotion } from '@/hooks/use-game-state'

interface BoardroomPhaseProps {
  initialConfidence: number
  onConfidenceChange: (score: number) => void
  onGameEnd: (finalScore: number, reportData: any) => void
  gameData: { personas: any[], questions: any[], context: string } | null
}

export function BoardroomPhase({ 
  initialConfidence, 
  onConfidenceChange,
  onGameEnd,
  gameData
}: BoardroomPhaseProps) {
  const judges = gameData?.personas || [
    { name: 'Loading...', role: '...' },
    { name: 'Loading...', role: '...' },
    { name: 'Loading...', role: '...' }
  ];

  const getInitialConfidence = (index: number) => {
    return judges[index]?.initial_confidence !== undefined 
      ? judges[index].initial_confidence 
      : initialConfidence;
  };

  const [confidences, setConfidences] = useState([
    getInitialConfidence(0), 
    getInitialConfidence(1), 
    getInitialConfidence(2)
  ]);
  const [previousConfidences, setPreviousConfidences] = useState([
    getInitialConfidence(0), 
    getInitialConfidence(1), 
    getInitialConfidence(2)
  ]);
  const [activeJudge, setActiveJudge] = useState(1);
  const [emotions, setEmotions] = useState<[JudgeEmotion, JudgeEmotion, JudgeEmotion]>(['neutral', 'neutral', 'neutral']);
  const [dialogueIndex, setDialogueIndex] = useState(0)
  const [currentDialogue, setCurrentDialogue] = useState('')
  const [turnCount, setTurnCount] = useState(0)
  const [chatHistory, setChatHistory] = useState<{ role: string, content: string }[]>([])
  const MAX_TURNS = 6;

  const [isEvaluating, setIsEvaluating] = useState(false)
  const [meetingContext, setMeetingContext] = useState(gameData?.context || '')

  const dialogues = gameData?.questions || []

  useEffect(() => {
    if (dialogues.length > 0) {
      const firstDialogue = dialogues[0]
      setActiveJudge(firstDialogue.judge)
      setCurrentDialogue(firstDialogue.text)
    }
  }, [dialogues])

  const handleResponse = useCallback(async (response: string) => {
    if (isEvaluating) return;
    setIsEvaluating(true);

    try {
      const currentJudge = judges[activeJudge];

      const newInteraction = [
        { role: `${currentJudge.name} (${currentJudge.role})`, content: currentDialogue },
        { role: 'Founder', content: response }
      ];
      const updatedHistory = [...chatHistory, ...newInteraction];
      setChatHistory(updatedHistory);

      // STEP 1: Evaluate Answer
      const evaluateRes = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: response,
          question: currentDialogue,
          context: meetingContext,
          judgeName: currentJudge.name,
          judgeRole: currentJudge.role,
          personaPrompt: currentJudge.evaluationPrompt,
          chatHistory: updatedHistory
        })
      });

      const evaluateResult = await evaluateRes.json();
      const scoreDelta = evaluateResult?.data?.scoreDelta || 0;
      let emotion = evaluateResult?.data?.emotion || 'neutral';
      if (!['smile', 'neutral', 'worse'].includes(emotion)) emotion = 'neutral';
      const newContext = evaluateResult?.data?.updatedContext || meetingContext;
      setMeetingContext(newContext);

      // Update confidence for active judge
      setPreviousConfidences([...confidences])
      const newConfidences = [...confidences]
      newConfidences[activeJudge] = Math.max(0, Math.min(100, newConfidences[activeJudge] + scoreDelta))
      setConfidences(newConfidences)
      
      const avgConfidence = Math.round(newConfidences.reduce((a, b) => a + b, 0) / 3)
      onConfidenceChange(avgConfidence)

      // Update emotions
      const newEmotions: [JudgeEmotion, JudgeEmotion, JudgeEmotion] = [...emotions]
      newEmotions[activeJudge] = emotion as JudgeEmotion
      setEmotions(newEmotions)

      // Check for game end
      const nextTurn = turnCount + 1
      setTurnCount(nextTurn)
      if (nextTurn >= MAX_TURNS || avgConfidence <= 10 || avgConfidence >= 90) {
        setTimeout(() => onGameEnd(avgConfidence, { chatHistory: updatedHistory, meetingContext: newContext, judges, confidences: newConfidences }), 1500)
        return
      }

      // Determine next targeted judge and planned question from the initial PDF generation
      const targetDialogue = dialogues[nextTurn];
      const nextJudgeIndex = targetDialogue?.judge !== undefined ? targetDialogue.judge : (activeJudge + 1) % 3;
      const nextJudge = judges[nextJudgeIndex];
      const plannedQuestion = targetDialogue?.text || null;

      // STEP 2: Generate Next Question orchestrating the proceeding persona
      const questionRes = await fetch('/api/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: newContext,
          judgeName: nextJudge.name,
          judgeRole: nextJudge.role,
          personaPrompt: nextJudge.evaluationPrompt,
          chatHistory: updatedHistory,
          plannedQuestion: plannedQuestion
        })
      });

      const questionResult = await questionRes.json();
      const nextQuestion = questionResult?.data?.question || 'Could you provide more specifics on that?';

      // Next dialogue after delay
      setTimeout(() => {
        setActiveJudge(nextJudgeIndex)
        setCurrentDialogue(nextQuestion)
        
        // Reset emotions to neutral
        setEmotions(['neutral', 'neutral', 'neutral'])
        setIsEvaluating(false);
      }, 3000)

    } catch (e) {
      console.error(e);
      setIsEvaluating(false);
    }
  }, [confidences, emotions, activeJudge, turnCount, onConfidenceChange, onGameEnd, currentDialogue, gameData, isEvaluating, chatHistory, judges, meetingContext])

  const [displayedText, setDisplayedText] = useState('')
  const [isDialogueComplete, setIsDialogueComplete] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const speakDialogue = useCallback(async (text: string, judgeIndex: number) => {
    // Premium ElevenLabs Voice ID Mapping
    const voiceIds = [
      'EXAVITQu4vr4xnSDxMaL', // Persona 0: Sarah (Soft, Professional Female)
      'JBFqnCBsd6RMkjVDRZzb', // Persona 1: George (Deep, Steady Male - from docs example)
      'TX3LPaxmHKxFdv7VOQHJ', // Persona 2: Liam (Articulate, Young Male)
    ]
    const selectedVoiceId = voiceIds[judgeIndex] || voiceIds[0]

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId: selectedVoiceId })
      })

      if (!response.ok) {
        throw new Error('TTS API failed to return stream buffer. Did you configure the ELEVENLABS_API_KEY?')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = audioUrl
        audioRef.current.play()
      } else {
        const audio = new Audio(audioUrl)
        audio.play()
        audioRef.current = audio
      }
    } catch (err) {
      console.error("ElevenLabs TTS Streaming Error:", err)
    }
  }, [])

  // Typewriter effect & Voice Trigger
  useEffect(() => {
    setDisplayedText('')
    setIsDialogueComplete(false)
    
    if (!currentDialogue) return

    // Trigger explicit TTS play!
    speakDialogue(currentDialogue, activeJudge)

    let index = 0
    const interval = setInterval(() => {
      if (index < currentDialogue.length) {
        setDisplayedText(currentDialogue.slice(0, index + 1))
        index++
      } else {
        setIsDialogueComplete(true)
        clearInterval(interval)
      }
    }, 30)

    return () => clearInterval(interval)
  }, [currentDialogue, activeJudge, speakDialogue])

  const judgePositions = [
    { left: '10%', bottom: '22%', zIndex: 10 }, 
    { left: '50%', transform: 'translateX(-50%)', bottom: '22%', zIndex: 5 },
    { right: '10%', bottom: '22%', zIndex: 10 } 
  ]

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
          backgroundImage: `url('/room.png')`,
        }}
      />
      
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#001E44]/20 via-transparent to-black/80" />

      {/* Judges absolutely positioned */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {judges.map((judge, index) => (
          <div 
            key={index} 
            className="absolute" 
            style={judgePositions[index]}
          >
            <Judge
              index={index}
              emotion={emotions[index]}
              isActive={activeJudge === index}
              name={judge.name}
              role={judge.role}
              confidence={confidences[index]}
              previousConfidence={previousConfidences[index]}
              dialogue={activeJudge === index ? displayedText : null}
              personaPrompt={judge.evaluationPrompt || judge.prompt}
            />
          </div>
        ))}
      </div>

      {/* Dialogue HUD Terminal */}
      <DialogueHUD
        onRespond={handleResponse}
        isEvaluating={isEvaluating}
        canRespond={isDialogueComplete}
      />

      {/* Turn indicator */}
      <div className="absolute top-4 right-4 z-30">
        <div className="glass rounded-lg px-4 py-2 border border-[#4A5568]/30">
          <span className="font-mono text-xs text-[#A0AEC0]">
            QUESTION {turnCount + 1}/{MAX_TURNS}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
