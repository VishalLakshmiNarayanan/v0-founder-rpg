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
}

const judgeImages = {
  0: {
    neutral: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/person1_neutral-demIzBgjpRSM5ZNoj7Wd1JrcBwGTHR.png',
    smile: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/person1_smile-hKJs8Q95w9fkaRmzvNqAwdNsMFU0UD.png',
    worse: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/person1_worse-IkM4eRoXGgnR417woMKFY15CIpua1p.png',
  },
  1: {
    neutral: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/person2_neutral-ou02Rn28km5RMjmS4kM9EmT4M8ZZc7.png',
    smile: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/person2_neutral-ou02Rn28km5RMjmS4kM9EmT4M8ZZc7.png',
    worse: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/person2_worse-irqGSdBVc8rYLIrDGoYK0YC9qLqJ20.png',
  },
  2: {
    neutral: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/person3_neutral-8j1NIKPn8PlohbmKgfsh0Ld8vdOBJk.png',
    smile: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/person3_smile-oRq1pkwEGbMDy77x413opst37lFwVJ.png',
    worse: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/person3_worse-h8jqAYc6KFI2jiKZcuYRTl5d46d466.png',
  },
} as const

export function Judge({ index, emotion, isActive, name, role, confidence, previousConfidence }: JudgeProps) {
  const images = judgeImages[index as keyof typeof judgeImages]
  const currentImage = images[emotion]

  return (
    <motion.div
      className="relative flex flex-col items-center"
      animate={{
        scale: isActive ? 1.1 : 0.95,
        opacity: isActive ? 1 : 0.4,
        filter: isActive ? 'blur(0px)' : 'blur(1px)',
      }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Judge Image Container */}
      <motion.div
        className="relative"
        animate={{
          filter: isActive ? 'drop-shadow(0 0 30px rgba(255,198,39,0.5))' : 'none',
        }}
        transition={{ duration: 0.3 }}
      >
        <motion.img
          key={`${index}-${emotion}`}
          src={currentImage}
          alt={name}
          className="w-48 h-auto md:w-56 lg:w-64 object-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Active indicator ring */}
        {isActive && (
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
          mt-4 px-4 py-2 rounded-lg text-center transition-all duration-300
          ${isActive ? 'bg-[#FFC627]/20 border border-[#FFC627]/40' : 'bg-[#001E44]/60 border border-[#4A5568]/30'}
        `}
      >
        <p className={`font-serif text-sm font-semibold ${isActive ? 'text-[#FFC627]' : 'text-[#A0AEC0]'}`}>
          {name}
        </p>
        <p className="font-mono text-xs text-[#4A5568] uppercase tracking-wider mb-3">
          {role}
        </p>
        <div className="w-full mt-2 transform scale-[0.85] origin-top">
          <ConfidenceMeter score={confidence} previousScore={previousConfidence} compact={true} />
        </div>
      </motion.div>
    </motion.div>
  )
}
