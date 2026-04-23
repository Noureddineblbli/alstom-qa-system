import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import Header from './components/Header';
import SelectionScreen from './components/SelectionScreen';
import CameraScreen from './components/CameraScreen';
import ResultsScreen from './components/ResultsScreen';
import axios from './api/api';
import AuthPage from './components/AuthPage';

export default function App() {
  const [step, setStep] = useState('SELECTION');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedReference, setSelectedReference] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [inspectionResult, setInspectionResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCapture = (imageData) => {
    setCapturedImage(imageData);
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(async () => {
      // const blob = await (await fetch(imageData)).blob();

      // const formData = new FormData();
      // formData.append("file", blob, "image.jpg"); // IMPORTANT: must be Blob/File

      // Decode base64 data URL directly — no fetch re-encoding
      const [header, base64] = imageData.split(',');
      const mimeType = header.match(/:(.*?);/)[1]; // e.g. "image/png"
      const extension = mimeType.split('/')[1];    // e.g. "png"

      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });

      const formData = new FormData();
      formData.append("file", blob, `image.${extension}`); // filename matches actual format

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
        status: state,
        details: response.data.validation_results,
        image_width: response.data.image_width,
        image_height: response.data.image_height
      };

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
