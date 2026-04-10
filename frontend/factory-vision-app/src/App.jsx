import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import Header from './components/Header';
import Footer from './components/Footer';
import SelectionScreen from './components/SelectionScreen';
import CameraScreen from './components/CameraScreen';
import ResultsScreen from './components/ResultsScreen';
import axios from './api/api';

export default function App() {
  const [step, setStep] = useState('SELECTION');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedReference, setSelectedReference] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [inspectionResult, setInspectionResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const validComment = 'This Slot is Valid';
  const wrongCalibre = 'This calibre is wrong';
  const wrongId = 'This ID is wrong';

  const handleCapture = (imageData) => {
    setCapturedImage(imageData);
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(async () => {
      const blob = await (await fetch(imageData)).blob();

      const formData = new FormData();
      formData.append("file", blob, "image.jpg"); // IMPORTANT: must be Blob/File
      formData.append("row_id", "1");

      const response = await axios.post(
        "/api/validate_slot",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      console.log("API Response:", response.data);
      
      const state = response.data.validation_results.some(
        item => item.status !== "PASS"
      )  ? "Not Valid" : "Valid";

      console.log("API Response:", response.data);
      
      const result = {
        status: "Not Valid",//state,
        details: response.data.validation_results
      };

      // const result = {
      //   status: 'Not Valid',
      //   // score: 0.85 + Math.random() * 0.14,
      //   details: [
      //     { label: '76Q01', expected: '1 A', actual: '1 A', match: true, comment: validComment },
      //     { label: '76Q02', expected: '3 A', actual: '3 A', match: true, comment: validComment },
      //     { label: '94Q05', expected: '10 A', actual: '15 A', match: true, comment: wrongCalibre },
      //     { label: '95Q08', expected: '1 A', actual: '1 A', match: true, comment: validComment },
      //   ]
      // };
      setInspectionResult(result);
      setIsAnalyzing(false);
      setStep('RESULTS');
    }, 2000);
  };

  const reset = () => {
    setStep('SELECTION');
    setCapturedImage(null);
    setInspectionResult(null);
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E2E8F0] font-sans selection:bg-blue-500/30">
      <Header />

      <main className="max-w-4xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {step === 'SELECTION' && (
            <SelectionScreen 
              selectedProject={selectedProject}
              setSelectedProject={setSelectedProject}
              selectedReference={selectedReference}
              setSelectedReference={setSelectedReference}
              onStartCamera={() => setStep('CAMERA')}
            />
          )}

          {step === 'CAMERA' && (
            <CameraScreen 
              selectedReference={selectedReference}
              onBack={() => setStep('SELECTION')}
              onCapture={handleCapture}
              isAnalyzing={isAnalyzing}
            />
          )}

          {step === 'RESULTS' && inspectionResult && (
            <ResultsScreen 
              inspectionResult={inspectionResult}
              capturedImage={capturedImage}
              onRetake={() => setStep('CAMERA')}
              onReset={reset}
            />
          )}
        </AnimatePresence>
      </main>

    </div>
  );
}
