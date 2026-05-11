import React, { useState, useRef } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Calendar, Layout, 
  FileText, X, Info, Eye, ArrowLeft, Upload, 
  CheckCircle2, AlertCircle, Save, Table
} from 'lucide-react';
import { PROJECTS, REFERENCES as INITIAL_REFERENCES } from '../../data/mockData';
import { motion, AnimatePresence } from 'motion/react';

export default function ReferenceManagement() {
  const [references, setReferences] = useState(INITIAL_REFERENCES);
  const [activeView, setActiveView] = useState('list'); // 'list', 'add', 'detail'
  const [editingRowId, setEditingRowId] = useState(null);
  const [editRowBuffer, setEditRowBuffer] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [detailMode, setDetailMode] = useState('preview'); // 'preview', 'edit', 'confirm'
  const [selectedRef, setSelectedRef] = useState(null);
  const [editBuffer, setEditBuffer] = useState(null);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add State
  const [newRef, setNewRef] = useState({ name: '', projectId: PROJECTS[0].id, slots: [] });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Helper: Group slots into a grid [row][slot]
  const getGridData = (slots) => {
    const grid = {};
    slots.forEach(slot => {
      const [r, s] = slot.slot_id.split('-');
      const rowIdx = parseInt(r.substring(1));
      const slotIdx = parseInt(s.substring(1));
      
      if (!grid[rowIdx]) grid[rowIdx] = {};
      grid[rowIdx][slotIdx] = slot;
    });
    return grid;
  };

  const handleRowAction = (ref, action) => {
    if (action === 'inline-edit') {
      setEditingRowId(ref.id);
      setEditRowBuffer({ ...ref });
      return;
    }
    setSelectedRef(ref);
    setEditBuffer(JSON.parse(JSON.stringify(ref)));
    setActiveView('detail');
    setDetailMode(action === 'view' ? 'preview' : 'edit');
  };

  const saveInlineEdit = () => {
    const updatedAll = references.map(r => r.id === editingRowId ? { ...editRowBuffer, updatedAt: new Date().toISOString() } : r);
    setReferences(updatedAll);
    setEditingRowId(null);
    setEditRowBuffer(null);
  };

  const handleCellChange = (rowIdx, slotIdx, field, newValue) => {
    const updated = { ...editBuffer };
    const slotToUpdate = updated.slots.find(s => {
      const [r, sl] = s.slot_id.split('-');
      return parseInt(r.substring(1)) === rowIdx && parseInt(sl.substring(1)) === slotIdx;
    });
    
    if (slotToUpdate) {
      slotToUpdate[field] = newValue;
      setEditBuffer(updated);
    }
  };

  const calculateChanges = () => {
    const changes = [];
    editBuffer.slots.forEach((newSlot, idx) => {
      const oldSlot = selectedRef.slots[idx];
      if (newSlot.expected_calibre !== oldSlot.expected_calibre) {
        changes.push({
          slot: newSlot.slot_id,
          field: 'AMP',
          from: oldSlot.expected_calibre,
          to: newSlot.expected_calibre
        });
      }
      if (newSlot.expected_identification !== oldSlot.expected_identification) {
        changes.push({
          slot: newSlot.slot_id,
          field: 'ID',
          from: oldSlot.expected_identification,
          to: newSlot.expected_identification
        });
      }
    });
    setPendingChanges(changes);
    setDetailMode('confirm');
  };

  const saveEditedReference = () => {
    const updatedAll = references.map(r => r.id === selectedRef.id ? { ...editBuffer, updatedAt: new Date().toISOString() } : r);
    setReferences(updatedAll);
    setActiveView('list');
    setDetailMode('preview');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    // Simulate parsing
    setTimeout(() => {
      // For demo, we just use the first reference's slots as "parsed" data
      setNewRef(prev => ({ ...prev, slots: INITIAL_REFERENCES[0].slots }));
      setIsUploading(false);
    }, 1500);
  };

  const finalizeAdd = () => {
    const referenceToAdd = {
      ...newRef,
      id: `REF-${new Date().getFullYear()}-${String(references.length + 1).padStart(3, '0')}`,
      updatedAt: new Date().toISOString()
    };
    setReferences([referenceToAdd, ...references]);
    setActiveView('list');
    setNewRef({ name: '', projectId: PROJECTS[0].id, slots: [] });
  };

  const deleteRef = (id) => {
    setReferences(references.filter(r => r.id !== id));
    setDeleteConfirmId(null);
  };

  const filteredRefs = references.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {activeView === 'list' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/20">
                  <Table className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">References</h3>
                  <p className="text-sm text-white/40">Manage project reference documentation.</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveView('add')}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <Plus className="w-4 h-4" /> Add Reference
              </button>
            </div>

            {/* Main Table */}
            <div className="bg-[#16191E] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    type="text" 
                    placeholder="Search references..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm focus:border-blue-500 outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="p-4 text-[10px] font-mono font-bold uppercase text-white/40 tracking-widest">Reference ID</th>
                    <th className="p-4 text-[10px] font-mono font-bold uppercase text-white/40 tracking-widest">Project</th>
                    <th className="p-4 text-[10px] font-mono font-bold uppercase text-white/40 tracking-widest">Created At</th>
                    <th className="p-4 text-right text-[10px] font-mono font-bold uppercase text-white/40 tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {filteredRefs.map(ref => {
                    const isEditing = editingRowId === ref.id;
                    
                    return (
                      <motion.tr 
                        layout
                        key={ref.id} 
                        className={`transition-colors group ${isEditing ? 'bg-blue-600/5' : 'hover:bg-white/[0.01]'}`}
                      >
                        <td className="p-4">
                          {isEditing ? (
                            <input 
                              type="text"
                              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white outline-none focus:border-blue-500 w-full"
                              value={editRowBuffer.id}
                              onChange={(e) => setEditRowBuffer({ ...editRowBuffer, id: e.target.value })}
                            />
                          ) : (
                            <span className="text-white/80">{ref.id}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <select 
                              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white outline-none focus:border-blue-500 w-full"
                              value={editRowBuffer.projectId}
                              onChange={(e) => setEditRowBuffer({ ...editRowBuffer, projectId: e.target.value })}
                            >
                              {PROJECTS.map(p => <option key={p.id} value={p.id} className="bg-[#16191E]">{p.name}</option>)}
                            </select>
                          ) : (
                            <span className="text-white/60">{PROJECTS.find(p => p.id === ref.projectId)?.name || 'Unknown'}</span>
                          )}
                        </td>
                        <td className="p-4 text-white/40 font-mono text-sm">{new Date(ref.updatedAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isEditing ? (
                              <>
                                <button 
                                  onClick={saveInlineEdit}
                                  className="p-2 hover:bg-green-500/10 rounded-lg text-green-400 transition-colors"
                                  title="Save Changes"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setEditingRowId(null)}
                                  className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  onClick={() => handleRowAction(ref, 'view')}
                                  className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleRowAction(ref, 'inline-edit')}
                                  className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setDeleteConfirmId(ref.id)}
                                  className="p-2 hover:bg-red-500/10 rounded-lg text-white/20 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                  {filteredRefs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-white/20">
                        <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p>No results matching your search</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeView === 'add' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <button 
              onClick={() => setActiveView('list')}
              className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to References
            </button>

            <div className="bg-[#16191E] border border-white/10 rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/20">
                  <Plus className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Add New Reference</h3>
                  <p className="text-white/40">Manage project-specific references and data.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest block mb-2 font-bold">Select Project</label>
                  <select 
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-medium appearance-none"
                    value={newRef.projectId}
                    onChange={(e) => setNewRef({ ...newRef, projectId: e.target.value })}
                  >
                    <option value="" disabled>-- Choose a project --</option>
                    {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest block mb-2 font-bold">Reference ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g., REF-2026-001"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-medium"
                    value={newRef.name}
                    onChange={(e) => setNewRef({ ...newRef, name: e.target.value })}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-bold">Excel Data File</label>
                    <button className="text-[10px] text-blue-400 hover:underline flex items-center gap-1">
                      <Info className="w-3 h-3" /> Get Template
                    </button>
                  </div>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                      newRef.slots.length > 0 
                        ? 'border-green-500/30 bg-green-500/5' 
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20'
                    }`}
                  >
                    <input 
                      type="file" 
                      hidden 
                      ref={fileInputRef} 
                      onChange={handleFileUpload}
                      accept=".xlsx,.xls,.csv"
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-blue-400 font-bold">Processing File...</span>
                      </div>
                    ) : newRef.slots.length > 0 ? (
                      <div className="flex flex-col items-center gap-3">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                        <span className="text-sm text-green-400 font-bold">{newRef.slots.length} Slots Imported Successfully</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-white/20" />
                        <div className="text-center">
                          <p className="font-bold text-blue-500">Click to upload <span className="text-white/40 font-normal">or drag and drop</span></p>
                          <p className="text-[10px] text-white/20 mt-1 uppercase font-mono">XLSX, CSV (max 10MB)</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button 
                disabled={!newRef.name || !newRef.projectId || newRef.slots.length === 0}
                onClick={finalizeAdd}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98]"
              >
                + Validate & Add Reference
              </button>
            </div>
          </motion.div>
        )}

        {activeView === 'detail' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            <div className="bg-[#16191E] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
              {/* Toolbar */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                    <Table className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold">Preview: {selectedRef?.id}</h4>
                    <p className="text-[10px] text-white/40 uppercase font-mono tracking-widest">{selectedRef?.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveView('list')}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>

              {/* Step: Confirm Changes */}
              <AnimatePresence>
                {detailMode === 'confirm' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-8 space-y-6">
                      <div className="flex items-center gap-2 text-yellow-500">
                        <AlertCircle className="w-5 h-5" />
                        <h5 className="font-bold">Confirm Changes</h5>
                      </div>
                      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6">
                        <div className="space-y-2">
                          {pendingChanges.length > 0 ? pendingChanges.map((change, i) => (
                            <p key={i} className="text-sm">
                              <span className="font-bold text-yellow-500">{change.slot}</span>, Type: <span className="font-bold uppercase">{change.field}</span>: 
                              <span className="text-white/40 mx-2 italic">changed from</span> 
                              <span className="line-through text-white/20 mx-1">{change.from}</span>
                              <span className="text-white/40 mx-1">to</span>
                              <span className="font-bold text-white underline decoration-yellow-500/50 decoration-2 underline-offset-4">{change.to}</span>
                            </p>
                          )) : (
                            <p className="text-white/40 italic">No visible changes detected</p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end gap-4">
                        <button 
                          onClick={() => setDetailMode('edit')}
                          className="px-6 py-3 text-sm font-bold hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={saveEditedReference}
                          className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-green-600/20"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Validate & Save
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Step: Grid Table */}
              {(detailMode === 'preview' || detailMode === 'edit') && (
                <>
                  <div className="p-6 overflow-x-auto">
                    <div className="min-w-[1000px]">
                      <table className="w-full border-collapse border border-white/5 text-[11px] font-mono">
                        <thead>
                          <tr className="bg-white/[0.03]">
                            <th className="border border-white/5 p-3 text-center uppercase font-bold text-white/40 bg-white/[0.02]">Row</th>
                            {[1,2,3,4,5,6,7,8].map(sNum => (
                              <th key={sNum} colSpan={2} className="border border-white/5 p-3 text-center uppercase font-bold text-white/40">S{sNum}</th>
                            ))}
                          </tr>
                          <tr className="bg-white/[0.01]">
                            <th className="border border-white/5 p-2 bg-white/[0.02]"></th>
                            {[1,2,3,4,5,6,7,8].map(sNum => (
                              <React.Fragment key={sNum}>
                                <th className="border border-white/5 p-2 text-center text-white/30 text-[9px]">ID</th>
                                <th className="border border-white/5 p-2 text-center text-white/30 text-[9px]">AMP</th>
                              </React.Fragment>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(getGridData(editBuffer?.slots || [])).map(([rowIdx, rowSlots]) => (
                            <tr key={rowIdx} className="hover:bg-white/[0.01] transition-colors">
                              <td className="border border-white/5 p-3 text-center font-bold text-white/40 bg-white/[0.02]">{rowIdx}</td>
                              {[1,2,3,4,5,6,7,8].map(slotIdx => {
                                const slot = rowSlots[slotIdx];
                                if (!slot) return (
                                  <React.Fragment key={slotIdx}>
                                    <td className="border border-white/5 p-2 bg-black/20"></td>
                                    <td className="border border-white/5 p-2 bg-black/20"></td>
                                  </React.Fragment>
                                );
                                return (
                                  <React.Fragment key={slotIdx}>
                                    <td className={`border border-white/5 p-2 text-center ${detailMode === 'edit' ? 'bg-blue-600/5' : ''}`}>
                                      {detailMode === 'edit' ? (
                                        <input 
                                          type="text" 
                                          className="w-full bg-transparent text-center outline-none focus:text-blue-400"
                                          value={slot.expected_identification}
                                          onChange={(e) => handleCellChange(parseInt(rowIdx), slotIdx, 'expected_identification', e.target.value)}
                                        />
                                      ) : (
                                        slot.expected_identification
                                      )}
                                    </td>
                                    <td className={`border border-white/5 p-2 text-center ${detailMode === 'edit' ? 'bg-blue-600/5' : ''}`}>
                                      {detailMode === 'edit' ? (
                                        <input 
                                          type="text" 
                                          className="w-full bg-transparent text-center outline-none focus:text-blue-400"
                                          value={slot.expected_calibre}
                                          onChange={(e) => handleCellChange(parseInt(rowIdx), slotIdx, 'expected_calibre', e.target.value)}
                                        />
                                      ) : (
                                        slot.expected_calibre
                                      )}
                                    </td>
                                  </React.Fragment>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="p-6 border-t border-white/5 flex justify-end">
                    {detailMode === 'preview' ? (
                      <button 
                        onClick={() => setDetailMode('edit')}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                      >
                        Update Reference
                      </button>
                    ) : (
                      <button 
                        onClick={calculateChanges}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                      >
                        Save Changes
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#16191E] border border-white/10 rounded-2xl p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h4 className="text-xl font-bold mb-2">Delete Reference?</h4>
              <p className="text-white/40 text-sm mb-8">
                Are you sure you want to delete <span className="text-white font-mono">{deleteConfirmId}</span>? This action cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteRef(deleteConfirmId)}
                  className="py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold transition-all shadow-lg shadow-red-600/20"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

