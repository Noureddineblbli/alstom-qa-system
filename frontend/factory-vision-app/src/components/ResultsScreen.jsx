import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function ResultsScreen({ 
  inspectionResult, 
  capturedImage, 
  onRetake, 
  onReset 
}) {
  return (
    <motion.div 
      key="results"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <button 
          onClick={onRetake}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retake Image
        </button>
        {/* <div className="text-right">
          <p className="text-[10px] text-white/40 font-mono uppercase">Inspection ID</p>
          <p className="text-xs font-mono">#QC-{Math.floor(Math.random() * 1000000)}</p>
        </div> */}
      </div>

      {/* Status Banner */}
      <div className={`p-6 rounded-2xl border flex items-center gap-6 ${
        inspectionResult.status === 'Valid' 
          ? 'bg-green-500/10 border-green-500/50' 
          : 'bg-red-500/10 border-red-500/50'
      }`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
          inspectionResult.status === 'Valid' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {inspectionResult.status === 'Valid' ? (
            <CheckCircle2 className="w-10 h-10 text-white" />
          ) : (
            <XCircle className="w-10 h-10 text-white" />
          )}
        </div>
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-tight">
            {inspectionResult.status === 'Valid' ? 'Valid Panel' : 'Invalid Panel'}
          </h2>
          {/* <p className="text-white/60">
            Confidence Score: <span className="font-mono text-white">{(inspectionResult.score * 100).toFixed(1)}%</span>
          </p> */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Captured Image Preview */}
        <div className="space-y-3">
          <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Captured Frame</label>
          <div className="rounded-xl overflow-hidden border border-white/10 relative group w-full flex items-center justify-center">
            <img src={capturedImage} alt="Captured" className="max-w-full max-h-[500px] object-contain" />
            {/* <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay" /> */}
            {/* Simulated detection boxes */}
            {/* <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-blue-400/50 rounded animate-pulse" /> */}
          </div>
        </div>

        {/* Comparison Details */}
        <div className="space-y-3">
          <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Labels Breakdown</label>
          <div className="bg-[#16191E] border border-white/5 rounded-xl w-full h-full overflow-x-auto">
            <div className='overflow-x-auto'>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-center p-3 font-mono text-[10px] uppercase text-white/40">Slot Id</th>
                    <th className="text-center p-3 font-mono text-[10px] uppercase text-white/40">Scanned Identification</th>
                    <th className="text-center p-3 font-mono text-[10px] uppercase text-white/40">Expected Identification</th>
                    <th className="text-center p-3 font-mono text-[10px] uppercase text-white/40">Scanned Calibre</th>
                    <th className="text-center p-3 font-mono text-[10px] uppercase text-white/40">Expected Calibre</th>
                    <th className="text-center p-3 font-mono text-[10px] uppercase text-white/40">Status</th>
                    <th className="text-center p-3 font-mono text-[10px] uppercase text-white/40">Message</th>
                    {/* <th className="text-center p-3 font-mono text-[10px] uppercase text-white/40">Label</th>
                    <th className="text-center p-3 font-mono text-[10px] uppercase text-white/40">Expected</th>
                    <th className="text-center p-3 font-mono text-[10px] uppercase text-white/40">Actual</th>
                    <th className="text-center p-3 font-mono text-[10px] uppercase text-white/40">Match</th>                   
                    <th className="text-center p-3 font-mono text-[10px] uppercase text-white/40">comment</th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {inspectionResult.details.map((detail, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-3 font-medium">{detail.slot_id}</td>
                      <td className="p-3 font-mono text-center">{detail.scanned_identification}</td>
                      <td className="p-3 font-mono text-center">{detail.expected_identification}</td>
                      <td className="p-3 font-mono text-center">{detail.scanned_calibre}</td>
                      <td className="p-3 font-mono text-center">{detail.expected_calibre}</td>
                      <td className="p-3 font-mono text-center">{detail.status}</td>
                      <td className="p-3 font-mono text-center">{detail.message}</td>
                      {/* <td className="p-3 font-medium">{detail.label}</td>
                      <td className="p-3 font-mono text-center">{detail.expected}</td>
                      <td className="p-3 font-mono text-center">{detail.actual}</td> */}
                      {/* <td className="p-3 text-right">
                        {detail.expected === detail.actual ? <div> Valid <CheckCircle2 className="w-4 h-4 text-green-500 inline" /></div>
                        : 
                        <div> Not Valid <AlertCircle className="w-4 h-4 text-red-500 inline" /></div>
                        }
                      </td>
                      <td className="p-3 font-mono text-center">
                        {detail.expected === detail.actual ? <p> This Slot is Valid </p>
                        : 
                        <p> The calibres dont match </p>
                        }
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button 
          onClick={onReset}
          className="p-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
        >
          NEW INSPECTION
        </button>
        {/* <button 
          className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
        >
          LOG & ARCHIVE
        </button> */}
      </div>
    </motion.div>
  );
}
