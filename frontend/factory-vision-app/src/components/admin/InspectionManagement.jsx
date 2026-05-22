import React, { useEffect, useState } from 'react';
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
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">

              {/* SEARCH by Reference ID */}
              <input
                type="text"
                placeholder="Search Reference ID..."
                value={inspSearch}
                onChange={(e) => {
                  setInspSearch(e.target.value);
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
                {[...new Set(inspections.map(i => i.project_name))].map(p => (
                  <option key={p} value={p} className='text-black'>{p}</option>
                ))}
              </select>

              {/* OPERATOR FILTER */}
              <select
                value={operatorFilter}
                onChange={(e) => {
                  setOperatorFilter(e.target.value);
                  setCurrentPage(1);
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
                  setCurrentPage(1);
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
                  setCurrentPage(1);
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

        {selectedInspection && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center">
                
                {/* backdrop */}
                <div
                className="absolute inset-0 bg-black/80"
                onClick={() => setSelectedInspection(null)}
                />

                {/* modal */}
                <div className="relative w-[90%] max-w-6xl bg-[#0F1115] border border-white/10 rounded-2xl p-6 overflow-y-auto max-h-[90vh]">
                
                {/* header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">
                    Inspection #{inspectionReport?.inspection_id}
                    </h2>

                    <button
                    onClick={() => setSelectedInspection(null)}
                    className="text-white/60 hover:text-white"
                    >
                    ✕
                    </button>
                </div>

                {loadingReport || !inspectionReport ? (
                    <p className="text-white/40">Loading...</p>
                ) : (
                    <>
                    <p className="mb-4 text-sm">
                        Verdict:{" "}
                        <span className={
                        inspectionReport.verdict === "VALID"
                            ? "text-green-400"
                            : "text-red-400"
                        }>
                        {inspectionReport.verdict}
                        </span>
                    </p>

                    {/* IMAGE + OVERLAY */}
                    <div className="relative inline-block w-full mb-8">
                        <img
                        src={`data:image/jpeg;base64,${inspectionReport.panel_image}`}
                        className="max-h-[500px] mx-auto"
                        alt="panel"
                        />

                        {/* (optional later: reuse bbox overlay like ResultScreen) */}
                    </div>

                    {/* FAILURES TABLE */}
                    <div className="bg-[#16191E] border border-white/5 rounded-xl overflow-x-auto">
                        <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-white/[0.02]">
                            <th className="p-3">Slot</th>
                            <th className="p-3">Scanned ID</th>
                            <th className="p-3">Scanned Calibre</th>
                            <th className="p-3">Message</th>
                            </tr>
                        </thead>

                        <tbody>
                            {inspectionReport.failed_slots?.map((slot) => (
                            <tr key={slot.slot_id} className="border-t border-white/5">
                                <td className="p-3">{slot.slot_id}</td>
                                <td className="p-3">{slot.scanned_identification}</td>
                                <td className="p-3">{slot.scanned_calibre}</td>
                                <td className="p-3 text-white/60">{slot.message}</td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>

                    </>
                )}
                </div>
            </div>
        )}

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