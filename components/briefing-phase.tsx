"use client"

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, Shield, Terminal } from 'lucide-react'

interface BriefingPhaseProps {
  onInitialize: (file: File | null, context: string) => void
}

export function BriefingPhase({ onInitialize }: BriefingPhaseProps) {
  const [file, setFile] = useState<File | null>(null)
  const [context, setContext] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile)
    }
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-10"
    >
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/preboardroom-YPDRSTaMVbQCyKnKg3FB0qGu7zLtUE.png')`,
        }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#001E44]/60" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="w-full max-w-xl"
        >
          {/* Glass Card */}
          <div className="glass gold-glow rounded-2xl border border-[#FFC627]/30 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFC627]/10 border border-[#FFC627]/30 mb-4"
              >
                <Shield className="w-8 h-8 text-[#FFC627]" />
              </motion.div>
              <h1 className="font-serif text-3xl font-bold text-[#E2E8F0] mb-2">
                The Shadow Committee
              </h1>
              <p className="font-mono text-sm text-[#A0AEC0]">
                Secure Executive Briefing Portal
              </p>
            </div>

            {/* Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-xl p-8 mb-6 transition-all duration-300 cursor-pointer
                ${isDragging 
                  ? 'border-[#FFC627] bg-[#FFC627]/10' 
                  : file 
                    ? 'border-green-500/50 bg-green-500/10' 
                    : 'border-[#FFC627]/30 hover:border-[#FFC627]/60 hover:bg-[#FFC627]/5'
                }
              `}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-center">
                <Upload className={`w-10 h-10 mx-auto mb-3 ${file ? 'text-green-500' : 'text-[#FFC627]/70'}`} />
                {file ? (
                  <>
                    <p className="font-mono text-green-400 text-sm mb-1">FILE SECURED</p>
                    <p className="font-mono text-xs text-[#A0AEC0] truncate max-w-[200px] mx-auto">
                      {file.name}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-mono text-[#FFC627] text-sm mb-1">SECURE INGESTION</p>
                    <p className="font-mono text-xs text-[#A0AEC0]">
                      Drop PDF or click to upload
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Context Input */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-4 h-4 text-[#FFC627]" />
                <span className="font-mono text-xs text-[#A0AEC0] uppercase tracking-wider">
                  Meeting Context
                </span>
              </div>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Enter Meeting Context (e.g., Series A Pitch)..."
                className="w-full bg-[#001E44]/80 border border-[#FFC627]/20 rounded-lg px-4 py-3 font-mono text-sm text-[#E2E8F0] placeholder-[#4A5568] focus:outline-none focus:border-[#FFC627]/50 focus:ring-1 focus:ring-[#FFC627]/30 transition-all"
              />
            </div>

            {/* Initialize Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onInitialize(file, context)}
              className="w-full relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#FFC627] to-[#B8941E] opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]" />
              <div className="relative px-6 py-4 font-mono text-sm font-bold text-[#001E44] uppercase tracking-wider">
                Initialize Committee
              </div>
            </motion.button>

            {/* Footer */}
            <p className="text-center font-mono text-xs text-[#718096] mt-6">
              Encrypted connection established
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
