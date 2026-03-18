"use client"

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const defaultMessages = [
  'Analyzing document structure...',
  'Identifying key arguments...',
  'Evaluating supporting evidence...',
  'Scanning for weaknesses...',
  'Preparing committee questions...',
  'The Shadow Committee is presiding.',
]

const pitchDeckMessages = [
  'Analyzing market moats...',
  'Identifying cognitive biases...',
  'Evaluating competitive positioning...',
  'Scanning financial assumptions...',
  'Assessing founder-market fit...',
  'The Shadow Committee is presiding.',
]

const researchMessages = [
  'Analyzing methodology...',
  'Evaluating statistical rigor...',
  'Checking citation integrity...',
  'Identifying logical gaps...',
  'Assessing reproducibility...',
  'The Shadow Committee is presiding.',
]

const proposalMessages = [
  'Analyzing feasibility...',
  'Evaluating budget allocation...',
  'Identifying implementation risks...',
  'Scanning stakeholder impact...',
  'Assessing timeline realism...',
  'The Shadow Committee is presiding.',
]

interface TransitionPhaseProps {
  onComplete: () => void
  documentType?: string
}

export function TransitionPhase({ onComplete, documentType }: TransitionPhaseProps) {
  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)

  const messages = useMemo(() => {
    switch (documentType) {
      case 'pitch_deck':
      case 'business_plan':
        return pitchDeckMessages
      case 'research':
        return researchMessages
      case 'proposal':
        return proposalMessages
      default:
        return defaultMessages
    }
  }, [documentType])

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setTimeout(onComplete, 500)
          return 100
        }
        return prev + 2
      })
    }, 60)

    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length)
    }, 500)

    return () => {
      clearInterval(progressInterval)
      clearInterval(messageInterval)
    }
  }, [onComplete, messages.length])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
    >
      {/* Scan line effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="scan-line absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FFC627]/50 to-transparent" />
      </div>

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,198,39,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,198,39,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-8">
        {/* Logo/Title */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-2xl text-[#FFC627] mb-2">SHADOW COMMITTEE</h2>
          <p className="font-mono text-xs text-[#4A5568] uppercase tracking-[0.3em]">
            Initializing Session
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#B8941E] via-[#FFC627] to-[#B8941E]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
              style={{
                boxShadow: '0 0 20px rgba(255,198,39,0.5)',
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="font-mono text-xs text-[#4A5568]">SCANNING</span>
            <span className="font-mono text-xs text-[#FFC627]">{progress}%</span>
          </div>
        </div>

        {/* Dynamic Message */}
        <div className="h-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="font-mono text-sm text-[#A0AEC0] text-center"
            >
              {messages[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Document type indicator */}
        {documentType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <span className="font-mono text-xs text-[#FFC627]/50 uppercase tracking-wider">
              {documentType.replace('_', ' ')} detected
            </span>
          </motion.div>
        )}

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-0 w-8 h-[1px] bg-gradient-to-r from-transparent to-[#FFC627]/30" />
        <div className="absolute top-1/2 right-0 w-8 h-[1px] bg-gradient-to-l from-transparent to-[#FFC627]/30" />
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#FFC627]/20" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#FFC627]/20" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#FFC627]/20" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#FFC627]/20" />
    </motion.div>
  )
}
