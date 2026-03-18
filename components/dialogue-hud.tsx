"use client"

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'

interface DialogueHUDProps {
  onRespond: (response: string) => void
  isEvaluating?: boolean
  canRespond?: boolean
}

export function DialogueHUD({ onRespond, isEvaluating = false, canRespond = true }: DialogueHUDProps) {
  const [userInput, setUserInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userInput.trim() && canRespond && !isEvaluating) {
      onRespond(userInput.trim())
      setUserInput('')
    }
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="fixed bottom-0 left-0 right-0 z-40"
    >
      {/* Gradient fade */}
      <div className="h-8 bg-gradient-to-t from-black/90 to-transparent" />
      
      {/* Main HUD */}
      <div className="bg-black/90 backdrop-blur-md border-t border-[#FFC627]/20 pb-4">
        <div className="max-w-4xl mx-auto px-4 py-4 pt-6">
          {/* Response Input */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#FFC627] animate-pulse" />
              <span className="font-mono text-xs text-[#4A5568] uppercase tracking-wider">
                User Terminal
              </span>
              {isEvaluating && (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="font-mono text-xs text-[#FFC627] ml-2"
                >
                  Analyzing response...
                </motion.span>
              )}
            </div>
            
            <div className="relative flex items-center">
              <span className="absolute left-4 font-mono text-[#FFC627]">{'>'}</span>
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={canRespond && !isEvaluating ? "Formulate your response..." : "Wait for the committee to finish..."}
                disabled={!canRespond || isEvaluating}
                className="w-full bg-[#0a0a0a] border border-[#FFC627]/30 rounded-lg pl-8 pr-14 py-4 font-mono text-sm text-[#E2E8F0] placeholder-[#4A5568] focus:outline-none focus:border-[#FFC627]/60 focus:ring-1 focus:ring-[#FFC627]/30 disabled:opacity-50 transition-all font-semibold"
              />
              <motion.button
                type="submit"
                disabled={!canRespond || isEvaluating || !userInput.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute right-3 p-2 rounded-md bg-[#FFC627]/20 text-[#FFC627] hover:bg-[#FFC627]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
