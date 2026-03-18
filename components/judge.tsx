"use client"

import { motion } from 'framer-motion'
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

export function Judge({ index, emotion, isActive, name, role, confidence, previousConfidence, dialogue }: JudgeProps) {
  const images = judgeImages[index as keyof typeof judgeImages]
  const currentImage = images[emotion]

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

  return (
    <motion.div
      className="relative flex flex-col items-center pointer-events-auto"
      animate={{
        zIndex: isActive ? 50 : 10,
      }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
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

      {/* Judge Image Container */}
      <motion.div
        className="relative"
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
