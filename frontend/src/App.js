// frontend/src/App.js
import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './views/Dashboard';
import Welcome from './views/Welcome';
import Features from './views/Features';
import Documentation from './views/Documentation';
import Surveillance from './views/Surveillance';
import { uploadFile } from './services/api';
import SafetyAssistant from './components/ui/SafetyAssistant';
import TargetCursor from './components/TargetCursor'; 

function App() {
    const [currentView, setCurrentView] = useState('welcome');
    const [fileInfo, setFileInfo] = useState(null);
    const [initialFilters, setInitialFilters] = useState(null);
    const [activeFilters, setActiveFilters] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [crimeContextForAI, setCrimeContextForAI] = useState([]);

    const handleLaunch = (mode) => {
        if (mode === 'analysis') setCurrentView('dashboard');
        else if (mode === 'surveillance') setCurrentView('surveillance');
    };

    const handleFileUpload = async (file) => {
        setIsLoading(true);
        setError('');
        setFileInfo(null);
        setInitialFilters(null);
        setActiveFilters(null);
        try {
            const response = await uploadFile(file);
            setFileInfo({ name: file.name, totalRecords: response.data.total_records });
            setInitialFilters(response.data.filters);
            const allFilters = {
                areas: response.data.filters.areas,
                crimes: response.data.filters.crimes,
                severities: response.data.filters.severities,
            };
            setActiveFilters(allFilters);
            setCrimeContextForAI(response.data.filters.crimes.slice(0, 5));
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to upload or process file.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (newFilters) => {
        setActiveFilters(newFilters);
        setCrimeContextForAI(newFilters.crimes.slice(0, 5));
    };

    if (currentView === 'docs') return <Documentation onBack={() => setCurrentView('welcome')} />;
    if (currentView === 'features') return <Features onBack={() => setCurrentView('welcome')} onEnterDashboard={() => setCurrentView('dashboard')} />;
    if (currentView === 'surveillance') return <Surveillance onBack={() => setCurrentView('welcome')} />;
    if (currentView === 'welcome') return <Welcome onEnter={handleLaunch} onShowFeatures={() => setCurrentView('features')} onShowDocs={() => setCurrentView('docs')} />;

    return (
        <div className="flex h-screen bg-[#f4f7f9] font-sans relative overflow-hidden">
            
            {/* Tech Dot Grid Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.25]" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-400/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[5%] -right-[10%] w-[50%] h-[60%] bg-indigo-400/15 rounded-full blur-[150px]"></div>
            </div>

            <TargetCursor spinDuration={2} hideDefaultCursor={false} parallaxOn={true} hoverDuration={0.2} />

            <div className="relative z-10 h-full">
                <Sidebar onFileUpload={handleFileUpload} fileInfo={fileInfo} initialFilters={initialFilters} onFilterChange={handleFilterChange} isLoading={isLoading} />
            </div>

            <main className="flex-1 p-4 md:px-8 md:py-6 overflow-y-auto relative z-10 flex flex-col">
                
                {/* --- PERFECTLY CENTERED HEADER --- */}
                <header className="grid grid-cols-3 items-center w-full mb-4">
                    {/* Left: Back Button */}
                    <div className="justify-self-start">
                        <button 
                            onClick={() => setCurrentView('welcome')}
                            className="cursor-target flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-all bg-white/50 hover:bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/60 shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                            Home
                        </button>
                    </div>

                    {/* Center: Title & Subtitle */}
                    <div className="justify-self-center text-center">
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800 tracking-tight drop-shadow-sm">
                            CrimeLens
                        </h1>
                        <p className="text-[10px] font-bold text-blue-600 mt-1 tracking-widest uppercase opacity-80">
                            Historical Intelligence & Prediction
                        </p>
                    </div>

                    {/* Right: Empty spacer to keep grid balanced */}
                    <div className="justify-self-end"></div>
                </header>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl shadow-sm">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {activeFilters ? (
                    <Dashboard activeFilters={activeFilters} />
                ) : (
                    // Light Theme Sci-Fi Placeholder
                    <div className="cursor-target flex-1 flex flex-col items-center justify-center w-full bg-white/60 backdrop-blur-xl rounded-3xl border border-white relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-500 min-h-[500px]">
                        <div className="relative z-10 flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 rounded-2xl group-hover:border-blue-400 transition-all duration-500 w-3/4 max-w-2xl bg-white/50 backdrop-blur-sm shadow-sm">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-blue-400/30 rounded-full animate-ping blur-sm"></div>
                                <div className="relative bg-white p-5 rounded-full border border-blue-100 shadow-[0_4px_20px_rgba(59,130,246,0.15)] group-hover:border-blue-200 group-hover:shadow-[0_8px_30px_rgba(59,130,246,0.3)] transition-all duration-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-blue-600 group-hover:text-blue-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                                    </svg>
                                </div>
                            </div>
                            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 mb-3 tracking-tight">Awaiting Data Payload</h2>
                            <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed text-center font-medium">Initialize the analytical engine by uploading a CSV dataset via the control panel on the left.</p>
                            <div className="mt-10 flex gap-3 items-center justify-center">
                                <div className="w-12 h-1.5 bg-blue-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
                                <div className="w-6 h-1.5 bg-blue-400 rounded-full animate-pulse delay-75 shadow-[0_0_8px_rgba(96,165,250,0.4)]"></div>
                                <div className="w-2 h-1.5 bg-blue-300 rounded-full animate-pulse delay-150 shadow-[0_0_8px_rgba(147,197,253,0.4)]"></div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            {initialFilters && <SafetyAssistant crimeContext={crimeContextForAI} />}
        </div>
    );
}

export default App;