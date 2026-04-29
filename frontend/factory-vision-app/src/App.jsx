import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import Header from './components/Header';
import SelectionScreen from './components/SelectionScreen';
import CameraScreen from './components/CameraScreen';
import ResultsScreen from './components/ResultsScreen';
import axios from './api/api';
import AuthPage from './components/AuthPage';
import { RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [step, setStep] = useState('SELECTION');
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

  // ── Step 1: user captures overview photo ──────────────────────────────────
  const handleOverviewCapture = async (imageData) => {
    setOverviewImage(imageData);
    setStep('OVERVIEW_PROCESSING');

    const blob = imageDataToBlob(imageData);
    const formData = new FormData();
    formData.append("file", blob, "overview.jpg");

    const response = await axios.post("/api/scan_overview", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });

    // const base64Image = `data:image/jpeg;base64,${response.data.image_base64}`;
    // setOverviewImage(base64Image);
    setRowCount(response.data.row_count);
    setPositionMap(response.data.position_map);
    setOverviewDimensions({ w: response.data.image_width, h: response.data.image_height });
    setCurrentRowIndex(1);
    setStep('OVERVIEW_DONE');
  };

  // ── Step 2: user captures a row — fire and forget, move to next ───────────
  const handleRowCapture = async (imageData) => {
    const rowIndex = currentRowIndex;

    // Advance user to next row IMMEDIATELY — don't wait for API
    if (rowIndex < rowCount) {
      setCurrentRowIndex(rowIndex + 1);
    } else {
      setStep('WAITING_RESULTS');
    }

    // Fire API call in background — no await here
    setProcessingRows(prev => new Set(prev).add(rowIndex));

    const processRow = async () => {
      try {
        const blob = imageDataToBlob(imageData);
        const formData = new FormData();
        formData.append("file", blob, `row_${rowIndex}.jpg`);
        formData.append("row_index", rowIndex);

        const response = await axios.post("/api/validate_row", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });

        if (response.data.status === "INVALID_IMAGE") {
          setRowCaptureError(`Row ${rowIndex}: No components detected, please retake.`);
          // Put user back to this row
          setCurrentRowIndex(rowIndex);
          setStep('ROW_CAPTURE');
          return;
        }

        setRowCaptureError(null);
        setRowResults(prev => ({
          ...prev,
          [rowIndex]: response.data.validation_results
        }));

      } catch (err) {
        console.error(`Row ${rowIndex} failed:`, err);
        setRowCaptureError(`Row ${rowIndex}: Something went wrong, please retake.`);
        setCurrentRowIndex(rowIndex);
        setStep('ROW_CAPTURE');
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
    if (
      (step === 'WAITING_RESULTS' || step === 'ROW_CAPTURE') &&
      rowCount > 0 &&
      processingRows.size === 0 &&
      Object.keys(rowResults).length === rowCount
    ) {
      // Flatten all row results and attach bboxes from position_map
      const flat = Object.values(rowResults).flat().map(item => ({
        ...item,
        bbox: item.status === 'FAIL' ? positionMap[item.slot_id] ?? null : null
      }));
      setAllResults(flat);
      setStep('RESULTS');
    }
  }, [rowResults, processingRows, step, rowCount, positionMap]);

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
    setStep('SELECTION');
    setOverviewImage(null);
    setRowCount(0);
    setPositionMap({});
    setCurrentRowIndex(1);
    setRowResults({});
    setProcessingRows(new Set());
    setAllResults([]);
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E2E8F0] font-sans">
      <Header />
      <main className="max-w-4xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {/* {step === 'AUTH' && (
            <AuthPage 
            onSubmit ={() => setStep('SELECTION')} />
          )} */}

          {step === 'SELECTION' && (
            <SelectionScreen
              selectedProject={selectedProject}
              setSelectedProject={setSelectedProject}
              selectedReference={selectedReference}
              setSelectedReference={setSelectedReference}
              onStartCamera={() => setStep('OVERVIEW_CAPTURE')}
            />
          )}

          {/* Overview capture — full panel shot */}
          {step === 'OVERVIEW_CAPTURE' && (
            <CameraScreen
              mode="overview"
              label="Capture Full Panel"
              onBack={() => setStep('SELECTION')}
              onCapture={handleOverviewCapture}
            />
          )}

          {/* Brief processing screen while overview is being analysed */}
          {step === 'OVERVIEW_PROCESSING' && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="font-mono text-white/50 uppercase tracking-widest text-sm">
                Counting rows...
              </p>
            </div>
          )}

          {step === 'OVERVIEW_DONE' && (
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
                onClick={() => setStep('ROW_CAPTURE')}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold tracking-widest uppercase transition-all shadow-lg shadow-blue-900/30"
              >
                Start
              </button>
            </motion.div>
          )}

          {/* Row-by-row capture */}
          {step === 'ROW_CAPTURE' && (
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
              onBack={() => setStep('OVERVIEW_CAPTURE')}
              onCapture={handleRowCapture}
            />
          )}

          {/* All rows captured, waiting for last background jobs */}
          {step === 'WAITING_RESULTS' && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="font-mono text-white/50 uppercase tracking-widest text-sm">
                Finalising results...
              </p>
              <p className="text-xs text-white/30 font-mono">
                {processingRows.size} row{processingRows.size !== 1 ? 's' : ''} still processing
              </p>
            </div>
          )}

          {/* Results — unchanged component, just fed allResults + overviewImage */}
          {step === 'RESULTS' && (
            <ResultsScreen
              inspectionResult={{
                status: allResults.some(r => r.status === 'FAIL') ? 'Not Valid' : 'Valid',
                details: allResults,
                image_width: /* you need to store this from overview */ overviewDimensions.w,
                image_height: overviewDimensions.h,
              }}
              capturedImage={overviewImage}
              onRetake={() => setStep('OVERVIEW_CAPTURE')}
              onReset={reset}
            />
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}