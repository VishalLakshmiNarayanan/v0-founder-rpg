"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Judge } from './judge'
import { DialogueHUD } from './dialogue-hud'
import type { JudgeEmotion } from '@/hooks/use-game-state'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Concern {
  id: string        // format: "p{idx}_c{idx}", e.g. "p0_c2"
  text: string      // noun clause describing the gap/risk
  covered: boolean  // true once a question targeting this concern was asked
  resolved: boolean // true if the founder adequately answered it (LLM-confirmed)
}

interface BoardroomPhaseProps {
  initialConfidence: number
  onConfidenceChange: (score: number) => void
  onGameEnd: (finalScore: number, reportData: any) => void
  gameData: { personas: any[], context: string, outcomes?: any } | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_TOTAL_CONCERNS_PER_PERSONA = 5
const MAX_QUESTIONS_PER_PERSONA = 4
const MAX_TURNS = 12
const MIN_TURNS = 3

// ─── Pure Orchestration Functions ────────────────────────────────────────────

/**
 * Weighted random persona selector.
 * Lower confidence, more remaining question capacity, and more uncovered concerns
 * all increase a persona's probability of being selected next.
 * A 0.6x dampener is applied if the same persona spoke last turn.
 */
function selectNextPersona(
  confidences: number[],
  questionsPerPersona: number[],
  personaConcerns: Concern[][],
  lastPersona?: number
): number {
  const rawScores = [0, 1, 2].map(i => {
    const uncovered = personaConcerns[i].filter(c => !c.covered && !c.resolved).length
    if (uncovered === 0 || questionsPerPersona[i] >= MAX_QUESTIONS_PER_PERSONA) return 0

    const confWeight = (100 - confidences[i]) / 100
    const qRemainingWeight = 1 - questionsPerPersona[i] / MAX_QUESTIONS_PER_PERSONA
    const uncoveredWeight = uncovered / MAX_TOTAL_CONCERNS_PER_PERSONA

    let score = confWeight * 0.4 + qRemainingWeight * 0.3 + uncoveredWeight * 0.3
    if (i === lastPersona) score *= 0.6 // dampen back-to-back same persona
    return score
  })

  const total = rawScores.reduce((a, b) => a + b, 0)

  // Fallback: all exhausted → pick lowest-confidence persona
  if (total === 0) {
    let minConf = Infinity, fallback = 0
    confidences.forEach((c, i) => { if (c < minConf) { minConf = c; fallback = i } })
    return fallback
  }

  // Weighted random selection
  const probs = rawScores.map(s => s / total)
  const rand = Math.random()
  let cumul = 0
  for (let i = 0; i < 3; i++) {
    cumul += probs[i]
    if (rand <= cumul) return i
  }
  return 2 // floating-point edge fallback
}

/** Returns the first uncovered, unresolved concern for a persona. */
function getActiveConcern(concerns: Concern[]): Concern | null {
  return concerns.find(c => !c.covered && !c.resolved) ?? null
}

/** Collects texts of all concerns that have been covered or resolved, for repetition prevention. */
function buildCoveredConcernTexts(personaConcerns: Concern[][]): string[] {
  return personaConcerns.flat().filter(c => c.covered || c.resolved).map(c => c.text)
}

/** Returns true if the game should end. */
function checkGameEnd(
  turnCount: number,
  avgConfidence: number,
  personaConcerns: Concern[][],
  questionsPerPersona: number[]
): boolean {
  if (turnCount < MIN_TURNS) return false

  // Primary: all concerns done
  if (personaConcerns.every(pc => pc.every(c => c.covered || c.resolved))) return true

  // Safety caps
  if (turnCount >= MAX_TURNS) return true
  if (avgConfidence <= 10 || avgConfidence >= 90) return true

  // No eligible personas remain
  const anyEligible = [0, 1, 2].some(i =>
    personaConcerns[i].some(c => !c.covered && !c.resolved) &&
    questionsPerPersona[i] < MAX_QUESTIONS_PER_PERSONA
  )
  if (!anyEligible) return true

  return false
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  ]

  const getInitialConfidence = (index: number) =>
    judges[index]?.initial_confidence !== undefined
      ? judges[index].initial_confidence
      : initialConfidence

  // ── Core game state ────────────────────────────────────────────────────────
  const [confidences, setConfidences] = useState([
    getInitialConfidence(0),
    getInitialConfidence(1),
    getInitialConfidence(2)
  ])
  const [previousConfidences, setPreviousConfidences] = useState([
    getInitialConfidence(0),
    getInitialConfidence(1),
    getInitialConfidence(2)
  ])
  const [activeJudge, setActiveJudge] = useState(1)
  const [emotions, setEmotions] = useState<[JudgeEmotion, JudgeEmotion, JudgeEmotion]>(['neutral', 'neutral', 'neutral'])
  const [currentDialogue, setCurrentDialogue] = useState('')
  const [turnCount, setTurnCount] = useState(0)
  const [chatHistory, setChatHistory] = useState<{ role: string, content: string }[]>([])
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [meetingContext, setMeetingContext] = useState(gameData?.context || '')

  // ── Concern-driven orchestration state ────────────────────────────────────
  const [personaConcerns, setPersonaConcerns] = useState<Concern[][]>(() =>
    [0, 1, 2].map(i =>
      (gameData?.personas[i]?.concerns || []).map((c: any) => ({
        ...c,
        covered: false,
        resolved: false,
      }))
    )
  )
  const [questionsPerPersona, setQuestionsPerPersona] = useState([0, 0, 0])

  // ── Per-turn log for PDF report ────────────────────────────────────────────
  const [turnLog, setTurnLog] = useState<{
    judgeName: string
    question: string
    response: string
    scoreDelta: number
    feedback: string
  }[]>([])

  // ── Typewriter + TTS state ─────────────────────────────────────────────────
  const [displayedText, setDisplayedText] = useState('')
  const [isDialogueComplete, setIsDialogueComplete] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasInitializedRef = useRef(false)

  // ── Mount: generate first question via concern-driven selection ────────────
  useEffect(() => {
    if (!gameData || hasInitializedRef.current) return
    hasInitializedRef.current = true

    const initialConcerns: Concern[][] = [0, 1, 2].map(i =>
      (gameData.personas[i]?.concerns || []).map((c: any) => ({
        ...c,
        covered: false,
        resolved: false,
      }))
    )
    const initialConfs = [getInitialConfidence(0), getInitialConfidence(1), getInitialConfidence(2)]
    const firstIdx = selectNextPersona(initialConfs, [0, 0, 0], initialConcerns)
    const firstConcern = getActiveConcern(initialConcerns[firstIdx])

    if (!firstConcern) return

    setActiveJudge(firstIdx)
    setIsEvaluating(true)

    const firstJudge = judges[firstIdx]
    fetch('/api/question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: gameData.context || '',
        judgeName: firstJudge.name,
        judgeRole: firstJudge.role,
        personaPrompt: firstJudge.evaluationPrompt,
        chatHistory: [],
        activeConcern: { id: firstConcern.id, text: firstConcern.text },
        coveredConcernTexts: []
      })
    })
      .then(r => r.json())
      .then(result => {
        setCurrentDialogue(result?.data?.question || `Let's discuss: ${firstConcern.text}`)
        setIsEvaluating(false)
      })
      .catch(() => {
        setCurrentDialogue(`Let's begin. ${firstConcern.text}`)
        setIsEvaluating(false)
      })
  }, [gameData]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Response handler ───────────────────────────────────────────────────────
  const handleResponse = useCallback(async (response: string) => {
    if (isEvaluating) return
    setIsEvaluating(true)

    try {
      const currentJudge = judges[activeJudge]
      const activeConcern = getActiveConcern(personaConcerns[activeJudge])

      const newInteraction = [
        { role: `${currentJudge.name} (${currentJudge.role})`, content: currentDialogue },
        { role: 'Founder', content: response }
      ]
      const updatedHistory = [...chatHistory, ...newInteraction]
      setChatHistory(updatedHistory)

      // STEP 1: Evaluate answer
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
          chatHistory: updatedHistory,
          activeConcernId: activeConcern?.id ?? null,
          activePersonaIndex: activeJudge,
          allPersonaConcerns: personaConcerns,
          turnCount
        })
      })

      const evaluateResult = await evaluateRes.json()
      const scoreDelta = evaluateResult?.data?.scoreDelta || 0
      let emotion = evaluateResult?.data?.emotion || 'neutral'
      if (!['smile', 'neutral', 'worse'].includes(emotion)) emotion = 'neutral'
      const newContext = evaluateResult?.data?.updatedContext || meetingContext
      const resolvedConcernIds: string[] = evaluateResult?.data?.resolvedConcernIds || []
      const crossResolvedConcerns: { personaIndex: number; concernId: string }[] =
        evaluateResult?.data?.crossResolvedConcerns || []
      const newConcernText: string | null = evaluateResult?.data?.newConcern ?? null
      setMeetingContext(newContext)

      // Log this turn for the PDF report
      setTurnLog(prev => [...prev, {
        judgeName: `${currentJudge.name} (${currentJudge.role})`,
        question: currentDialogue,
        response,
        scoreDelta,
        feedback: evaluateResult?.data?.reasoning || ''
      }])

      // STEP 2: Update confidences
      setPreviousConfidences([...confidences])
      const newConfidences = [...confidences]
      newConfidences[activeJudge] = Math.max(0, Math.min(100, newConfidences[activeJudge] + scoreDelta))
      setConfidences(newConfidences)

      const avgConfidence = Math.round(newConfidences.reduce((a, b) => a + b, 0) / 3)
      onConfidenceChange(avgConfidence)

      // STEP 3: Update emotions
      const newEmotions: [JudgeEmotion, JudgeEmotion, JudgeEmotion] = [...emotions]
      newEmotions[activeJudge] = emotion as JudgeEmotion
      setEmotions(newEmotions)

      // STEP 4: Update concerns
      const nextTurn = turnCount + 1
      const newPersonaConcerns = personaConcerns.map((concerns, pIdx) =>
        concerns.map(c => {
          // Mark active concern as covered (question was asked about it)
          if (pIdx === activeJudge && c.id === activeConcern?.id) {
            return { ...c, covered: true }
          }
          // Mark as resolved if LLM says so (current persona)
          if (resolvedConcernIds.includes(c.id)) {
            return { ...c, resolved: true }
          }
          // Cross-persona resolutions
          const crossMatch = crossResolvedConcerns.find(
            cr => cr.personaIndex === pIdx && cr.concernId === c.id
          )
          if (crossMatch) {
            return { ...c, resolved: true }
          }
          return c
        })
      )

      // STEP 5: Optionally add new concern (gated)
      const activePersonaConcerns = newPersonaConcerns[activeJudge]
      const canAddConcern =
        newConcernText !== null &&
        activePersonaConcerns.length < MAX_TOTAL_CONCERNS_PER_PERSONA &&
        nextTurn < MAX_TURNS - 2

      if (canAddConcern && newConcernText) {
        const newConcernId = `p${activeJudge}_c${activePersonaConcerns.length}`
        newPersonaConcerns[activeJudge] = [
          ...activePersonaConcerns,
          { id: newConcernId, text: newConcernText, covered: false, resolved: false }
        ]
      }

      setPersonaConcerns(newPersonaConcerns)

      // STEP 6: Update per-persona question counter
      const newQPP = [...questionsPerPersona]
      newQPP[activeJudge] = newQPP[activeJudge] + 1
      setQuestionsPerPersona(newQPP)
      setTurnCount(nextTurn)

      // STEP 7: Check for game end
      if (checkGameEnd(nextTurn, avgConfidence, newPersonaConcerns, newQPP)) {
        setTimeout(() => onGameEnd(avgConfidence, {
          chatHistory: updatedHistory,
          meetingContext: newContext,
          judges,
          confidences: newConfidences,
          personaConcerns: newPersonaConcerns,
          turnLog: [...turnLog, {
            judgeName: `${currentJudge.name} (${currentJudge.role})`,
            question: currentDialogue,
            response,
            scoreDelta,
            feedback: evaluateResult?.data?.reasoning || ''
          }]
        }), 1500)
        return
      }

      // STEP 8: Select next persona + concern
      const nextPersonaIndex = selectNextPersona(newConfidences, newQPP, newPersonaConcerns, activeJudge)
      const nextJudge = judges[nextPersonaIndex]
      const nextActiveConcern = getActiveConcern(newPersonaConcerns[nextPersonaIndex])

      if (!nextActiveConcern) {
        // Defensive: shouldn't happen if checkGameEnd passed, but end gracefully
        setTimeout(() => onGameEnd(avgConfidence, {
          chatHistory: updatedHistory,
          meetingContext: newContext,
          judges,
          confidences: newConfidences,
          personaConcerns: newPersonaConcerns,
          turnLog: [...turnLog, {
            judgeName: `${currentJudge.name} (${currentJudge.role})`,
            question: currentDialogue,
            response,
            scoreDelta,
            feedback: evaluateResult?.data?.reasoning || ''
          }]
        }), 1500)
        return
      }

      const coveredConcernTexts = buildCoveredConcernTexts(newPersonaConcerns)

      // STEP 9: Generate next question
      const questionRes = await fetch('/api/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: newContext,
          judgeName: nextJudge.name,
          judgeRole: nextJudge.role,
          personaPrompt: nextJudge.evaluationPrompt,
          chatHistory: updatedHistory,
          activeConcern: { id: nextActiveConcern.id, text: nextActiveConcern.text },
          coveredConcernTexts
        })
      })

      const questionResult = await questionRes.json()
      const nextQuestion = questionResult?.data?.question || `Could you elaborate on: ${nextActiveConcern.text}`

      setTimeout(() => {
        setActiveJudge(nextPersonaIndex)
        setCurrentDialogue(nextQuestion)
        setEmotions(['neutral', 'neutral', 'neutral'])
        setIsEvaluating(false)
      }, 3000)

    } catch (e) {
      console.error(e)
      setIsEvaluating(false)
    }
  }, [
    confidences, emotions, activeJudge, turnCount, onConfidenceChange, onGameEnd,
    currentDialogue, isEvaluating, chatHistory, judges, meetingContext,
    personaConcerns, questionsPerPersona, turnLog
  ])

  // ── TTS ────────────────────────────────────────────────────────────────────
  const speakDialogue = useCallback(async (text: string, judgeIndex: number) => {
    const voiceIds = [
      'EXAVITQu4vr4xnSDxMaL',
      'JBFqnCBsd6RMkjVDRZzb',
      'TX3LPaxmHKxFdv7VOQHJ',
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
      console.error('ElevenLabs TTS Streaming Error:', err)
    }
  }, [])

  // ── Typewriter effect + TTS trigger ───────────────────────────────────────
  useEffect(() => {
    setDisplayedText('')
    setIsDialogueComplete(false)

    if (!currentDialogue) return

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

  // ── Concerns tooltip ──────────────────────────────────────────────────────
  const [showConcernsTooltip, setShowConcernsTooltip] = useState(false)

  // ── Derived display values ─────────────────────────────────────────────────
  const doneConcerns = personaConcerns.flat().filter(c => c.covered || c.resolved).length
  const totalConcerns = personaConcerns.flat().length

  // ── Layout ─────────────────────────────────────────────────────────────────
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
        style={{ backgroundImage: `url('/room.png')` }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#001E44]/20 via-transparent to-black/80" />

      {/* Judges */}
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

      {/* Dialogue HUD */}
      <DialogueHUD
        onRespond={handleResponse}
        isEvaluating={isEvaluating}
        canRespond={isDialogueComplete}
      />

      {/* Turn + concern progress indicator */}
      <div className="absolute top-4 right-4 z-30">
        <div className="glass rounded-lg px-4 py-2 border border-[#FFC627]/20 flex items-center gap-3">
          <span className="font-mono text-xs text-[#E2E8F0]">
            Q {turnCount + 1}/{MAX_TURNS}
          </span>
          <span className="text-[#FFC627]/30 font-mono">|</span>
          {/* Concerns badge with tooltip */}
          <div
            className="relative"
            onMouseEnter={() => setShowConcernsTooltip(true)}
            onMouseLeave={() => setShowConcernsTooltip(false)}
          >
            <span className="font-mono text-xs text-[#E2E8F0] cursor-help border-b border-dashed border-[#E2E8F0]/40 pb-px">
              {doneConcerns}/{totalConcerns} CONCERNS
            </span>
            {showConcernsTooltip && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-[#0a1628]/97 backdrop-blur-xl rounded-xl border border-[#FFC627]/30 shadow-2xl shadow-black/60 z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-[#FFC627]/20 bg-linear-to-r from-[#FFC627]/10 to-transparent">
                  <span className="font-mono text-[10px] text-[#FFC627] uppercase tracking-wider">Board Concerns</span>
                </div>
                <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
                  {personaConcerns.map((concerns, pIdx) =>
                    concerns.length > 0 ? (
                      <div key={pIdx}>
                        <p className="font-mono text-[10px] text-[#FFC627]/80 uppercase tracking-wider mb-1.5">
                          {judges[pIdx]?.name || `Judge ${pIdx + 1}`}
                        </p>
                        <ul className="space-y-1.5">
                          {concerns.map((c, cIdx) => (
                            <li key={cIdx} className="flex items-start gap-2">
                              <span className={`text-[11px] mt-px shrink-0 font-bold ${c.resolved ? 'text-emerald-400' : c.covered ? 'text-amber-400' : 'text-[#718096]'}`}>
                                {c.resolved ? '✓' : c.covered ? '◑' : '○'}
                              </span>
                              <span className={`font-mono text-[11px] leading-relaxed ${c.resolved ? 'text-emerald-400/70 line-through' : c.covered ? 'text-amber-400/80' : 'text-[#CBD5E0]'}`}>
                                {c.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* End Discussion button */}
      <div className="absolute top-4 left-4 z-30">
        <button
          onClick={() => {
            const avg = Math.round(confidences.reduce((a, b) => a + b, 0) / 3)
            onGameEnd(avg, {
              chatHistory,
              meetingContext,
              judges,
              confidences,
              personaConcerns,
              turnLog
            })
          }}
          disabled={isEvaluating}
          className="glass rounded-lg px-4 py-2 border border-[#FFC627]/20 font-mono text-xs text-[#A0AEC0] hover:border-red-500/50 hover:text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          END DISCUSSION
        </button>
      </div>
    </motion.div>
  )
}
