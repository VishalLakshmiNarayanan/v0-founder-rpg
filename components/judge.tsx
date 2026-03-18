"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { JudgeEmotion } from '@/hooks/use-game-state'

import { ConfidenceMeter } from './confidence-meter'

interface JudgeProps {
  index: number
  emotion: JudgeEmotion
  isActive: boolean
  name: string
  role: string
  confidence: number
  previousConfidence: number
  dialogue?: string | null
  personaPrompt?: string
}

const judgeImages = {
  0: {
    neutral: '/person1_neutral.png',
    smile: '/person1_smile.png',
    worse: '/person1_worse.png',
  },
  1: {
    neutral: '/person2_neutral.png',
    smile: '/person2_neutral.png',
    worse: '/person2_worse.png',
  },
  2: {
    neutral: '/person3_neutral.png',
    smile: '/person3_smile.png',
    worse: '/person3_worse.png',
  },
} as const

export function Judge({ index, emotion, isActive, name, role, confidence, previousConfidence, dialogue, personaPrompt }: JudgeProps) {
  const images = judgeImages[index as keyof typeof judgeImages]
  const currentImage = images[emotion]
  const [isHovered, setIsHovered] = useState(false)

  // Dynamic positioning for Speech Bubbles so they grow inward towards the screen center
  const getBubblePositionClasses = () => {
    if (index === 0) return "left-1/2 transform -translate-x-[20%]" // Left judge: bubble shifts right
    if (index === 2) return "left-1/2 transform -translate-x-[80%]" // Right judge: bubble shifts left
    return "left-1/2 transform -translate-x-1/2" // Center judge: bubble stays centered
  }

  const getBubbleArrowClasses = () => {
    if (index === 0) return "before:left-[20%] before:-translate-x-1/2"
    if (index === 2) return "before:left-[80%] before:-translate-x-1/2"
    return "before:left-1/2 before:-translate-x-1/2"
  }

  // Tooltip positioning — centered directly over the persona image
  const getTooltipPositionClasses = () => {
    return "left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"
  }

  const getConfidenceLabel = () => {
    if (confidence >= 75) return { text: 'Confident', color: 'text-emerald-400' }
    if (confidence >= 50) return { text: 'Neutral', color: 'text-amber-400' }
    if (confidence >= 30) return { text: 'Skeptical', color: 'text-orange-400' }
    return { text: 'Unconvinced', color: 'text-red-400' }
  }

  const confidenceLabel = getConfidenceLabel()

  return (
    <motion.div
      className="relative flex flex-col items-center pointer-events-auto"
      animate={{
        zIndex: isActive ? 50 : 10,
      }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Speech Bubble */}
      {isActive && dialogue && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`absolute bottom-[105%] ${getBubblePositionClasses()} w-[20rem] md:w-[36rem] lg:w-[48rem] bg-white/95 backdrop-blur-sm rounded-3xl p-2 shadow-2xl border border-gray-200 z-50 text-left before:content-[''] before:absolute before:-bottom-3 ${getBubbleArrowClasses()} before:w-0 before:h-0 before:border-l-[12px] before:border-l-transparent before:border-r-[12px] before:border-r-transparent before:border-t-[12px] before:border-t-white/95`}
        >
          <p className="font-mono text-[13px] text-gray-800 leading-relaxed font-semibold">
            {dialogue}
          </p>
        </motion.div>
      )}

      {/* Hover Tooltip Card */}
      <AnimatePresence>
        {isHovered && name !== 'Loading...' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`absolute ${getTooltipPositionClasses()} z-[60] w-[20rem] pointer-events-none`}
          >
            <div className="bg-[#0a1628]/95 backdrop-blur-xl rounded-xl border border-[#FFC627]/30 shadow-2xl shadow-black/50 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#FFC627]/20 to-[#001E44] px-4 py-3 border-b border-[#FFC627]/20">
                <p className="font-serif text-[14px] font-bold text-[#FFC627]">{name}</p>
                <p className="font-mono text-[10px] text-[#A0AEC0] uppercase tracking-widest">{role}</p>
              </div>

              {/* Stats */}
              <div className="px-4 py-3 space-y-3">
                {/* Confidence */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-[#718096] uppercase tracking-wider">Confidence Level</span>
                    <span className={`font-mono text-[11px] font-bold ${confidenceLabel.color}`}>{confidence}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1a2744] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${confidence}%` }}
                      transition={{ duration: 0.5 }}
                      style={{
                        background: confidence >= 60 
                          ? 'linear-gradient(90deg, #10B981, #34D399)' 
                          : confidence >= 40 
                            ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                            : 'linear-gradient(90deg, #EF4444, #F87171)'
                      }}
                    />
                  </div>
                  <p className={`font-mono text-[10px] mt-1 ${confidenceLabel.color}`}>
                    Mood: {confidenceLabel.text}
                  </p>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-[#4A5568]/50 to-transparent" />

                {/* Thinking / Guardrails as bullet points */}
                {personaPrompt && (
                  <div>
                    <span className="font-mono text-[10px] text-[#718096] uppercase tracking-wider flex items-center gap-1">
                      🧠 Thinking & Guardrails
                    </span>
                    <ul className="mt-2 space-y-1.5 max-h-[12rem] overflow-y-auto pr-1 scrollbar-thin">
                      {personaPrompt
                        .split(/(?<=[.!?])\s+/)
                        .filter(s => s.trim().length > 5)
                        .map((sentence, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-[#FFC627] text-[8px] mt-[5px] flex-shrink-0">●</span>
                            <span className="font-mono text-[11px] text-[#CBD5E0] leading-relaxed">
                              {sentence.trim()}
                            </span>
                          </li>
                        ))
                      }
                    </ul>
                  </div>
                )}

                {/* Status Indicator */}
                <div className="flex items-center gap-2 pt-1">
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#FFC627] animate-pulse' : 'bg-[#4A5568]'}`} />
                  <span className="font-mono text-[10px] text-[#718096]">
                    {isActive ? 'Currently Speaking' : 'Observing'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Judge Image Container */}
      <motion.div
        className="relative cursor-pointer"
        animate={{
          filter: isActive && name !== 'Loading...' ? 'drop-shadow(0 0 30px rgba(255,198,39,0.5))' : 'drop-shadow(0 0 10px rgba(0,0,0,0.5))',
        }}
        transition={{ duration: 0.3 }}
      >
        <motion.img
          key={`${index}-${emotion}`}
          src={currentImage}
          alt={name}
          className="w-56 h-auto md:w-64 lg:w-[22rem] object-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Active indicator ring */}
        {isActive && name !== 'Loading...' && (
          <motion.div
            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-[#FFC627]"
            animate={{
              boxShadow: [
                '0 0 10px rgba(255,198,39,0.5)',
                '0 0 20px rgba(255,198,39,0.8)',
                '0 0 10px rgba(255,198,39,0.5)',
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Name plate */}
      <motion.div
        className={`
          relative -mt-14 px-3 py-2 rounded-lg text-center transition-all duration-300 z-30 w-[95%] md:w-[100%]
          ${isActive ? 'bg-[#1a365d]/90 border border-[#4A5568]' : 'bg-[#001E44]/90 border border-[#4A5568]/50'}
        `}
      >
        <p className={`font-serif text-[13px] font-semibold ${isActive ? 'text-[#FFC627]' : 'text-[#E2E8F0]'}`}>
          {name}
        </p>
        <p className="font-mono text-[10px] text-[#A0AEC0] uppercase tracking-wider mb-2">
          {role}
        </p>
        <div className="w-full mt-2 transform scale-[0.80] origin-top">
          <ConfidenceMeter score={confidence} previousScore={previousConfidence} compact={true} />
        </div>
      </motion.div>
    </motion.div>
  )
}

