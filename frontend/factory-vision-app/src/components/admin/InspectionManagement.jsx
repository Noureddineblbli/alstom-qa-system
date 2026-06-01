import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Eye, Clock } from 'lucide-react';
import axios from '../../api/api';

export default function InspectionManagement() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedInspection, setSelectedInspection] = useState(null);
  const [inspectionReport, setInspectionReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  
  // Filter states
  const [inspSearch, setInspSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [verdictFilter, setVerdictFilter] = useState('all');

  // Pagination states 
  const [inspectionPage, setInspectionPage] = useState(1);
  const INSPECTIONS_PER_PAGE = 10;

  const filteredInspections = inspections.filter(ins => {
    const matchesSearch =
      ins.reference_id.toLowerCase().includes(inspSearch.toLowerCase());

    const matchesProject =
      projectFilter === 'all' || ins.project_name === projectFilter;

    const matchesOperator =
      operatorFilter === 'all' || ins.operator_name === operatorFilter;

    const matchesVerdict =
      verdictFilter === 'all' || ins.verdict === verdictFilter;

    return matchesSearch && matchesProject && matchesOperator && matchesVerdict;
  });

  const totalInspectionPages = Math.ceil(filteredInspections.length / INSPECTIONS_PER_PAGE);

  const paginatedInspections = filteredInspections.slice(
    (inspectionPage - 1) * INSPECTIONS_PER_PAGE,
    inspectionPage * INSPECTIONS_PER_PAGE
  );

  useEffect(() => {
    setInspectionPage(1);
  }, [inspections]);

  useEffect(() => {
    if (inspectionPage > totalInspectionPages) {
      setInspectionPage(1);
    }
  }, [filteredInspections]);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/inspections/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setInspections(response.data);
    } catch (err) {
      console.error('Failed to fetch inspections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const openInspectionDetails = async (inspection_id) => {
    try {
      setLoadingReport(true);
      setSelectedInspection(inspection_id);
      const res = await axios.get(
        `/api/inspections/${inspection_id}/report`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setInspectionReport(res.data);
    } catch (err) {
      console.error("Failed to load inspection report:", err);
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold">Inspection Management</h3>
        <p className="text-sm text-white/40">
          View and monitor all inspection sessions.
        </p>
      </div>

      {/* Table */}
      <div className="bg-[#16191E] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-white/40 text-sm">
            Loading inspections...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4 p-4">
              {/* SEARCH by Reference ID */}
              <input
                type="text"
                placeholder="Search Reference ID..."
                value={inspSearch}
                onChange={(e) => {
                  setInspSearch(e.target.value);
                  setInspectionPage(1);
                }}
                className="w-full md:w-64 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none focus:border-blue-500"
              />

              {/* PROJECT FILTER */}
              <select
                value={projectFilter}
                onChange={(e) => {
                  setProjectFilter(e.target.value);
                  setInspectionPage(1);
                }}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
              >
                <option value="all" className='text-black'>All Projects</option>
                {[...new Set(inspections.map(i => i.project_name))].map(p => (
                  <option key={p} value={p} className='text-black'>{p}</option>
                ))}
              </select>

              {/* OPERATOR FILTER */}
              <select
                value={operatorFilter}
                onChange={(e) => {
                  setOperatorFilter(e.target.value);
                  setInspectionPage(1);
                }}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
              >
                <option value="all" className='text-black'>All Operators</option>
                {[...new Set(inspections.map(i => i.operator_name))].map(op => (
                  <option key={op} value={op} className='text-black'>{op}</option>
                ))}
              </select>

              {/* VERDICT FILTER */}
              <select
                value={verdictFilter}
                onChange={(e) => {
                  setVerdictFilter(e.target.value);
                  setInspectionPage(1);
                }}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
              >
                <option value="all" className='text-black'>All Verdicts</option>
                <option value="VALID" className='text-black'>VALID</option>
                <option value="INVALID" className='text-black'>INVALID</option>
              </select>

              {/* RESET */}
              <button
                onClick={() => {
                  setInspSearch('');
                  setProjectFilter('all');
                  setOperatorFilter('all');
                  setVerdictFilter('all');
                  setInspectionPage(1);
                }}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm"
              >
                Reset
              </button>
            </div>  
            
            <table className="min-w-[1100px] w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="p-4 text-[10px] font-mono uppercase text-white/40">
                    Project Name
                  </th>
                  <th className="p-4 text-[10px] font-mono uppercase text-white/40">
                    Reference ID
                  </th>
                  <th className="p-4 text-[10px] font-mono uppercase text-white/40">
                    Controller
                  </th>
                  <th className="p-4 text-[10px] font-mono uppercase text-white/40">
                    Done At
                  </th>
                  <th className="p-4 text-[10px] font-mono uppercase text-white/40">
                    Verdict
                  </th>
                  <th className="p-4 text-[10px] font-mono uppercase text-white/40">
                    Total Errors
                  </th>
                  <th className="p-4 text-[10px] font-mono uppercase text-white/40 text-right">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {paginatedInspections.map((ins) => (
                  <motion.tr
                    key={ins.inspection_id}
                    layout
                    className="hover:bg-white/[0.01] transition-colors"
                  >
                    <td className="p-4 min-w-[180px] font-mono text-white/70">
                      {ins.project_name}
                    </td>
                    <td className="p-4 min-w-[160px]">
                      {ins.reference_id}
                    </td>
                    <td className="p-4 min-w-[160px]">
                      {ins.operator_name}
                    </td>
                    <td className="p-4 text-white/40 text-sm min-w-[220px]">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {new Date(ins.done_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4 min-w-[120px]">
                      <span
                        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          ins.verdict === 'VALID'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {ins.verdict}
                      </span>
                    </td>
                    <td className="p-4 font-mono min-w-[120px]">
                      {ins.total_errors}
                    </td>
                    <td className="p-4 text-right min-w-[100px]">
                      <button
                        className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-colors"
                        onClick={() => openInspectionDetails(ins.inspection_id)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {/* PAGINATION */}
            <div className="min-w-[1100px] flex items-center justify-between px-4 py-3 border-t border-white/5 bg-white/[0.01]">
              <div className="text-xs text-white/40">
                Page {inspectionPage} of {totalInspectionPages || 1}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={inspectionPage === 1}
                  onClick={() => setInspectionPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30"
                >
                  Prev
                </button>
                {Array.from({ length: totalInspectionPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setInspectionPage(page)}
                    className={`px-3 py-1 text-xs rounded-lg ${
                      inspectionPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  disabled={inspectionPage === totalInspectionPages}
                  onClick={() => setInspectionPage(p => Math.min(totalInspectionPages, p + 1))}
                  className="px-3 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal with bounding boxes */}
        <InspectionModal 
          selectedInspection={selectedInspection}
          inspectionReport={inspectionReport}
          loadingReport={loadingReport}
          onClose={() => setSelectedInspection(null)}
        />

        {/* Empty state */}
        {!loading && inspections.length === 0 && (
          <div className="p-6 text-center text-white/40 text-sm">
            No inspections found.
          </div>
        )}
      </div>
    </div>
  );
}

// Separate component for the modal with bounding boxes
function InspectionModal({ selectedInspection, inspectionReport, loadingReport, onClose }) {
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const rowRefs = useRef({});
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [imageNaturalDimensions, setImageNaturalDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateScale = () => {
      const img = imgRef.current;
      if (!img || !imageNaturalDimensions.width || !imageNaturalDimensions.height) return;
      
      // Calculate scale based on natural image dimensions vs displayed dimensions
      const displayWidth = img.offsetWidth;
      const displayHeight = img.offsetHeight;
      
      setScale({
        x: displayWidth / imageNaturalDimensions.width,
        y: displayHeight / imageNaturalDimensions.height,
      });
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [imageNaturalDimensions, inspectionReport]);

  const handleBoxClick = (slotId) => {
    setSelectedSlotId(prev => prev === slotId ? null : slotId);
    const rowElement = rowRefs.current[slotId];
    if (rowElement) {
      rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a temporary highlight effect
      rowElement.style.transition = 'all 0.3s ease';
      rowElement.style.backgroundColor = 'rgba(234, 179, 8, 0.2)';
      setTimeout(() => {
        rowElement.style.backgroundColor = '';
      }, 1500);
    }
  };

  // Debug logging to check coordinates
  useEffect(() => {
    if (inspectionReport?.failed_slots) {
      console.log('Image dimensions from API:', {
        width: inspectionReport.image_width,
        height: inspectionReport.image_height
      });
      console.log('Failed slots with bbox:', 
        inspectionReport.failed_slots
          .filter(slot => slot.bbox)
          .map(slot => ({
            slot_id: slot.slot_id,
            bbox: slot.bbox,
            where: slot.where
          }))
      );
    }
  }, [inspectionReport]);

  if (!selectedInspection) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* modal */}
      <div 
        ref={containerRef}
        className="relative w-[90%] max-w-6xl bg-[#0F1115] border border-white/10 rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
      >
        {/* header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            Inspection #{inspectionReport?.inspection_id}
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            ✕
          </button>
        </div>

        {loadingReport || !inspectionReport ? (
          <p className="text-white/40">Loading...</p>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm">
                Verdict:{" "}
                <span className={inspectionReport.verdict === "VALID" ? "text-green-400" : "text-red-400"}>
                  {inspectionReport.verdict}
                </span>
              </p>
              {inspectionReport.failed_slots?.length > 0 && (
                <p className="text-white/50 text-sm mt-1">
                  {inspectionReport.failed_slots.length} error{inspectionReport.failed_slots.length > 1 ? 's' : ''} — click a box to locate in table
                </p>
              )}
            </div>

            {/* IMAGE WITH OVERLAY BOXES */}
            <div className="space-y-3 mb-8">
              <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">
                Captured Frame
              </label>
              <div className="rounded-xl overflow-hidden border border-white/10 relative inline-flex w-full justify-center bg-black/20">
                <div className="relative inline-block">
                  <img
                    ref={imgRef}
                    src={`data:image/jpeg;base64,${inspectionReport.panel_image}`}
                    className="max-h-[500px] object-contain block"
                    alt="panel"
                    onLoad={(e) => {
                      const img = e.target;
                      // Get natural dimensions of the image
                      setImageNaturalDimensions({
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                      });
                      
                      // Calculate initial scale
                      if (inspectionReport.image_width && inspectionReport.image_height) {
                        const displayWidth = img.offsetWidth;
                        const displayHeight = img.offsetHeight;
                        setScale({
                          x: displayWidth / inspectionReport.image_width,
                          y: displayHeight / inspectionReport.image_height,
                        });
                      }
                    }}
                  />

                  {/* Render bounding boxes for failed slots */}
                  {inspectionReport.failed_slots
                    ?.filter(slot => slot.bbox !== null && slot.bbox !== undefined)
                    .flatMap(slot => {
                      const boxes = [];
                      const where = slot.where ?? [];

                      // Check if bbox coordinates exist and are valid
                      if (where.includes('sticker') && slot.bbox.sticker_x1 !== null && slot.bbox.sticker_x1 !== undefined) {
                        boxes.push({
                          slot_id: slot.slot_id,
                          key: `${slot.slot_id}-sticker`,
                          x1: slot.bbox.sticker_x1,
                          y1: slot.bbox.sticker_y1,
                          x2: slot.bbox.sticker_x2,
                          y2: slot.bbox.sticker_y2,
                          type: 'sticker'
                        });
                      }
                      
                      if (where.includes('switch') && slot.bbox.switch_x1 !== null && slot.bbox.switch_x1 !== undefined) {
                        boxes.push({
                          slot_id: slot.slot_id,
                          key: `${slot.slot_id}-switch`,
                          x1: slot.bbox.switch_x1,
                          y1: slot.bbox.switch_y1,
                          x2: slot.bbox.switch_x2,
                          y2: slot.bbox.switch_y2,
                          type: 'switch'
                        });
                      }

                      return boxes;
                    })
                    .map(box => {
                      const isSelected = selectedSlotId === box.slot_id;
                      
                      // Validate coordinates before rendering
                      if (box.x1 === undefined || box.y1 === undefined || 
                          box.x2 === undefined || box.y2 === undefined) {
                        console.warn('Invalid bbox coordinates for slot:', box.slot_id, box);
                        return null;
                      }

                      const left = box.x1 * scale.x;
                      const top = box.y1 * scale.y;
                      const width = (box.x2 - box.x1) * scale.x;
                      const height = (box.y2 - box.y1) * scale.y;

                      // Only render if dimensions are positive
                      if (width <= 0 || height <= 0) {
                        console.warn('Invalid box dimensions for slot:', box.slot_id, { width, height });
                        return null;
                      }

                      return (
                        <div
                          key={box.key}
                          onClick={() => handleBoxClick(box.slot_id)}
                          style={{
                            position: 'absolute',
                            left: `${left}px`,
                            top: `${top}px`,
                            width: `${width}px`,
                            height: `${height}px`,
                            boxSizing: 'border-box',
                          }}
                          className={`border-2 cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'border-yellow-400 bg-yellow-400/20'
                              : 'border-red-500 bg-red-500/10 hover:bg-red-500/20'
                          }`}
                          title={`${box.slot_id} - ${box.type} error`}
                        >
                          <span className={`absolute -top-2 left-0 text-[4px] font-mono px-0.5 leading-none whitespace-nowrap ${
                            isSelected ? 'bg-yellow-400 text-black' : 'bg-red-500 text-white'
                          }`}>
                            {box.slot_id}
                          </span>
                        </div>
                      );
                    })
                    .filter(box => box !== null) // Remove null boxes
                  }
                </div>
              </div>
            </div>

            {/* FAILURES TABLE */}
            <div className="space-y-3">
              <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">
                Failed Slots
              </label>
              <div className="bg-[#16191E] border border-white/5 rounded-xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5">
                      <th className="p-3 text-left font-mono text-[10px] uppercase text-white/40">Slot</th>
                      <th className="p-3 text-left font-mono text-[10px] uppercase text-white/40">Scanned ID</th>
                      <th className="p-3 text-left font-mono text-[10px] uppercase text-white/40">Expected ID</th>
                      <th className="p-3 text-left font-mono text-[10px] uppercase text-white/40">Scanned Calibre</th>
                      <th className="p-3 text-left font-mono text-[10px] uppercase text-white/40">Expected Calibre</th>
                      <th className="p-3 text-left font-mono text-[10px] uppercase text-white/40">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {inspectionReport.failed_slots?.map((slot) => (
                      <tr
                        key={slot.slot_id}
                        ref={el => { if (el) rowRefs.current[slot.slot_id] = el; }}
                        className={`transition-colors duration-300 cursor-pointer ${
                          selectedSlotId === slot.slot_id
                            ? 'bg-yellow-400/10 outline outline-1 outline-yellow-400/40'
                            : 'hover:bg-red-500/10'
                        }`}
                        onClick={() => handleBoxClick(slot.slot_id)}
                      >
                        <td className="p-3 font-medium">{slot.slot_id}</td>
                        <td className="p-3 font-mono">{slot.scanned_identification}</td>
                        <td className="p-3 font-mono">{slot.expected_identification || '-'}</td>
                        <td className="p-3 font-mono">{slot.scanned_calibre}</td>
                        <td className="p-3 font-mono">{slot.expected_calibre || '-'}</td>
                        <td className="p-3 text-white/60 text-xs">{slot.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}