"use client"

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Mic, MicOff } from 'lucide-react'

interface DialogueHUDProps {
  onRespond: (response: string) => void
  isEvaluating?: boolean
  canRespond?: boolean
}

export function DialogueHUD({ onRespond, isEvaluating = false, canRespond = true }: DialogueHUDProps) {
  const [userInput, setUserInput] = useState('')
  const [interimText, setInterimText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const wantToListen = useRef(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US' // Explicitly set to prevent 'network' errors on some Chromium builds
        
        recognition.onstart = () => setIsListening(true)
        
        recognition.onresult = (event: any) => {
          let currentFinal = ''
          let currentInterim = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              currentFinal += event.results[i][0].transcript
            } else {
              currentInterim += event.results[i][0].transcript
            }
          }
          if (currentFinal) {
            setUserInput((prev) => prev ? prev + ' ' + currentFinal.trim() : currentFinal.trim())
          }
          setInterimText(currentInterim)
        }

        recognition.onerror = (event: any) => {
          console.error("SpeechRecognition error:", event.error)
          if (event.error === 'network') {
            setUserInput("[System: Microphone blocked. Chrome requires secure HTTPS or localhost. Try using a standard Chrome window]")
          }
          if (event.error === 'not-allowed' || event.error === 'no-speech' || event.error === 'network') {
            wantToListen.current = false
            setIsListening(false)
          }
        }
        
        recognition.onend = () => {
          if (wantToListen.current) {
            try {
              recognition.start()
            } catch (e) {}
          } else {
            setIsListening(false)
          }
        }
        
        recognitionRef.current = recognition
      }
    }
    return () => {
      wantToListen.current = false
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      wantToListen.current = false
      recognitionRef.current.stop()

      // Automatically submit when turning the mic exactly off
      const finalVal = (userInput + (interimText ? ' ' + interimText : '')).trim()
      if (finalVal && canRespond && !isEvaluating) {
        onRespond(finalVal)
        setUserInput('')
        setInterimText('')
      }
    } else {
      wantToListen.current = true
      try {
        recognitionRef.current.start()
      } catch (e) {}
    }
  }

  const displayValue = userInput + (interimText ? ' ' + interimText : '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (displayValue.trim() && canRespond && !isEvaluating) {
      onRespond(displayValue.trim())
      setUserInput('')
      setInterimText('')
      if (isListening && recognitionRef.current) {
        wantToListen.current = false
        recognitionRef.current.stop()
      }
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
      <div className="h-8 bg-linear-to-t from-black/90 to-transparent" />
      
      {/* Main HUD */}
      <div className="bg-black/90 backdrop-blur-md border-t border-[#FFC627]/20 pb-4">
        <div className="max-w-4xl mx-auto px-4 py-4 pt-6">
          {/* Response Input */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#FFC627] animate-pulse" />
              <span className="font-mono text-xs text-[#A0AEC0] uppercase tracking-wider">
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
                value={displayValue}
                onChange={(e) => {
                  setUserInput(e.target.value)
                  setInterimText('') // Instantly clear interim if they manually type
                }}
                placeholder={isListening ? "Listening... (Speak clearly)" : (canRespond && !isEvaluating ? "Formulate your response..." : "Wait for the committee to finish...")}
                disabled={!canRespond || isEvaluating}
                className="w-full bg-[#0a0a0a] border border-[#FFC627]/30 rounded-lg pl-8 pr-24 py-4 font-mono text-sm text-[#E2E8F0] placeholder-[#4A5568] focus:outline-none focus:border-[#FFC627]/60 focus:ring-1 focus:ring-[#FFC627]/30 disabled:opacity-50 transition-all font-semibold"
              />
              <div className="absolute right-3 flex items-center gap-2">
                {recognitionRef.current && (
                  <motion.button
                    type="button"
                    onClick={toggleListening}
                    disabled={!canRespond || isEvaluating}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-2 rounded-md transition-all ${isListening ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse' : 'bg-[#4A5568]/20 text-[#A0AEC0] hover:bg-[#4A5568]/40 disabled:opacity-30'}`}
                  >
                    {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </motion.button>
                )}
                <motion.button
                  type="submit"
                  disabled={!canRespond || isEvaluating || !displayValue.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-md bg-[#FFC627]/20 text-[#FFC627] hover:bg-[#FFC627]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
