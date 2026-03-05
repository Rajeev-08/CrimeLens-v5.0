// frontend/src/views/Welcome.js
import React, { useState } from 'react';
import Prism from '../components/Prism';

const Welcome = ({ onEnter, onShowFeatures, onShowDocs }) => {
  const [showSelection, setShowSelection] = useState(false);

  return (
    <div className="relative w-full h-screen bg-[#060606] overflow-hidden font-sans text-white">
      
      

      {/* --- BACKGROUND LAYER (Continuous) --- */}
      <div className="absolute inset-0 z-0 opacity-80">
        <Prism
          animationType="rotate" 
          timeScale={0.3}     
          height={3.6}
          baseWidth={5.5}
          scale={4}
          hueShift={0}      
          colorFrequency={1}
          noise={0.1}         
          glow={1}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060606] via-transparent to-transparent" />
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="relative z-20 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowSelection(false)}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-sm">CL</div>
          <span className="text-lg font-medium tracking-tight">CrimeLens</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm text-gray-400 font-medium">
          <span onClick={onShowFeatures} className="hover:text-white cursor-pointer transition-colors">Features</span>
          <span onClick={onShowDocs} className="hover:text-white cursor-pointer transition-colors">Documentation</span>
        </div>
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="relative z-10 flex flex-col items-center justify-center h-[85vh] text-center px-4">
        
        {/* PHASE 1: LANDING VIEW */}
        {!showSelection && (
          <div className="animate-fade-in-up">
            <div className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-medium text-gray-300">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>v2.0 Live</span>
            </div>

            <h1 className="max-w-4xl text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500">
              Intelligent <br />
              <span className="text-white">Crime Analytics.</span>
            </h1>

            <p className="max-w-xl text-lg text-gray-400 mb-10 leading-relaxed mx-auto">
              Visualize patterns and forecast risks with real-time AI intelligence.
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowSelection(true)}
                className="px-8 py-3.5 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                Launch Dashboard
              </button>
              
              <button 
                onClick={onShowDocs}
                className="px-8 py-3.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-white font-medium hover:bg-white/10 transition-all"
              >
                Documentation
              </button>
            </div>
          </div>
        )}

        {/* PHASE 2: SELECTION VIEW */}
        {showSelection && (
          <div className="animate-fade-in-up w-full max-w-4xl">
            <h2 className="text-3xl font-bold mb-8 text-white">Select Operational Mode</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Option 1: Dataset Analysis */}
                <button 
                    onClick={() => onEnter('analysis')}
                    className="group relative flex flex-col items-start p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 text-left"
                >
                    <div className="mb-4 p-3 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-white">Upload Dataset</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6 group-hover:text-gray-300">
                        Analyze historical CSV data. Generate heatmaps, run 3D density models, and predict future crime risks.
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-blue-400 text-sm font-bold uppercase tracking-wider group-hover:text-blue-300">
                        Launch Analysis <span>→</span>
                    </div>
                </button>

                {/* Option 2: Live Surveillance */}
                <button 
                    onClick={() => onEnter('surveillance')}
                    className="group relative flex flex-col items-start p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-red-500/50 transition-all duration-300 hover:-translate-y-1 text-left"
                >
                    <div className="absolute top-6 right-6 flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wide">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        Live
                    </div>

                    <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-white">Live Surveillance</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6 group-hover:text-gray-300">
                        Real-time monitoring using YOLOv5 & MobileNetV2. Detect weapons and violence instantly.
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-red-400 text-sm font-bold uppercase tracking-wider group-hover:text-red-300">
                        Start Monitoring <span>→</span>
                    </div>
                </button>
            </div>

            <button 
                onClick={() => setShowSelection(false)}
                className="mt-8 text-sm text-gray-500 hover:text-white transition-colors"
            >
                ← Go Back
            </button>
          </div>
        )}

      </div>
      
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 blur-sm" />
    </div>
  );
};

export default Welcome;