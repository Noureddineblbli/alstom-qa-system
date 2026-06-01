import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Calendar, Layout, 
  FileText, X, Info, Eye, ArrowLeft, Upload, 
  CheckCircle2, AlertCircle, Save, Table
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from '../../api/api';
import CameraScreen from '../Controller/CameraScreen';
import { RefreshCw } from 'lucide-react';


export default function ReferenceManagement() {
  const [references, setReferences] = useState([]);
  const [activeView, setActiveView] = useState('list'); // 'list', 'add', 'detail'
  const [editingRowId, setEditingRowId] = useState(null);
  const [editRowBuffer, setEditRowBuffer] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [detailMode, setDetailMode] = useState('preview'); // 'preview', 'edit', 'confirm'
  const [selectedRef, setSelectedRef] = useState(null);
  const [editBuffer, setEditBuffer] = useState(null);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('')

  // Pagination
  const ROWS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [refSearch, setRefSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [createdByFilter, setCreatedByFilter] = useState('all');

  const filteredRefs = references.filter(ref => {
    const matchesSearch =
      ref.ref_id.toLowerCase().includes(refSearch.toLowerCase());

    const matchesProject =
      projectFilter === 'all' || ref.project_id === Number(projectFilter);

    const matchesCreatedBy =
      createdByFilter === 'all' || ref.created_by === createdByFilter;

    return matchesSearch && matchesProject && matchesCreatedBy;
  });

  const totalPages = Math.ceil(filteredRefs.length / ROWS_PER_PAGE);

  const paginatedRefs = filteredRefs.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const [creationMethod, setCreationMethod] = useState('excel');
  const [showCamera, setShowCamera] = useState(false);

  const [cameraMode, setCameraMode] = useState('panel');

  const [overviewImage, setOverviewImage] = useState(null);

  const [positionMap, setPositionMap] = useState({});

  const [rowCount, setRowCount] = useState(0);

  const [currentRowIndex, setCurrentRowIndex] = useState(1);

  const [generatedSlots, setGeneratedSlots] = useState([]);

  const [processingRows, setProcessingRows] = useState(new Set());

  const [rowResults, setRowResults] = useState({});

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const imageDataToBlob = (imageData) => {
    const [header, base64] = imageData.split(',');
    const mimeType = header.match(/:(.*?);/)[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mimeType });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [filteredRefs]);
  
  // Add State
  const [projects, setProjects] = useState([]);

  const [newRef, setNewRef] = useState({
    ref_id: '',
    project_id: '',
    slots: []
  });  
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);


  useEffect(() => {
    setLoading(true);
    fetchProjects();
    fetchReferences();
  }, []);

  useEffect(() => {
      console.log('Row results updated:', rowResults);
      console.log('New size:', Object.keys(rowResults).length);
  }, [rowResults]); // This runs every time rowResults changes

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.data;

      setProjects(data);

      // Auto-select first project
      if (data.length > 0) {
        setNewRef(prev => ({
          ...prev,
          project_id: data[0].id
        }));
      }

    } catch (err) {
      console.error('Failed to load projects:', err);
      setErrorMessage('Failed to load projects.');
      setTimeout(() => {
        setErrorMessage('');
      }, 4000);
    }
  };

  const fetchReferences = async () => {
    try {
      const response = await axios.get('/api/references/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.data;

      setReferences(data);

    } catch (err) {
      console.error('Failed to load references:', err);
      setErrorMessage('Failed to load references.');
      setTimeout(() => {
        setErrorMessage('');
      }, 4000);

    } finally {
      setLoading(false);
    }
  };

  // Helper: Group slots into a grid [row][slot]
  const getGridData = (slots) => {
    const grid = {};
    slots.forEach(slot => {
      const [r, s] = slot.slotId.split('-');
      const rowIdx = parseInt(r.substring(1));
      const slotIdx = parseInt(s.substring(1));
      
      if (!grid[rowIdx]) grid[rowIdx] = {};
      grid[rowIdx][slotIdx] = slot;
    });
    return grid;
  };

  const handleRowAction = async (ref, action) => {
    if (action === 'inline-edit') {
      setEditingRowId(ref.ref_id);
      setEditRowBuffer({ ...ref });
      return;
    }

    try {
      const response = await axios.get(`/api/references/${ref.ref_id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const fullReference = await response.data;

      setSelectedRef(fullReference);
      setEditBuffer(JSON.parse(JSON.stringify(fullReference)));

      setActiveView('detail');
      setDetailMode(action === 'view' ? 'preview' : 'edit');

    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to load reference details.');
      setTimeout(() => {
        setErrorMessage('');
      }, 4000);
    }
  };

  const saveInlineEdit = async () => {
    try {
      const response = await axios.put(
        `/api/references/${editingRowId}`,
        {
          new_project_id: Number(editRowBuffer.project_id)
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const updated = await response.data;

      setReferences(prev =>
        prev.map(r => (r.ref_id === editingRowId ? updated : r))
      );

      setEditingRowId(null);
      setEditRowBuffer(null);

      setSuccessMessage('Reference updated successfully.');

      setTimeout(() => {
        setSuccessMessage('');
      }, 4000);

    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to update reference.');
      setTimeout(() => {
        setErrorMessage('');
      }, 4000);
    }
  };

  const handleCellChange = (rowIdx, slotIdx, field, newValue) => {
    setEditBuffer(prev => ({
      ...prev,
      slots: prev.slots.map(slot => {
        const [r, s] = slot.slotId.split('-');

        const currentRow = parseInt(r.substring(1));
        const currentSlot = parseInt(s.substring(1));

        if (currentRow === rowIdx && currentSlot === slotIdx) {
          return {
            ...slot,
            [field]: newValue
          };
        }

        return slot;
      })
    }));
  };

  const calculateChanges = () => {
    const changes = [];
    editBuffer.slots.forEach((newSlot, idx) => {
      const oldSlot = selectedRef.slots[idx];
      if (newSlot.amperage !== oldSlot.amperage) {
        changes.push({
          slot: newSlot.slotId,
          field: 'AMP',
          from: oldSlot.amperage,
          to: newSlot.amperage
        });
      }
      if (newSlot.identification_id !== oldSlot.identification_id) {
        changes.push({
          slot: newSlot.slotId,
          field: 'ID',
          from: oldSlot.identification_id,
          to: newSlot.identification_id
        });
      }
    });
    setPendingChanges(changes);
    setDetailMode('confirm');
  };

  const saveEditedReference = async () => {
    try {
      const response = await axios.put(
        `/api/references/${selectedRef.ref_id}/slots`,
        editBuffer,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const updatedReference = await response.data;

      setReferences(prev =>
        prev.map(r =>
          r.ref_id === updatedReference.ref_id ? updatedReference : r
        )
      );

      setActiveView('list');
      setDetailMode('preview');

    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to save changes.');
      setTimeout(() => {
        setErrorMessage('');
      }, 4000);

    }
  };

  const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB
  const ALLOWED_TYPES = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel"
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];

    if (!file) {
      setFormError("Please select a file");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFormError("Only Excel files (.xlsx, .xls) are allowed");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFormError("File size must be less than 6MB");
      return;
    }

    setSelectedFile(file);
  };

  const finalizeAdd = async () => {
    try {
      setIsUploading(true);

      const formData = new FormData();

      formData.append('project_id', newRef.project_id);
      formData.append('ref_code', newRef.ref_id);
      if (creationMethod === 'camera') {
        formData.append('row_Results', Object.keys(rowResults).length > 0 ? JSON.stringify(rowResults) : '');
      } else if (creationMethod === 'excel') {  
        formData.append('file', selectedFile);
      }

      const response = await axios.post(
        '/api/references/',
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const createdReference = await response.data;

      setReferences(prev => [createdReference, ...prev]);

      setActiveView('list');

      setNewRef({
        ref_id: '',
        project_id: projects[0]?.id || '',
        slots: []
      });

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setSuccessMessage('Reference added successfully.');

      setTimeout(() => {
        setSuccessMessage('');
      }, 4000);

    } catch (err) {
      setErrorMessage('Failed to add reference.');
      setTimeout(() => {
        setErrorMessage('');
      }, 4000);

    } finally {
      setIsUploading(false);
    }
  };

  const deleteRef = async (id) => {
    try {
      const response = await axios.delete(
        `/api/references/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.data) {
        throw new Error('Failed to delete reference');
      }

      setReferences(prev => prev.filter(r => r.ref_id !== id));

      setDeleteConfirmId(null);

      setSuccessMessage('Reference deleted successfully.');

      setTimeout(() => {
        setSuccessMessage('');
      }, 4000);

    } catch (err) {
      setErrorMessage('Failed to delete reference.');
      setTimeout(() => {
        setErrorMessage('');
      }, 4000);
    }
  };

  const allSlotNumbers = [
    ...new Set(
      (editBuffer?.slots || []).map(slot => {
        const slotId = slot.slotId;
        const [, s] = slotId.split('-');
        return parseInt(s.substring(1));
      })
    )
  ].sort((a, b) => a - b);


  const addNewProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      setIsAddingProject(true);

      const response = await axios.post(
        '/api/projects/',
        {
          projectName: newProjectName
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const createdProject = await response.data;

      // Add to dropdown list
      setProjects(prev => [...prev, createdProject]);

      // Auto-select newly created project
      setNewRef(prev => ({
        ...prev,
        project_id: createdProject.project_id
      }));

      // Reset UI
      setNewProjectName('');
      setShowNewProjectInput(false);

    } catch (err) {
      setErrorMessage('Failed to create project.');
      setTimeout(() => {
        setErrorMessage('');
      }, 4000);

    } finally {
      setIsAddingProject(false);
    }
  };
  

  const downloadTemplate = async () => {
    try {
      const response = await axios.get(
        '/api/references/template',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          // IMPORTANT: Tell Axios to handle the response as binary data
          responseType: 'blob' 
        }
      );

      // In Axios with responseType 'blob', the blob is already in response.data
      const blob = response.data;

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = url;
      link.download = 'reference_template.xlsx';

      // Append to body, click it, and remove it
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Clean up the URL object to free memory
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setErrorMessage('Failed to download template.');
      setTimeout(() => {
        setErrorMessage('');
      }, 4000);
    }
  };

  
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
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                <span>{errorMessage}</span>

                <button
                  onClick={() => setErrorMessage('')}
                  className="text-red-300 hover:text-white transition"
                >
                  ✕
                </button>
              </motion.div>
            )}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 flex items-center justify-between rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400"
              >
                <span>{successMessage}</span>

                <button
                  onClick={() => setSuccessMessage('')}
                  className="text-green-300 hover:text-white transition"
                >
                  ✕
                </button>
              </motion.div>
            )}
            <div className="bg-[#16191E] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
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
              </div> */}
              
              {/* Main Table Container */}
              {/* Loading state */}
              {loading ? (
                <div className="p-6 text-center text-white/40 text-sm">
                  Loading references...
                </div>
              ) : (

                <div className="overflow-x-auto touch-pan-x">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 p-4">

                    {/* SEARCH by Reference ID */}
                    <input
                      type="text"
                      placeholder="Search Reference ID..."
                      value={refSearch}
                      onChange={(e) => {
                        setRefSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full md:w-64 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none focus:border-blue-500"
                    />

                    {/* PROJECT FILTER */}
                    <select
                      value={projectFilter}
                      onChange={(e) => {
                        setProjectFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                    >
                      <option value="all" className='text-black'>All Projects</option>
                      {projects.map(p => (
                        <option key={p.project_id} value={p.project_id} className='text-black'>
                          {p.projectName}
                        </option>
                      ))}
                    </select>

                    {/* CREATED BY FILTER */}
                    <select
                      value={createdByFilter}
                      onChange={(e) => {
                        setCreatedByFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                    >
                      <option value="all" className='text-black'>All Creators</option>
                      {[...new Set(references.map(r => r.created_by_name || r.created_by))].map(name => (
                        <option key={name} value={name} className='text-black'>
                          {name}
                        </option>
                      ))}
                    </select>

                    {/* RESET */}
                    <button
                      onClick={() => {
                        setRefSearch('');
                        setProjectFilter('all');
                        setCreatedByFilter('all');
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm"
                    >
                      Reset
                    </button>

                  </div>
                  <table className="min-w-[1100px] w-full text-left border-collapse">
                    
                    {/* HEADER */}
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02]">
                        <th className="px-6 py-4 min-w-[160px] text-[11px] font-bold uppercase text-white/50 tracking-wider">
                          Reference ID
                        </th>

                        <th className="px-6 py-4 min-w-[160px] text-[11px] font-bold uppercase text-white/50 tracking-wider">
                          Project
                        </th>

                        <th className="px-6 py-4 min-w-[160px] text-[11px] font-bold uppercase text-white/50 tracking-wider">
                          Date Created
                        </th>

                        <th className="px-6 py-4 min-w-[160px] text-[11px] font-bold uppercase text-white/50 tracking-wider">
                          Created By
                        </th>

                        <th className="px-6 py-4 min-w-[160px] text-[11px] font-bold uppercase text-white/50 tracking-wider">
                          Email
                        </th>

                        <th className="px-6 py-4 min-w-[160px] text-[11px] font-bold uppercase text-white/50 tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    {/* BODY */}
                    <tbody className="divide-y divide-white/[0.05]">

                      {!loading && filteredRefs.length > 0 && (
                        paginatedRefs.map(ref => {
                          const isEditing = editingRowId === ref.ref_id;

                          return (
                            <tr
                              key={ref.ref_id}
                              className={`transition-colors ${
                                isEditing ? 'bg-blue-600/10' : 'hover:bg-white/[0.02]'
                              }`}
                            >

                              {/* Reference ID */}
                              <td className="px-6 py-4 font-mono text-sm text-blue-400">
                                {ref.ref_id}
                              </td>

                              {/* Project */}
                              <td className="px-6 py-4">
                                {isEditing ? (
                                  <select
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                                    value={editRowBuffer.project_id}
                                    onChange={(e) =>
                                      setEditRowBuffer({
                                        ...editRowBuffer,
                                        project_id: Number(e.target.value),
                                      })
                                    }
                                  >
                                    {projects.map((p) => (
                                      <option
                                        key={p.project_id}
                                        value={p.project_id}
                                        className="bg-[#16191E]"
                                      >
                                        {p.projectName}
                                      </option>
                                    ))}
                                  </select>

                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-white/80">
                                      {projects.find(p => p.project_id === ref.project_id)?.projectName || 'General'}
                                    </span>
                                  </div>
                                )}

                              </td>

                              {/* Date */}
                              <td className="px-6 py-4 text-sm text-white/40 font-mono">
                                {new Date(ref.created_at).toLocaleDateString()}
                              </td>

                              {/* Created By */}
                              <td className="px-6 py-4 text-sm text-white/70">
                                {ref.created_by_name || ref.created_by}
                              </td>

                              {/* Email */}
                              <td className="px-6 py-4 text-sm text-white/40 truncate max-w-[200px]">
                                {ref.email}
                              </td>

                              {/* Actions */}
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">

                                  {/* NORMAL MODE */}
                                  {!isEditing ? (
                                    <>
                                      {/* VIEW */}
                                      <button
                                        onClick={() => handleRowAction(ref, 'view')}
                                        className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"
                                        title="View"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>

                                      {/* EDIT */}
                                      <button
                                        onClick={() => {
                                          setEditingRowId(ref.ref_id);
                                          setEditRowBuffer({
                                            ...ref,
                                            project_id: ref.project_id
                                          });
                                        }}
                                        className="p-2 hover:bg-blue-500/20 rounded-lg text-white/40 hover:text-blue-400 transition-all"
                                        title="Edit"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>

                                      {/* DELETE */}
                                      <button
                                        onClick={() => setDeleteConfirmId(ref.ref_id)}
                                        className="p-2 hover:bg-red-500/20 rounded-lg text-white/40 hover:text-red-400 transition-all"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    /* EDIT MODE */
                                    <>
                                      {/* SAVE */}
                                      <button
                                        onClick={saveInlineEdit}
                                        className="p-2 hover:bg-green-500/20 rounded-lg text-green-400 transition-all"
                                        title="Save"
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                      </button>

                                      {/* CANCEL */}
                                      <button
                                        onClick={() => {
                                          setEditingRowId(null);
                                          setEditRowBuffer(null);
                                        }}
                                        className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"
                                        title="Cancel"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}

                                </div>
                              </td>

                            </tr>
                          );
                        })
                      )}

                    </tbody>
                  </table>
                  <div className="min-w-[1100px] flex items-center justify-between px-4 py-3 border-t border-white/5 bg-white/[0.01]">
    
                    <div className="text-xs text-white/40">
                      Page {currentPage} of {totalPages || 1}
                    </div>

                    <div className="flex items-center gap-2">
                      
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30"
                      >
                        Prev
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-xs rounded-lg transition ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white/5 hover:bg-white/10 text-white/70'
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className="px-3 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30"
                      >
                        Next
                      </button>

                    </div>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!loading && filteredRefs.length === 0 && (
                <div className="p-6 text-center text-white/40 text-sm">
                  No references found.
                </div>
              )}
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

              {formError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </motion.div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest block mb-2 font-bold">
                    Select Project
                  </label>

                  <select
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white/40 outline-none focus:border-blue-500 transition-all font-medium appearance-none"
                    value={newRef.project_id}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setShowNewProjectInput(true);
                        return;
                      }

                      setNewRef({
                        ...newRef,
                        project_id: e.target.value
                      });
                    }}
                  >
                    <option className='text-black' value="">
                      -- Choose a project --
                    </option>

                    {projects.map(p => (
                      <option className='text-black'
                        key={p.project_id}
                        value={p.project_id}
                      >
                        {p.projectName}
                      </option>
                    ))}

                    <option className='text-blue-500' value="__new__">
                      + Add New Project
                    </option>
                  </select>
                </div>

                

                {showNewProjectInput && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 mt-4"
                  >
                    <input
                      type="text"
                      placeholder="Enter new project name..."
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-medium"
                    />

                    <button
                      type="button"
                      onClick={addNewProject}
                      disabled={isAddingProject || !newProjectName.trim()}
                      className="px-5 py-4 bg-green-600 hover:bg-green-500 disabled:bg-white/5 disabled:text-white/20 rounded-xl font-bold transition-all whitespace-nowrap"
                    >
                      {isAddingProject ? 'Adding...' : 'Add To List'}
                    </button>
                  </motion.div>
                )}

                <div>
                  <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest block mb-2 font-bold">Reference ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g., REF-2026-001"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-medium"
                    value={newRef.ref_id}
                    onChange={(e) => setNewRef({ ...newRef, ref_id: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest block">
                    Creation Method
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    
                    <button
                      type="button"
                      onClick={() => setCreationMethod('excel')}
                      className={`p-4 rounded-xl border transition-all ${
                        creationMethod === 'excel'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-white/10 bg-white/[0.02]'
                      }`}
                    >
                      Upload Excel
                    </button>

                    <button
                      type="button"
                      onClick={() => setCreationMethod('camera')}
                      className={`p-4 rounded-xl border transition-all ${
                        creationMethod === 'camera'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-white/10 bg-white/[0.02]'
                      }`}
                    >
                      Capture Images
                    </button>

                  </div>
                </div>

                {creationMethod === 'excel' ? (

  /* =========================
      EXCEL UPLOAD UI
  ========================== */

  <div>
    <div className="flex items-center justify-between mb-2">
      <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-bold">
        Excel Data File
      </label>

      <button
        type="button"
        onClick={downloadTemplate}
        className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
      >
        <Info className="w-3 h-3" />
        Get Template
      </button>
    </div>

    <div
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
        selectedFile
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

      {selectedFile ? (
        <>
          <CheckCircle2 className="w-10 h-10 text-green-500" />
          <span className="text-sm text-green-400 font-bold">
            {selectedFile.name} Uploaded Successfully
          </span>
        </>
      ) : (
        <>
          <Upload className="w-10 h-10 text-white/20" />

          <div className="text-center">
            <p className="font-bold text-blue-500">
              Click to upload
            </p>

            <p className="text-[10px] text-white/20 mt-1 uppercase font-mono">
              XLSX, CSV
            </p>
          </div>
        </>
      )}
    </div>
  </div>

                ) : (

                  /* =========================
                      CAMERA WORKFLOW UI
                  ========================== */

                  <div className="space-y-6">

                    {/* STEP 1 */}
                    <div className="bg-[#111418] border border-white/10 rounded-2xl p-6 space-y-4">

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                          <Layout className="w-5 h-5 text-blue-400" />
                        </div>

                        <div>
                          <h4 className="font-bold text-lg">
                            Step 1 — Capture Full Panel
                          </h4>

                          <p className="text-sm text-white/40">
                            Take a picture of the complete electrical panel.
                          </p>
                        </div>
                      </div>

                      {rowCount > 0 ? (
                        <p className="text-green-400 font-mono">
                          {rowCount} rows detected ✓
                        </p>
                      ) : (
                        <button
                            type="button"
                            onClick={() => {
                              setCameraMode('panel');
                              setShowCamera(true);
                            }}
                          className="w-full border-2 border-dashed border-white/10 hover:border-blue-500/30 transition-all rounded-2xl p-10 flex flex-col items-center justify-center gap-4 bg-white/[0.02]"
                        >
                          <Upload className="w-10 h-10 text-white/20" />

                          <div className="text-center">
                            <p className="font-bold text-blue-400">
                              Capture Full Panel
                            </p>

                            <p className="text-[10px] uppercase font-mono text-white/20 mt-1">
                              Open Camera
                            </p>
                          </div>
                        </button>
                      )}

                    </div>

                    {/* STEP 2 */}
                    <div className="bg-[#111418] border border-white/10 rounded-2xl p-6 space-y-4">

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                          <Table className="w-5 h-5 text-purple-400" />
                        </div>

                        <div>
                          <h4 className="font-bold text-lg">
                            Step 2 — Capture Rows
                          </h4>

                          <p className="text-sm text-white/40">
                            Capture each detected row individually.
                          </p>
                        </div>
                      </div>

                      {rowCount == 0 ? (
                        <div className="border border-white/5 rounded-xl p-6 bg-black/20 text-center text-white/30 text-sm">
                          Waiting for panel analysis...
                        </div>
                      ) : (

                        <div>
                          {processingRows.size === 0 && Object.keys(rowResults).length === 0 ? (
                            <button
                                type="button"
                                onClick={() => {
                                  setCameraMode('row');
                                  setShowCamera(true);
                                }}
                              className="w-full border-2 border-dashed border-white/10 hover:border-blue-500/30 transition-all rounded-2xl p-10 flex flex-col items-center justify-center gap-4 bg-white/[0.02]"
                              >
                                <Upload className="w-10 h-10 text-white/20" />

                                <div className="text-center">
                                  <p className="font-bold text-blue-400">
                                    Capture Rows
                                  </p>

                                  <p className="text-[10px] uppercase font-mono text-white/20 mt-1">
                                    Open Camera
                                  </p>
                                </div>
                            </button>
                          ) : Object.keys(rowResults).length != rowCount ? (
                              <div className="flex flex-col items-center justify-center h-64 gap-4">
                                <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
                                <p className="font-mono text-white/50 uppercase tracking-widest text-sm">
                                  Finalising results...
                                </p>
                                <p className="text-xs text-white/30 font-mono">
                                  {processingRows.size} row{processingRows.size !== 1 ? 's' : ''} still processing
                                </p>
                              </div>
                          ) : (
                              <p className="text-green-400 font-mono">
                                rows processed ✓
                              </p>

                          )}
                        </div>
                      
                      )}

                    </div>

                    {/* STEP 3
                    <div className="bg-[#111418] border border-white/10 rounded-2xl p-6 space-y-4 opacity-50">

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        </div>

                        <div>
                          <h4 className="font-bold text-lg">
                            Step 3 — Review Extracted Data
                          </h4>

                          <p className="text-sm text-white/40">
                            Verify extracted IDs and amperages before saving.
                          </p>
                        </div>
                      </div>

                      <div className="border border-white/5 rounded-xl p-6 bg-black/20 text-center text-white/30 text-sm">
                        No extracted data yet
                      </div>

                    </div> */}

                  </div>

                )}
              </div>

              <button 
                disabled={!newRef.ref_id || !newRef.project_id || (!selectedFile && creationMethod === 'excel') || (creationMethod === 'camera' && Object.keys(rowResults).length !== rowCount)}
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
                    <h4 className="font-bold">Preview: {selectedRef?.ref_id}</h4>
                    <p className="text-[10px] text-white/40 uppercase font-mono tracking-widest">{selectedRef?.ref_id}</p>
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
                      <table className="border-collapse border border-white/5 text-[11px] font-mono table-fixed min-w-max">
                        <thead>
                          <tr className="bg-white/[0.03]">
                            <th className="border border-white/5 p-3 text-center uppercase font-bold text-white/40 bg-white/[0.02]">Row</th>
                            {allSlotNumbers.map(sNum => (
                              <th key={sNum} colSpan={2} className="border border-white/5 p-3 text-center uppercase font-bold text-white/40">S{sNum}</th>
                            ))}
                          </tr>
                          <tr className="bg-white/[0.01]">
                            <th className="border border-white/5 p-2 w-28 min-w-[7rem] bg-white/[0.02]"></th>
                            {allSlotNumbers.map(sNum => (
                              <React.Fragment key={sNum}>
                                <th className="border border-white/5 p-2 w-28 min-w-[7rem] text-center text-white/30 text-[9px]">ID</th>
                                <th className="border border-white/5 p-2 w-28 min-w-[7rem] text-center text-white/30 text-[9px]">AMP</th>
                              </React.Fragment>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(getGridData(editBuffer?.slots || [])).map(([rowIdx, rowSlots]) => (
                            <tr key={rowIdx} className="hover:bg-white/[0.01] transition-colors">
                              <td className="border border-white/5 p-3 text-center font-bold text-white/40 bg-white/[0.02]">{rowIdx}</td>
                              {allSlotNumbers.map(slotIdx => {
                                const slot = rowSlots[slotIdx];
                                if (!slot) return (
                                  <React.Fragment key={slotIdx}>
                                    <td className="border border-white/5 p-2 w-28 min-w-[7rem] text-center bg-black/20"></td>
                                    <td className="border border-white/5 p-2 w-28 min-w-[7rem] text-center bg-black/20"></td>
                                  </React.Fragment>
                                );
                                return (
                                  <React.Fragment key={slotIdx}>
                                    <td className={`border border-white/5 p-2 w-28 min-w-[7rem] text-center text-center ${detailMode === 'edit' ? 'bg-blue-600/5' : ''}`}>
                                      {detailMode === 'edit' ? (
                                        <input 
                                          type="text" 
                                          className="w-full bg-transparent text-center outline-none focus:text-blue-400"
                                          value={slot.identification_id}
                                          onChange={(e) => handleCellChange(parseInt(rowIdx), slotIdx, 'identification_id', e.target.value)}
                                        />
                                      ) : (
                                        slot.identification_id
                                      )}
                                    </td>
                                    <td className={`border border-white/5 p-2 w-28 min-w-[7rem] text-center text-center ${detailMode === 'edit' ? 'bg-blue-600/5' : ''}`}>
                                      {detailMode === 'edit' ? (
                                        <input 
                                          type="text" 
                                          className="w-full bg-transparent text-center outline-none focus:text-blue-400"
                                          value={slot.amperage}
                                          onChange={(e) => handleCellChange(parseInt(rowIdx), slotIdx, 'amperage', e.target.value)}
                                        />
                                      ) : (
                                        slot.amperage
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

      {showCamera && (
        <CameraScreen
          selectedReference={{
            name: newRef.ref_id || 'New Reference'
          }}

          mode={cameraMode === 'panel' ? 'panel' : 'row'}

          rowIndex={currentRowIndex}

          rowCount={rowCount}

          processingRows={processingRows}

          rowResults={rowResults}

          currentRowIndex={currentRowIndex}

          isAnalyzing={isAnalyzing}

          rowCaptureError={null}

          onClearError={() => {}}

          onBack={() => {
            setShowCamera(false);
          }}

          onCapture={async (imageData) => {

            try {

              if (cameraMode === 'panel') {
                setIsAnalyzing(true);

                const blob = imageDataToBlob(imageData);
                const formData = new FormData();
                formData.append("file", blob, "overview.jpg");

                const response = await axios.post(
                  '/api/references/scan-layout',
                  formData,
                  {
                    headers: {
                      "Content-Type": "multipart/form-data",
                      Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                  }
                );

                // setOverviewImage(
                //   `data:image/jpeg;base64,${response.data.image_base64}`
                // );

                // setPositionMap(response.data.position_map);

                console.log('Detected row count:', response.data);
                setRowCount(response.data);

                setShowCamera(false);

              } else {

                const rowIndex = currentRowIndex;
                
                // Advance user to next row IMMEDIATELY — don't wait for API
                if (rowIndex < rowCount) {
                  setCurrentRowIndex(rowIndex + 1);
                } else {
                  setShowCamera(false);
                }
            
                setProcessingRows(prev => new Set(prev).add(rowIndex));
            
                const processRow = async () => {
                  try {
                    const blob = imageDataToBlob(imageData);
                    const formData = new FormData();
                    formData.append("file", blob, `row_${rowIndex}.jpg`);

                    const response = await axios.post(
                      `/api/references/extract-row-data/${rowIndex}`,
                      formData,
                      {
                        headers: {
                          "Content-Type": "multipart/form-data",
                          Authorization: `Bearer ${localStorage.getItem('token')}`
                        }
                      }
                    );
                    console.log("response: ", response.data);
            
                    if (response.data.status === "INVALID_IMAGE") {
                      //setRowCaptureError(`Row ${rowIndex}: No components detected, please retake.`);
                      // Put user back to this row
                      setCurrentRowIndex(rowIndex);
                      // navigate('/row-capture');
                      return;
                    }
            
                    //setRowCaptureError(null);
                    setRowResults(prev => ({
                      ...prev,
                      [rowIndex]: response.data.validation_results
                    }));
            
                  } catch (err) {
                    console.error(`Row ${rowIndex} failed:`, err);
                    //setRowCaptureError(`Row ${rowIndex}: Something went wrong, please retake.`);
                    setCurrentRowIndex(rowIndex);
                    // navigate('/row-capture');
                  } finally {
                    setProcessingRows(prev => {
                      const next = new Set(prev);
                      next.delete(rowIndex);
                      return next;
                    });
                  }
                };
            
                processRow(); // fire and forget — no await;
              }

            } catch (err) {

              console.error(err);

            } finally {

              setIsAnalyzing(false);

            }
          }}
        />
      )}
    </div>
  );
}