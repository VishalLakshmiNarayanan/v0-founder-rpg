"use client"

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, MessageSquare } from 'lucide-react'

interface DialogueHUDProps {
  dialogue: string
  speakerName: string
  onRespond: (response: string) => void
  isTyping?: boolean
  disabled?: boolean
}

export function DialogueHUD({ dialogue, speakerName, onRespond, isTyping = false, disabled = false }: DialogueHUDProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [userInput, setUserInput] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Typewriter effect
  useEffect(() => {
    setDisplayedText('')
    setIsComplete(false)
    
    if (!dialogue) return

    let index = 0
    const interval = setInterval(() => {
      if (index < dialogue.length) {
        setDisplayedText(dialogue.slice(0, index + 1))
        index++
      } else {
        setIsComplete(true)
        clearInterval(interval)
      }
    }, 30)

    return () => clearInterval(interval)
  }, [dialogue])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userInput.trim() && isComplete && !disabled) {
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
      <div className="bg-black/90 backdrop-blur-md border-t border-[#FFC627]/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Dialogue Box */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-[#FFC627]" />
              <span className="font-mono text-xs text-[#FFC627] uppercase tracking-wider">
                {speakerName}
              </span>
              {isTyping && (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="font-mono text-xs text-[#4A5568]"
                >
                  typing...
                </motion.span>
              )}
            </div>
            
            <div className="min-h-[60px] p-4 bg-[#001E44]/60 rounded-lg border border-[#4A5568]/30">
              <p className={`font-mono text-sm text-[#E2E8F0] leading-relaxed ${!isComplete ? 'typewriter-cursor' : ''}`}>
                {displayedText || '...'}
              </p>
            </div>
          </div>

          {/* Response Input */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#FFC627] animate-pulse" />
              <span className="font-mono text-xs text-[#4A5568] uppercase tracking-wider">
                Your Response
              </span>
            </div>
            
            <div className="relative flex items-center">
              <span className="absolute left-4 font-mono text-[#FFC627]">{'>'}</span>
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={isComplete && !disabled ? "Type your response..." : "Wait for the committee..."}
                disabled={!isComplete || disabled}
                className="w-full bg-[#0a0a0a] border border-[#FFC627]/30 rounded-lg pl-8 pr-14 py-3 font-mono text-sm text-[#E2E8F0] placeholder-[#4A5568] focus:outline-none focus:border-[#FFC627]/60 focus:ring-1 focus:ring-[#FFC627]/30 disabled:opacity-50 transition-all"
              />
              <motion.button
                type="submit"
                disabled={!isComplete || !userInput.trim() || disabled}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute right-2 p-2 rounded-md bg-[#FFC627]/20 text-[#FFC627] hover:bg-[#FFC627]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
