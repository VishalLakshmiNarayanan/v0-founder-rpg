"use client"

import { useState, useCallback } from 'react'

export type GamePhase = 'briefing' | 'transition' | 'boardroom' | 'results'

export type JudgeEmotion = 'neutral' | 'smile' | 'worse'

export interface GameState {
  phase: GamePhase
  confidenceScore: number
  activeJudgeIndex: number
  judgeEmotions: [JudgeEmotion, JudgeEmotion, JudgeEmotion]
  currentDialogue: string
  uploadedFile: File | null
  meetingContext: string
}

const initialState: GameState = {
  phase: 'briefing',
  confidenceScore: 50,
  activeJudgeIndex: 1,
  judgeEmotions: ['neutral', 'neutral', 'neutral'],
  currentDialogue: '',
  uploadedFile: null,
  meetingContext: '',
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
    resetGame,
  }
}
