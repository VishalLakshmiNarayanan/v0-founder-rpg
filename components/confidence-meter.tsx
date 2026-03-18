"use client"

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ConfidenceMeterProps {
  score: number
  previousScore?: number
  compact?: boolean
}

export function ConfidenceMeter({ score, previousScore = 50, compact = false }: ConfidenceMeterProps) {
  const trend = score > previousScore ? 'up' : score < previousScore ? 'down' : 'stable'
  
  const getStatusColor = () => {
    if (score >= 70) return 'text-green-400'
    if (score >= 40) return 'text-[#FFC627]'
    return 'text-red-400'
  }

  const getStatusText = () => {
    if (score >= 80) return 'STRONG CONVICTION'
    if (score >= 60) return 'CAUTIOUS OPTIMISM'
    if (score >= 40) return 'NEUTRAL STANCE'
    if (score >= 20) return 'GROWING DOUBT'
    return 'CRITICAL CONCERN'
  }

  return (
    <div className={`w-full ${compact ? 'max-w-[150px]' : 'max-w-2xl'} mx-auto`}>
      <div className={`flex ${compact ? 'flex-col items-center gap-1' : 'items-center justify-between'} mb-2`}>
        {!compact && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#A0AEC0] uppercase tracking-wider">
              Shadow Confidence
            </span>
            {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
            {trend === 'stable' && <Minus className="w-4 h-4 text-[#4A5568]" />}
          </div>
        )}
        <div className="flex items-center gap-2">
          {!compact && (
            <span className={`font-mono text-xs uppercase tracking-wider ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          )}
          <span className={`font-mono ${compact ? 'text-sm' : 'text-lg'} font-bold ${getStatusColor()}`}>
            {score}%
          </span>
          {compact && (
            <>
              {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-400" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
              {trend === 'stable' && <Minus className="w-3 h-3 text-[#4A5568]" />}
            </>
          )}
        </div>
      </div>

      {/* Progress bar container */}
      <div className="relative h-3 bg-[#1A1A1A] rounded-full overflow-hidden border border-[#4A5568]/30">
        {/* Background gradient */}
        <div className="absolute inset-0 confidence-gradient opacity-20" />
        
        {/* Actual progress */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          initial={{ width: `${previousScore}%` }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            background: `linear-gradient(90deg, 
              ${score < 30 ? '#E53E3E' : score < 60 ? '#FFC627' : '#48BB78'} 0%,
              ${score < 50 ? '#FFC627' : '#48BB78'} 100%
            )`,
            boxShadow: `0 0 15px ${score < 30 ? 'rgba(229,62,62,0.5)' : score < 60 ? 'rgba(255,198,39,0.5)' : 'rgba(72,187,120,0.5)'}`,
          }}
        />

        {/* Marker lines */}
        <div className="absolute inset-0 flex justify-between px-[10%]">
          {[25, 50, 75].map((mark) => (
            <div
              key={mark}
              className="w-[1px] h-full bg-[#4A5568]/50"
              style={{ marginLeft: `${mark - 25}%` }}
            />
          ))}
        </div>
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-1 px-1">
        <span className="font-mono text-[10px] text-red-400/60">REJECT</span>
        <span className="font-mono text-[10px] text-[#FFC627]/60">NEUTRAL</span>
        <span className="font-mono text-[10px] text-green-400/60">APPROVE</span>
      </div>
    </div>
  )
}
