import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Maximize2, RefreshCw } from 'lucide-react';

export default function CameraScreen({ 
  selectedReference, 
  onBack, 
  onCapture, 
  isAnalyzing 
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const frameRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 4096 }, height: { ideal: 3072 }, aspectRatio: 4/3, advanced: [{ width: 4096, height: 3072 }] } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const handleCaptureClick = () => {
    if (!videoRef.current || !canvasRef.current || !frameRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    // const frame = frameRef.current;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // // DOM rects
    // const videoRect = video.getBoundingClientRect();
    // const frameRect = frame.getBoundingClientRect();

    // // Scale from displayed size → actual video pixels
    // const scaleX = video.videoWidth / videoRect.width;
    // const scaleY = video.videoHeight / videoRect.height;

    // // Compute crop area in video pixels
    // const sx = Math.round((frameRect.left - videoRect.left) * scaleX);
    // const sy = Math.round((frameRect.top  - videoRect.top)  * scaleY);
    // const sw = Math.round(frameRect.width  * scaleX);
    // const sh = Math.round(frameRect.height * scaleY);

    // // Set canvas size to cropped area
    // canvas.width = sw;
    // canvas.height = sh;

    // // Draw cropped region
    // ctx.drawImage(
    //   video,
    //   sx, sy, sw, sh,   // source (crop)
    //   0, 0, sw, sh      // destination
    // );

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the entire video frame
    ctx.drawImage(
      video,
      0, 0, video.videoWidth, video.videoHeight
    );

    const imageData = canvas.toDataURL('image/jpeg', 1.0);
    onCapture(imageData);
  };

  return (
    <motion.div 
      key="camera"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black flex flex-col"
    >
      {/* Camera Header */}
      <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={onBack}
          className="p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/60">Reference Active</span>
          <span className="text-sm font-bold">{selectedReference?.name}</span>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Camera Viewport */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        
        {/* Alignment Guide Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div ref={frameRef} className="relative w-[80%] max-w-[600px] h-[80%] aspect-[4/3] border-2 border-white/20 rounded-lg">
            {/* Corner Accents */}
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-md" />
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-md" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-md" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-md" />
            
            {/* Scanning Line Animation */}
            <motion.div 
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 right-0 h-0.5 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10"
            />

            {/* Center Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <div className="w-10 h-px bg-white" />
              <div className="h-10 w-px bg-white absolute" />
            </div>

            <div className="absolute -bottom-12 left-0 right-0 text-center">
              <p className="text-xs font-mono uppercase tracking-widest text-white/60 bg-black/40 backdrop-blur-md py-1 rounded-full inline-block px-4">
                Align panel within frame
              </p>
            </div>
          </div>
        </div>

        {/* Analysis Loading Overlay */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20"
            >
              <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-lg font-bold tracking-widest uppercase">Analyzing Panel</p>
              <p className="text-sm text-white/40 font-mono">Comparing with {selectedReference?.name}...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Camera Controls */}
      <div className="p-10 h-20 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-12 z-10">
        
        <button 
          onClick={handleCaptureClick}
          disabled={isAnalyzing}
          className="w-20 h-15 bg-white rounded-full p-1 border-4 border-white/20 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
        >
          <div className="w-full h-full bg-white rounded-full border-2 border-black" />
        </button>

      </div>

      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}
