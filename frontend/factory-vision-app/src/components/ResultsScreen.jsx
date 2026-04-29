import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

export default function ResultsScreen({ 
  inspectionResult, 
  capturedImage, 
  onRetake, 
  onReset 
}) {
  const imgRef = useRef(null);
  const rowRefs = useRef({});
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  useEffect(() => {
    const updateScale = () => {
      const img = imgRef.current;
      if (!img || !inspectionResult.image_width) return;
      setScale({
        x: img.offsetWidth  / inspectionResult.image_width,
        y: img.offsetHeight / inspectionResult.image_height,
      });
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [capturedImage, inspectionResult]);

  const handleBoxClick = (slotId) => {
    setSelectedSlotId(prev => prev === slotId ? null : slotId);
    rowRefs.current[slotId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const failures = inspectionResult.details.filter(d => d.status === 'FAIL');

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
          {inspectionResult.status === 'Valid' 
            ? <CheckCircle2 className="w-10 h-10 text-white" />
            : <XCircle className="w-10 h-10 text-white" />
          }
        </div>
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-tight">
            {inspectionResult.status === 'Valid' ? 'Valid Panel' : 'Invalid Panel'}
          </h2>
          {failures.length > 0 && (
            <p className="text-white/50 text-sm mt-1">
              {failures.length} error{failures.length > 1 ? 's' : ''} — click a box to locate in table
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">

        {/* Image with overlay boxes */}
        <div className="space-y-3">
          <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">
            Captured Frame
          </label>
          <div className="rounded-xl overflow-hidden border border-white/10 relative inline-flex w-full justify-center">
            <div className="relative inline-block">
              <img
                ref={imgRef}
                src={capturedImage}
                alt="Captured"
                className="max-w-full max-h-[500px] object-contain block"
                onLoad={() => {
                  const img = imgRef.current;
                  if (!img || !inspectionResult.image_width) return;
                  setScale({
                    x: img.offsetWidth  / inspectionResult.image_width,
                    y: img.offsetHeight / inspectionResult.image_height,
                  });
                }}
              />

              {failures.filter(slot => slot.bbox !== null && slot.bbox !== undefined).map(slot => {
                  const x1 = slot.bbox.x1;
                  const y1 = slot.bbox.y1;
                  const x2 = slot.bbox.x2;
                  const y2 = slot.bbox.y2;

                  const isSelected = selectedSlotId === slot.slot_id;
                  return (
                    <div
                      key={slot.slot_id}
                      onClick={() => handleBoxClick(slot.slot_id)}
                      style={{
                        position: 'absolute',
                        left:   x1 * scale.x,
                        top:    y1 * scale.y,
                        width:  (x2 - x1) * scale.x,
                        height: (y2 - y1) * scale.y,
                        boxSizing: 'border-box',
                      }}
                      className={`border-1 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-yellow-400 bg-yellow-400/20'
                          : 'border-red-500 bg-red-500/10 hover:bg-red-500/20'
                      }`}
                    >
                      <span className={`absolute -top-2 left-0 text-[4px] font-mono px-0.5 leading-none whitespace-nowrap ${
                        isSelected ? 'bg-yellow-400 text-black' : 'bg-red-500 text-white'
                      }`}>
                        {slot.slot_id}
                      </span>
                    </div>
                  );     
              })}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="space-y-3">
          <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">
            Labels Breakdown
          </label>
          <div className="bg-[#16191E] border border-white/5 rounded-xl w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  {['Slot Id','Scanned ID','Expected ID','Scanned Cal.','Expected Cal.','Status','Message'].map(h => (
                    <th key={h} className="text-center p-3 font-mono text-[10px] uppercase text-white/40">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {failures.map((detail, idx) => (
                  <tr
                    key={idx}
                    ref={el => { if (detail.status === 'FAIL') rowRefs.current[detail.slot_id] = el; }}
                    className={`transition-colors duration-300 ${
                      selectedSlotId === detail.slot_id
                        ? 'bg-yellow-400/10 outline outline-1 outline-yellow-400/40'
                        : detail.status === 'FAIL'
                          ? 'hover:bg-red-500/10'
                          : 'hover:bg-white/[0.01]'
                    }`}
                  >
                    <td className="p-3 font-medium">{detail.slot_id}</td>
                    <td className="p-3 font-mono text-center">{detail.scanned_identification}</td>
                    <td className="p-3 font-mono text-center">{detail.expected_identification}</td>
                    <td className="p-3 font-mono text-center">{detail.scanned_calibre}</td>
                    <td className="p-3 font-mono text-center">{detail.expected_calibre}</td>
                    <td className="p-3 font-mono text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        detail.status === 'PASS'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {detail.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-center text-white/50 text-xs">{detail.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      </div>
    </motion.div>
  );
}