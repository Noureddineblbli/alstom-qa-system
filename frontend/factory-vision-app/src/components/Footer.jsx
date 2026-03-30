import React from 'react';

export default function Footer() {
  return (
    <footer className="fixed bottom-0 inset-x-0 h-8 bg-[#0F1115] border-t border-white/5 px-6 flex items-center justify-between text-[10px] font-mono text-white/20 z-40">
      <div className="flex gap-6">
        <span>DEVICE: TABLET-QC-04</span>
        <span>LATENCY: 12ms</span>
      </div>
      <div className="flex gap-6">
        <span>STORAGE: 84% FREE</span>
        <span>{new Date().toLocaleTimeString()}</span>
      </div>
    </footer>
  );
}
