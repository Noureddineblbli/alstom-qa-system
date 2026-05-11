import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Layout, ChevronLeft, LayoutDashboard, Database, Settings } from 'lucide-react';
import UserManagement from './UserManagement';
import ReferenceManagement from './ReferenceManagement';

export default function AdminSpace({ onExit }) {
  const [activeTab, setActiveTab] = useState('references');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-[#0F1115] flex flex-col md:flex-row"
    >
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#16191E] border-b md:border-b-0 md:border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight uppercase">Admin Console</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> User Management
          </button>

          <button 
            onClick={() => setActiveTab('references')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'references' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" /> References
          </button>

          <div className="pt-4 mt-4 border-t border-white/5">
             <button 
              onClick={onExit}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Exit Admin
            </button>
          </div>
        </nav>

        <div className="p-6 border-t border-white/5 text-[10px] font-mono text-white/20">
          SYSTEM VERSION 2.4.0-REV-12
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
             <div className="space-y-2">
                <h2 className="text-3xl font-light">System Overview</h2>
                <p className="text-white/40 text-sm">Key performance metrics and activity across the facility.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Inspections', value: '1,242', change: '+12%', color: 'blue' },
                  { label: 'Pass Rate', value: '94.2%', change: '+0.5%', color: 'green' },
                  { label: 'Active Operators', value: '18', change: '-2', color: 'purple' },
                  { label: 'Critical Errors', value: '3', change: '-80%', color: 'red' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#16191E] border border-white/5 p-6 rounded-2xl">
                    <p className="text-[10px] font-mono uppercase text-white/40 tracking-widest mb-1">{stat.label}</p>
                    <div className="flex items-end justify-between">
                      <h4 className="text-2xl font-bold">{stat.value}</h4>
                      <span className={`text-[10px] font-bold ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#16191E] border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 h-64">
                 <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                    <Layout className="w-6 h-6 text-white/40" />
                 </div>
                 <div>
                   <h5 className="font-bold">Real-time Analytics</h5>
                   <p className="text-sm text-white/40 max-w-xs">Detailed chart visualizations and heatmaps are currently generating.</p>
                 </div>
              </div>
          </div>
        )}

        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'references' && <ReferenceManagement />}
      </main>
    </motion.div>
  );
}
