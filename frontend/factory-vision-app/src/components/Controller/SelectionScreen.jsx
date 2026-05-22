import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Database, History, ChevronRight, Info, Camera } from 'lucide-react';
import axios from '../../api/api';

export default function SelectionScreen({ 
  selectedProject, 
  setSelectedProject, 
  selectedReference, 
  setSelectedReference, 
  onStartCamera 
}) {
  const [projects, setProjects] = useState([]);
  const [references, setReferences] = useState([]);
  const filteredReferences = selectedProject
    ? references.filter(
        r => r.project_id === selectedProject.project_id
      )
    : [];
  
  useEffect(() => {
    const fetchData = async () => {
      try {

        const token = localStorage.getItem('token');

        const [projectsRes, referencesRes] = await Promise.all([
          axios.get('/api/projects/', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('/api/references/', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const projectsData = await projectsRes.data;
        const referencesData = await referencesRes.data;

        if (!projectsRes.data || !referencesRes.data) {
          throw new Error('Failed to fetch data');
        }

        setProjects(projectsData);
        setReferences(referencesData);

      } catch (err) {
        console.error('Failed to fetch setup data:', err);
      }
    };

    fetchData();
  }, []);


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
            {projects.map(project => (
              <button
                key={project.project_id}
                onClick={() => {
                  setSelectedProject(project);
                  setSelectedReference(null);
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group ${
                  selectedProject?.project_id === project.project_id 
                    ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                    : 'bg-[#16191E] border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{project.projectName}</h3>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedProject?.project_id === project.project_id ? 'translate-x-1 text-blue-400' : 'text-white/20'}`} />
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
                  key={ref.ref_id}
                  onClick={() => setSelectedReference(ref)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                    selectedReference?.ref_id === ref.ref_id 
                      ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                      : 'bg-[#16191E] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{ref.ref_id}</h3>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedReference?.ref_id === ref.ref_id ? 'translate-x-1 text-blue-400' : 'text-white/20'}`} />
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
