// frontend/src/views/Dashboard.js
import React, { Fragment, useRef, useState } from 'react';
import { Tab } from '@headlessui/react';
import UnifiedMapTab from './tabs/UnifiedMapTab';
import ThreeDMapTab from './tabs/ThreeDMapTab'; 
import TimeSeriesTab from './tabs/TimeSeriesTab';
import SeverityTab from './tabs/SeverityTab';
import PredictionTab from './tabs/PredictionTab';
import SentimentTab from './tabs/SentimentTab';
import { generatePDF } from '../utils/pdfGenerator'; 

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

const Dashboard = ({ activeFilters }) => {
    const dashboardRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const totalRecords = 1000; 

    const handleExport = async () => {
        setIsGenerating(true);
        await generatePDF(activeFilters, dashboardRef, totalRecords);
        setIsGenerating(false);
    };

    const tabs = [
        "Interactive Map", 
        "3D Density", 
        "Time-Series Analysis", 
        "Severity Breakdown", 
        "Risk Prediction",
        "Public Perception"
    ];

    return (
        <div className="w-full flex flex-col h-full">
            <Tab.Group>
                
                {/* --- HEADER ROW: Tabs (Left) & Export Button (Right) --- */}
                <div className="flex justify-between items-center mb-4 w-full">
                    
                    {/* Glassmorphic Tab Bar */}
                    <Tab.List className="flex space-x-1 rounded-2xl bg-white/60 p-1.5 backdrop-blur-md border border-white/60 shadow-sm overflow-x-auto custom-scrollbar">
                        {tabs.map((tab) => (
                            <Tab key={tab} as={Fragment}>
                                {({ selected }) => (
                                    <button
                                        className={classNames(
                                            'cursor-target px-4 py-2.5 text-sm font-bold transition-all duration-300 rounded-xl whitespace-nowrap',
                                            'focus:outline-none focus:ring-2 focus:ring-blue-400/50',
                                            selected 
                                                ? 'bg-white text-blue-700 shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-white' 
                                                : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
                                        )}
                                    >
                                        {tab}
                                    </button>
                                )}
                            </Tab>
                        ))}
                    </Tab.List>
                    
                    {/* Export Button */}
                    <button 
                        onClick={handleExport}
                        disabled={isGenerating}
                        className={`cursor-target flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold transition-all duration-300 ml-4 whitespace-nowrap ${isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-[0_4px_14px_rgba(225,29,72,0.3)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.5)] transform hover:-translate-y-0.5'}`}
                    >
                        {isGenerating ? (
                            <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating...</>
                        ) : (
                            <><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zm5.845 17.03a.75.75 0 001.06 0l3-3a.75.75 0 10-1.06-1.06l-1.72 1.72V12a.75.75 0 00-1.5 0v4.19l-1.72-1.72a.75.75 0 00-1.06 1.06l3 3z" clipRule="evenodd" /></svg> Export Report</>
                        )}
                    </button>
                </div>

                {/* --- MAIN DASHBOARD AREA --- */}
                <div ref={dashboardRef} className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 min-h-[600px] border border-white relative z-10 w-full flex-1">
                    <Tab.Panels className="h-full w-full">
                        <Tab.Panel className="h-full w-full"><UnifiedMapTab activeFilters={activeFilters} /></Tab.Panel>
                        <Tab.Panel className="h-full w-full"><ThreeDMapTab activeFilters={activeFilters} /></Tab.Panel>
                        <Tab.Panel className="h-full w-full"><TimeSeriesTab activeFilters={activeFilters} /></Tab.Panel>
                        <Tab.Panel className="h-full w-full"><SeverityTab activeFilters={activeFilters} /></Tab.Panel>
                        <Tab.Panel className="h-full w-full"><PredictionTab activeFilters={activeFilters} /></Tab.Panel>
                        <Tab.Panel className="h-full w-full"><SentimentTab activeFilters={activeFilters} /></Tab.Panel>
                    </Tab.Panels>
                </div>

            </Tab.Group>
        </div>
    );
};

export default Dashboard;