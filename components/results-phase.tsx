"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, XCircle, AlertCircle, RotateCcw, Sparkles } from 'lucide-react'

interface ResultsPhaseProps {
  finalScore: number
  onRestart: () => void
  outcomes?: {
    success: { title: string; subtitle: string; message: string }
    conditional: { title: string; subtitle: string; message: string }
    failure: { title: string; subtitle: string; message: string }
  }
  reportData?: any
}

export function ResultsPhase({ finalScore, onRestart, outcomes, reportData }: ResultsPhaseProps) {
  const getVerdict = () => {
    if (finalScore >= 70) {
      return {
        title: outcomes?.success?.title || 'INVESTMENT APPROVED',
        subtitle: outcomes?.success?.subtitle || 'The Shadow Committee has reached a favorable verdict.',
        icon: Trophy,
        color: 'text-green-400',
        bgColor: 'bg-green-400/10',
        borderColor: 'border-green-400/30',
        message: outcomes?.success?.message || 'Your pitch demonstrated strong fundamentals, clear vision, and compelling market opportunity. The Committee recommends proceeding.',
      }
    } else if (finalScore >= 40) {
      return {
        title: outcomes?.conditional?.title || 'CONDITIONAL INTEREST',
        subtitle: outcomes?.conditional?.subtitle || 'The Shadow Committee requires further due diligence.',
        icon: AlertCircle,
        color: 'text-[#FFC627]',
        bgColor: 'bg-[#FFC627]/10',
        borderColor: 'border-[#FFC627]/30',
        message: outcomes?.conditional?.message || 'Your pitch showed promise but raised concerns that need addressing. The Committee suggests a follow-up session.',
      }
    } else {
      return {
        title: outcomes?.failure?.title || 'INVESTMENT DECLINED',
        subtitle: outcomes?.failure?.subtitle || 'The Shadow Committee has reached an unfavorable verdict.',
        icon: XCircle,
        color: 'text-red-400',
        bgColor: 'bg-red-400/10',
        borderColor: 'border-red-400/30',
        message: outcomes?.failure?.message || 'Your pitch failed to address critical concerns. The Committee recommends significant pivots.',
      }
    }
  }

  const verdict = getVerdict()
  const Icon = verdict.icon

  const [isGenerating, setIsGenerating] = useState(false)
  const [conclusiveReport, setConclusiveReport] = useState<any>(null)

  useEffect(() => {
    if (reportData && !conclusiveReport && !isGenerating) {
      setIsGenerating(true)
      fetch('/api/conclude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalScore,
          chatHistory: reportData.chatHistory,
          meetingContext: reportData.meetingContext,
          judges: reportData.judges,
          confidences: reportData.confidences
        })
      })
      .then(res => res.json())
      .then(res => {
         setConclusiveReport(res.data)
         setIsGenerating(false)
      })
      .catch(err => {
         console.error(err)
         setIsGenerating(false)
      })
    }
  }, [reportData, conclusiveReport, isGenerating, finalScore])

  const handleDownloadPDF = async () => {
    if (!conclusiveReport) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    let yPos = 20;
    const addPageIfNeeded = (spaceNeeded: number) => {
      if (yPos + spaceNeeded > 280) {
        doc.addPage();
        yPos = 20;
      }
    };

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("SHADOW COMMITTEE - MEETING DOSSIER", 14, yPos);
    yPos += 10;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Final Confidence Score: ${finalScore}%  |  Verdict: ${verdict.title}`, 14, yPos);
    yPos += 15;
    
    // Gist Summary
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Executive Summary", 14, yPos);
    yPos += 8;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const splitSummary = doc.splitTextToSize(conclusiveReport.gistSummary, 180);
    doc.text(splitSummary, 14, yPos);
    yPos += (splitSummary.length * 5) + 15;
    
    // Per-Persona Breakdown
    addPageIfNeeded(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Board Member Evaluations", 14, yPos);
    yPos += 10;

    conclusiveReport.personaFeedback?.forEach((fb: any, i: number) => {
      addPageIfNeeded(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`Target: ${fb.name}`, 14, yPos);
      yPos += 7;
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      const splitThinking = doc.splitTextToSize(`Internal Logic: ${fb.thinking}`, 180);
      doc.text(splitThinking, 14, yPos);
      yPos += (splitThinking.length * 5) + 3;
      
      doc.setFont("helvetica", "normal");
      const splitFeedback = doc.splitTextToSize(`Verdict: ${fb.feedback}`, 180);
      doc.text(splitFeedback, 14, yPos);
      yPos += (splitFeedback.length * 5) + 10;
    });

    // Q&A Breakdown
    if (conclusiveReport.questionFeedback && conclusiveReport.questionFeedback.length > 0) {
      addPageIfNeeded(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Cross-Examination Feedback Log", 14, yPos);
      yPos += 10;

      conclusiveReport.questionFeedback.forEach((qf: any, i: number) => {
        addPageIfNeeded(50);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`Turn ${i+1}: Evaluator ${qf.judge}`, 14, yPos);
        yPos += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const splitQ = doc.splitTextToSize(`Q: ${qf.question}`, 180);
        doc.text(splitQ, 14, yPos);
        yPos += (splitQ.length * 5) + 2;

        const splitA = doc.splitTextToSize(`Founder: ${qf.answer}`, 180);
        doc.text(splitA, 14, yPos);
        yPos += (splitA.length * 5) + 3;

        doc.setFont("helvetica", "italic");
        const splitF = doc.splitTextToSize(`Analysis: ${qf.feedback}`, 180);
        doc.text(splitF, 14, yPos);
        yPos += (splitF.length * 5) + 12;
      });
    }
    
    doc.save("shadow_committee_dossier.pdf");
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#001E44] flex items-center justify-center p-4 overflow-y-auto"
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
        className="relative max-w-xl w-full my-auto py-12"
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

          {/* Score */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mb-8 mt-6"
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
            className="mb-8 text-left"
          >
            {isGenerating ? (
               <div className="animate-pulse flex gap-2 items-center justify-center text-[#A0AEC0] font-mono text-sm py-4">
                 <div className="w-2 h-2 bg-[#FFC627] rounded-full" />
                 <div className="w-2 h-2 bg-[#FFC627] rounded-full animation-delay-200" />
                 <div className="w-2 h-2 bg-[#FFC627] rounded-full animation-delay-400" />
                 <span className="ml-2">Synthesizing Core Board Feedback...</span>
               </div>
            ) : conclusiveReport ? (
               <p className="font-mono text-sm text-[#E2E8F0] leading-relaxed">
                 {conclusiveReport.gistSummary}
               </p>
            ) : (
               <p className="font-mono text-sm text-[#E2E8F0] leading-relaxed">
                 {verdict.message}
               </p>
            )}
          </motion.div>

          <div className="flex flex-col gap-4 justify-center items-center">
            {/* Download PDF Button */}
            {conclusiveReport && (
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.85 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-3 px-8 py-3 w-full justify-center rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 transition-all font-mono text-sm uppercase tracking-wider"
              >
                Download Detailed Feedback PDF
              </motion.button>
            )}

            {/* Restart Button */}
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRestart}
              className="inline-flex items-center justify-center gap-3 px-8 py-3 w-full rounded-lg bg-[#FFC627]/10 border border-[#FFC627]/30 text-[#FFC627] hover:bg-[#FFC627]/20 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="font-mono text-sm uppercase tracking-wider">
                Retry Simulation
              </span>
            </motion.button>
          </div>
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
