"use client"

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, Shield, Terminal, AlertCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

interface BriefingPhaseProps {
  onInitialize: (file: File | null, context: string) => void
  isLoading?: boolean
  error?: string | null
}

export function BriefingPhase({ onInitialize, isLoading, error }: BriefingPhaseProps) {
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

  const canInitialize = file && context.trim().length > 0

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
                AI-Powered Executive Review Simulation
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
                ${isLoading ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isLoading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
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
            <div className="mb-6">
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
                disabled={isLoading}
                placeholder="e.g., Series A Pitch, Board Review, Research Defense..."
                className="w-full bg-[#001E44]/80 border border-[#FFC627]/20 rounded-lg px-4 py-3 font-mono text-sm text-[#E2E8F0] placeholder-[#4A5568] focus:outline-none focus:border-[#FFC627]/50 focus:ring-1 focus:ring-[#FFC627]/30 transition-all disabled:opacity-50"
              />
            </div>

            {/* Info Text */}
            <div className="mb-6 p-4 bg-[#001E44]/50 rounded-lg border border-[#4A5568]/30">
              <p className="font-mono text-xs text-[#A0AEC0] leading-relaxed">
                Upload any document and the AI will generate a custom review committee 
                with personas tailored to your content. They will ask challenging, 
                context-aware questions based on your document.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 rounded-lg border border-red-500/30 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="font-mono text-xs text-red-400">{error}</p>
              </motion.div>
            )}

            {/* Initialize Button */}
            <motion.button
              whileHover={!isLoading && canInitialize ? { scale: 1.02 } : {}}
              whileTap={!isLoading && canInitialize ? { scale: 0.98 } : {}}
              onClick={() => canInitialize && onInitialize(file, context)}
              disabled={isLoading || !canInitialize}
              className={`
                w-full relative overflow-hidden group
                ${!canInitialize ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-[#FFC627] to-[#B8941E] ${canInitialize && !isLoading ? 'opacity-90 group-hover:opacity-100' : 'opacity-50'} transition-opacity`} />
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]" />
              <div className="relative px-6 py-4 font-mono text-sm font-bold text-[#001E44] uppercase tracking-wider flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="text-[#001E44]" />
                    Analyzing Document...
                  </>
                ) : (
                  'Initialize Committee'
                )}
              </div>
            </motion.button>

            {/* Validation hint */}
            {!canInitialize && !isLoading && (
              <p className="text-center font-mono text-xs text-[#FFC627]/70 mt-4">
                {!file ? 'Please upload a PDF document' : 'Please enter a meeting context'}
              </p>
            )}

            {/* Footer */}
            <p className="text-center font-mono text-xs text-[#4A5568] mt-6">
              Powered by AI - All content is analyzed in real-time
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
