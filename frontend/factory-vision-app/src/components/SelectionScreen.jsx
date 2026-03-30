import React from 'react';
import { motion } from 'motion/react';
import { Database, History, ChevronRight, Info, Camera } from 'lucide-react';
import { PROJECTS, REFERENCES } from '../data/mockData';

export default function SelectionScreen({ 
  selectedProject, 
  setSelectedProject, 
  selectedReference, 
  setSelectedReference, 
  onStartCamera 
}) {
  const filteredReferences = selectedProject 
    ? REFERENCES.filter(r => r.projectId === selectedProject.id)
    : [];

  return (
    <motion.div 
      key="selection"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-light">Inspection Setup</h2>
        <p className="text-white/40 text-sm">Configure the project and reference for the current inspection cycle.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Selection */}
        <div className="space-y-4">
          <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest flex items-center gap-2">
            <Database className="w-3 h-3" /> Select Project
          </label>
          <div className="space-y-2">
            {PROJECTS.map(project => (
              <button
                key={project.id}
                onClick={() => {
                  setSelectedProject(project);
                  setSelectedReference(null);
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group ${
                  selectedProject?.id === project.id 
                    ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                    : 'bg-[#16191E] border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{project.name}</h3>
                    <p className="text-xs text-white/40">{project.location}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedProject?.id === project.id ? 'translate-x-1 text-blue-400' : 'text-white/20'}`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Reference Selection */}
        <div className="space-y-4">
          <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest flex items-center gap-2">
            <History className="w-3 h-3" /> Select Reference
          </label>
          <div className="space-y-2">
            {!selectedProject ? (
              <div className="h-48 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.02] text-white/20">
                <Info className="w-6 h-6 mb-2" />
                <p className="text-xs">Select a project first</p>
              </div>
            ) : (
              filteredReferences.map(ref => (
                <button
                  key={ref.id}
                  onClick={() => setSelectedReference(ref)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                    selectedReference?.id === ref.id 
                      ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                      : 'bg-[#16191E] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{ref.name}</h3>
                      <p className="text-[10px] text-white/40 font-mono mt-1">{ref.expectedSpecs.length} parameters to verify</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedReference?.id === ref.id ? 'translate-x-1 text-blue-400' : 'text-white/20'}`} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="pt-6">
        <button
          disabled={!selectedProject || !selectedReference}
          onClick={onStartCamera}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20"
        >
          <Camera className="w-5 h-5" />
          INITIALIZE CAMERA
        </button>
      </div>
    </motion.div>
  );
}
