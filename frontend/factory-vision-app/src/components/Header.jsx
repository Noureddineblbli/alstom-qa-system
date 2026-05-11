import React from 'react';
import { Factory, Settings, LogOut, User as UserIcon } from 'lucide-react';

export default function Header({ user, onLogout, onAdminClick }) {
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
      
      <div className="flex items-center gap-6">
        {user ? (
          <div className="flex items-center gap-4 border-l border-white/10 pl-6">
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-bold text-white/80">{user.name}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter ${
                user.role === 'Admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
              }`}>
                {user.role}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {user.role === 'Admin' && (
                <button 
                  onClick={onAdminClick}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors group" title="Admin Settings"
                >
                  <Settings className="w-5 h-5 text-white/40 group-hover:text-white" />
                </button>
              )}
              <button 
                onClick={onLogout}
                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group" title="Sign Out"
              >
                <LogOut className="w-5 h-5 text-white/40 group-hover:text-red-400" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-white/40 font-mono uppercase">System Status</span>
            <span className="text-[10px] text-green-400 font-mono uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Online
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
