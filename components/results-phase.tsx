"use client"

import { motion } from 'framer-motion'
import { Trophy, XCircle, AlertCircle, RotateCcw, Sparkles } from 'lucide-react'

interface ResultsPhaseProps {
  finalScore: number
  onRestart: () => void
}

export function ResultsPhase({ finalScore, onRestart }: ResultsPhaseProps) {
  const getVerdict = () => {
    if (finalScore >= 70) {
      return {
        title: 'INVESTMENT APPROVED',
        subtitle: 'The Shadow Committee has reached a favorable verdict.',
        icon: Trophy,
        color: 'text-green-400',
        bgColor: 'bg-green-400/10',
        borderColor: 'border-green-400/30',
        message: 'Your pitch demonstrated strong fundamentals, clear vision, and compelling market opportunity. The Committee recommends proceeding to term sheet negotiations.',
      }
    } else if (finalScore >= 40) {
      return {
        title: 'CONDITIONAL INTEREST',
        subtitle: 'The Shadow Committee requires further due diligence.',
        icon: AlertCircle,
        color: 'text-[#FFC627]',
        bgColor: 'bg-[#FFC627]/10',
        borderColor: 'border-[#FFC627]/30',
        message: 'Your pitch showed promise but raised concerns that need addressing. The Committee suggests a follow-up session after you\'ve refined your market positioning and financial projections.',
      }
    } else {
      return {
        title: 'INVESTMENT DECLINED',
        subtitle: 'The Shadow Committee has reached an unfavorable verdict.',
        icon: XCircle,
        color: 'text-red-400',
        bgColor: 'bg-red-400/10',
        borderColor: 'border-red-400/30',
        message: 'Your pitch failed to address critical concerns regarding market viability, competitive positioning, or team readiness. The Committee recommends significant pivots before seeking further funding.',
      }
    }
  }

  const verdict = getVerdict()
  const Icon = verdict.icon

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#001E44] flex items-center justify-center p-4"
    >
      {/* Background pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, #FFC627 1px, transparent 1px),
            radial-gradient(circle at 75% 75%, #FFC627 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative max-w-xl w-full"
      >
        {/* Main Card */}
        <div className={`glass rounded-2xl border ${verdict.borderColor} p-8 text-center`}>
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${verdict.bgColor} border ${verdict.borderColor} mb-6`}
          >
            <Icon className={`w-10 h-10 ${verdict.color}`} />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`font-serif text-3xl font-bold ${verdict.color} mb-2`}
          >
            {verdict.title}
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="font-mono text-sm text-[#A0AEC0] mb-8"
          >
            {verdict.subtitle}
          </motion.p>

          {/* Score */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-4 bg-[#001E44] rounded-xl px-8 py-4 border border-[#4A5568]/30">
              <Sparkles className="w-5 h-5 text-[#FFC627]" />
              <div className="text-center">
                <p className="font-mono text-xs text-[#4A5568] uppercase tracking-wider mb-1">
                  Final Confidence
                </p>
                <p className={`font-serif text-4xl font-bold ${verdict.color}`}>
                  {finalScore}%
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-[#FFC627]" />
            </div>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mb-8"
          >
            <p className="font-mono text-sm text-[#E2E8F0] leading-relaxed">
              {verdict.message}
            </p>
          </motion.div>

          {/* Restart Button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRestart}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-lg bg-[#FFC627]/10 border border-[#FFC627]/30 text-[#FFC627] hover:bg-[#FFC627]/20 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="font-mono text-sm uppercase tracking-wider">
              Retry Simulation
            </span>
          </motion.button>
        </div>

        {/* Shadow Committee branding */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-center font-mono text-xs text-[#4A5568] mt-6 uppercase tracking-[0.3em]"
        >
          The Shadow Committee Has Adjourned
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
