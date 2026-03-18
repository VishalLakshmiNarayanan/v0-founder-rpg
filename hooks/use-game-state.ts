"use client"

import { useState, useCallback } from 'react'

export type GamePhase = 'briefing' | 'transition' | 'boardroom' | 'results'

export type JudgeEmotion = 'neutral' | 'smile' | 'worse'

export interface Persona {
  name: string
  role: string
  personality: string
  focusAreas: string[]
  toughQuestionStyle: string
}

export interface DocumentAnalysis {
  personas: Persona[]
  documentSummary: string
  documentType: string
  keyTopics: string[]
  potentialWeaknesses: string[]
}

export interface GameState {
  phase: GamePhase
  confidenceScore: number
  activeJudgeIndex: number
  judgeEmotions: [JudgeEmotion, JudgeEmotion, JudgeEmotion]
  currentDialogue: string
  uploadedFile: File | null
  meetingContext: string
  // AI-generated data
  analysis: DocumentAnalysis | null
  previousQuestions: string[]
  previousAnswers: string[]
  currentQuestion: {
    question: string
    judgeIndex: number
    expectedTopics: string[]
    followUpHint: string | null
  } | null
  questionNumber: number
  totalQuestions: number
  isProcessing: boolean
}

const initialState: GameState = {
  phase: 'briefing',
  confidenceScore: 50,
  activeJudgeIndex: 1,
  judgeEmotions: ['neutral', 'neutral', 'neutral'],
  currentDialogue: '',
  uploadedFile: null,
  meetingContext: '',
  analysis: null,
  previousQuestions: [],
  previousAnswers: [],
  currentQuestion: null,
  questionNumber: 0,
  totalQuestions: 5,
  isProcessing: false,
}

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState)

  const setPhase = useCallback((phase: GamePhase) => {
    setState(prev => ({ ...prev, phase }))
  }, [])

  const setConfidenceScore = useCallback((score: number) => {
    setState(prev => ({ 
      ...prev, 
      confidenceScore: Math.max(0, Math.min(100, score)) 
    }))
  }, [])

  const adjustConfidence = useCallback((delta: number) => {
    setState(prev => ({ 
      ...prev, 
      confidenceScore: Math.max(0, Math.min(100, prev.confidenceScore + delta)) 
    }))
  }, [])

  const setActiveJudge = useCallback((index: number) => {
    setState(prev => ({ ...prev, activeJudgeIndex: index }))
  }, [])

  const setJudgeEmotion = useCallback((judgeIndex: number, emotion: JudgeEmotion) => {
    setState(prev => {
      const newEmotions = [...prev.judgeEmotions] as [JudgeEmotion, JudgeEmotion, JudgeEmotion]
      newEmotions[judgeIndex] = emotion
      return { ...prev, judgeEmotions: newEmotions }
    })
  }, [])

  const setCurrentDialogue = useCallback((dialogue: string) => {
    setState(prev => ({ ...prev, currentDialogue: dialogue }))
  }, [])

  const setUploadedFile = useCallback((file: File | null) => {
    setState(prev => ({ ...prev, uploadedFile: file }))
  }, [])

  const setMeetingContext = useCallback((context: string) => {
    setState(prev => ({ ...prev, meetingContext: context }))
  }, [])

  const setAnalysis = useCallback((analysis: DocumentAnalysis | null) => {
    setState(prev => ({ ...prev, analysis }))
  }, [])

  const setCurrentQuestion = useCallback((question: GameState['currentQuestion']) => {
    setState(prev => ({ 
      ...prev, 
      currentQuestion: question,
      activeJudgeIndex: question?.judgeIndex ?? prev.activeJudgeIndex,
      currentDialogue: question?.question ?? ''
    }))
  }, [])

  const addQuestionAnswer = useCallback((question: string, answer: string) => {
    setState(prev => ({
      ...prev,
      previousQuestions: [...prev.previousQuestions, question],
      previousAnswers: [...prev.previousAnswers, answer],
      questionNumber: prev.questionNumber + 1,
    }))
  }, [])

  const setIsProcessing = useCallback((isProcessing: boolean) => {
    setState(prev => ({ ...prev, isProcessing }))
  }, [])

  const resetEmotions = useCallback(() => {
    setState(prev => ({ ...prev, judgeEmotions: ['neutral', 'neutral', 'neutral'] }))
  }, [])

  const resetGame = useCallback(() => {
    setState(initialState)
  }, [])

  return {
    state,
    setPhase,
    setConfidenceScore,
    adjustConfidence,
    setActiveJudge,
    setJudgeEmotion,
    setCurrentDialogue,
    setUploadedFile,
    setMeetingContext,
    setAnalysis,
    setCurrentQuestion,
    addQuestionAnswer,
    setIsProcessing,
    resetEmotions,
    resetGame,
  }
}
