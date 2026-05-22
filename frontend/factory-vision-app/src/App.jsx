import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import Header from './components/Header';
import SelectionScreen from './components/Controller/SelectionScreen';
import CameraScreen from './components/Controller/CameraScreen';
import ResultsScreen from './components/Controller/ResultsScreen';
import axios from './api/api';
import { RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import AdminSpace from './components/admin/AdminSpace';
import LoginScreen from './components/LoginScreen';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vision_user');
    return saved ? JSON.parse(saved) : null;
  });  
  const [inspectionId, setInspectionId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedReference, setSelectedReference] = useState(null);
  const [overviewDimensions, setOverviewDimensions] = useState({ w: 0, h: 0 });
  
  // Overview
  const [overviewImage, setOverviewImage] = useState(null);   // shown in results
  const [rowCount, setRowCount] = useState(0);
  const [positionMap, setPositionMap] = useState({});         // R1-S1 -> bbox

  // Row capture pipeline
  const [currentRowIndex, setCurrentRowIndex] = useState(1);  // which row user is on
  const [rowResults, setRowResults] = useState({});           // { rowIndex: results[] }
  const [processingRows, setProcessingRows] = useState(new Set()); // rows in-flight
  const [rowCaptureError, setRowCaptureError] = useState(null);

  // Results
  const [allResults, setAllResults] = useState([]);


  useEffect(() => {
    if (user) {
      localStorage.setItem('vision_user', JSON.stringify(user));
      // Redirect based on role only if we are on the login page or root
      if (location.pathname === '/Login' || location.pathname === '/') {
        if (user.role === 'Admin') {
          navigate('/admin_space');
        } else {
          navigate('/Selection');
        }
      }
    } else {
      localStorage.removeItem('vision_user');
      if (location.pathname !== '/Login') {
        navigate('/Login');
      }
    }
  }, [user, navigate, location.pathname]);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_active_tab');
    localStorage.removeItem('token');
    setUser(null);
    setSelectedProject(null);
    setSelectedReference(null);
    setCapturedImage(null);
  };

  const startInspection = async () => {
    try {
      const response = await axios.post(
        '/api/inspections/start',
        {
          project_id: selectedProject.project_id,
          ref_id: selectedReference.ref_id
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setInspectionId(response.data.inspection_id);

      navigate('/overview-capture');

    } catch (err) {
      console.error(err);
      alert('Failed to start inspection');
    }
  }

  // ── Step 1: user captures overview photo ──────────────────────────────────
  const handleOverviewCapture = async (imageData) => {
    
    navigate('/overview-processing');

    const blob = imageDataToBlob(imageData);
    const formData = new FormData();
    formData.append("file", blob, "overview.jpg");

    let response;
    try {

      response = await axios.post(
        `/api/inspections/${inspectionId}/panel`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

    } catch (err) {
      console.error(err);
      alert('Failed to upload panel image');
      navigate('/overview-capture');
    }

    const base64Image = `data:image/jpeg;base64,${response.data.image_base64}`;
    setOverviewImage(base64Image);
    // setOverviewImage(imageData);
    setRowCount(response.data.row_count);
    setPositionMap(response.data.position_map);
    setOverviewDimensions({ w: response.data.image_width, h: response.data.image_height });
    setCurrentRowIndex(1);
    navigate('/overview-done');
  
  };

  // ── Step 2: user captures a row — fire and forget, move to next ───────────
  const handleRowCapture = async (imageData) => {
    const rowIndex = currentRowIndex;

    // Advance user to next row IMMEDIATELY — don't wait for API
    if (rowIndex < rowCount) {
      setCurrentRowIndex(rowIndex + 1);
    } else {
      navigate('/waiting-results');
    }

    setProcessingRows(prev => new Set(prev).add(rowIndex));

    const processRow = async () => {
      try {
        const blob = imageDataToBlob(imageData);
        const formData = new FormData();
        formData.append("file", blob, `row_${rowIndex}.jpg`);

        let response;

        try {
          response = await axios.post(
            `/api/inspections/${inspectionId}/rows/${rowIndex}`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
        } catch (err) {
          console.error(err);
          alert('Failed to upload row image');
          navigate('/row-capture');
          return;
        }

        if (response.data.status === "INVALID_IMAGE") {
          setRowCaptureError(`Row ${rowIndex}: No components detected, please retake.`);
          // Put user back to this row
          setCurrentRowIndex(rowIndex);
          navigate('/row-capture');
          return;
        }

        console.log(response.data);

        setRowCaptureError(null);
        setRowResults(prev => ({
          ...prev,
          [rowIndex]: response.data.validation_results
        }));


      } catch (err) {
        console.error(`Row ${rowIndex} failed:`, err);
        setRowCaptureError(`Row ${rowIndex}: Something went wrong, please retake.`);
        setCurrentRowIndex(rowIndex);
        navigate('/row-capture');
      } finally {
        setProcessingRows(prev => {
          const next = new Set(prev);
          next.delete(rowIndex);
          return next;
        });
      }
    };

    processRow(); // fire and forget — no await
  };

  // ── Watch for all results to arrive ───────────────────────────────────────
  useEffect(() => {
    const currentPath = location.pathname;

    if (
      (currentPath === '/waiting-results' ||
        currentPath === '/row-capture') &&
      rowCount > 0 &&
      processingRows.size === 0 &&
      Object.keys(rowResults).length === rowCount
    ) {
      // Flatten all row results and attach bboxes
      const flat = Object.values(rowResults)
        .flat()
        .map(item => ({
          ...item,
          bbox:
            item.status === 'FAIL'
              ? positionMap[item.slot_id] ?? null
              : null,
        }));

      setAllResults(flat);

      navigate('/Results');
    }
  }, [rowResults,processingRows,rowCount,positionMap,location.pathname,]);
  // ── Helper ─────────────────────────────────────────────────────────────────
  const imageDataToBlob = (imageData) => {
    const [header, base64] = imageData.split(',');
    const mimeType = header.match(/:(.*?);/)[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mimeType });
  };

  const reset = () => {
    navigate('/Selection');
    setOverviewImage(null);
    setRowCount(0);
    setPositionMap({});
    setCurrentRowIndex(1);
    setRowResults({});
    setProcessingRows(new Set());
    setAllResults([]);
    setInspectionId(null);
    setSelectedProject(null);
    setSelectedReference(null);
    setOverviewDimensions({ w: 0, h: 0 });
    setRowCaptureError(null);
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E2E8F0] font-sans">
      <Header 
        user={user} 
        onLogout={handleLogout}
        onAdminClick={() => navigate('/admin_space')} 
      />

      <main className="max-w-4xl mx-auto p-6">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>

            <Route path="/" element={<Navigate to={user ? (user.role === 'Admin' ? '/admin_space' : '/Selection') : '/Login'} replace />} />
            
            <Route path="/Login" element={!user ? <LoginScreen onLogin={handleLogin} /> : <Navigate to="/" replace />} />

            <Route 
              path="/admin_space" 
              element={
                user?.role === 'Admin' ? (
                  <AdminSpace onExit={handleLogout} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />

            <Route 
              path="/Selection" 
              element={
                <SelectionScreen 
                  selectedProject={selectedProject}
                  setSelectedProject={setSelectedProject}
                  selectedReference={selectedReference}
                  setSelectedReference={setSelectedReference}
                  onStartCamera={startInspection}
                />
              } 
            />

            {/* Overview capture — full panel shot */}
            <Route
              path="/overview-capture"
              element={
                <CameraScreen
                  mode="overview"
                  label="Capture Full Panel"
                  onBack={() => navigate('/Selection')}
                  onCapture={handleOverviewCapture}
                />
              }
            />

            {/* Brief processing screen while overview is being analysed */}
            <Route
              path="/overview-processing"
              element={
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
                    <p className="font-mono text-white/50 uppercase tracking-widest text-sm">
                      Counting rows...
                    </p>
                  </div>
              }
            />

            <Route
              path="/overview-done"
              element={
                <motion.div
                  key="overview-done"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center gap-8 py-20"
                >
                  <div className="w-20 h-20 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                    <span className="text-3xl font-bold text-blue-400">{rowCount}</span>
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">
                      {rowCount} Row{rowCount !== 1 ? 's' : ''} Detected
                    </h2>
                    <p className="text-white/40 text-sm font-mono">
                      You will now capture each row one by one
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/row-capture')}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold tracking-widest uppercase transition-all shadow-lg shadow-blue-900/30"
                  >
                    Start
                  </button>
                </motion.div>
              }
            />

            {/* Row-by-row capture */}
            <Route
              path="/row-capture"
              element={
                <CameraScreen
                  mode="row"
                  label={`Row ${currentRowIndex} of ${rowCount}`}
                  rowIndex={currentRowIndex}
                  rowCount={rowCount}
                  processingRows={processingRows}
                  rowResults={rowResults}
                  rowCaptureError={rowCaptureError}
                  currentRowIndex={currentRowIndex}
                  onClearError={() => setRowCaptureError(null)}
                  onBack={() => navigate('/overview-capture')}
                  onCapture={handleRowCapture}
                />
              }
            />

            {/* All rows captured, waiting for last background jobs */}
            <Route
              path="/waiting-results"
              element={
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
                  <p className="font-mono text-white/50 uppercase tracking-widest text-sm">
                    Finalising results...
                  </p>
                  <p className="text-xs text-white/30 font-mono">
                    {processingRows.size} row{processingRows.size !== 1 ? 's' : ''} still processing
                  </p>
                </div>
              }
            />

            <Route 
              path="/Results" 
              element={
                <ResultsScreen 
                  inspectionResult={{
                    status: allResults.some(r => r.status === 'FAIL') ? 'Not Valid' : 'Valid',
                    details: allResults,
                    image_width: /* you need to store this from overview */ overviewDimensions.w,
                    image_height: overviewDimensions.h,
                  }}
                  capturedImage={overviewImage}
                  onRetake={() => navigate('/overview-capture')}
                  onReset={reset}
                />
              } 
            />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}