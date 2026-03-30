import React from 'react';
import { Factory, Settings } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#16191E]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
          <Factory className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight uppercase">Vision Inspector</h1>
          <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Industrial Quality Control</p>
        </div>
      </div>
      
    </header>
  );
}
