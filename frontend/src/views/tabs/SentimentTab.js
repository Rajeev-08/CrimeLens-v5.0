import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const SentimentTab = ({ activeFilters }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // New State for Manual Search
    const [manualArea, setManualArea] = useState("");

    const fetchData = async (areaToSearch) => {
        setLoading(true);
        try {
            console.log("Fetching sentiment for:", areaToSearch);
            const response = await axios.post('http://127.0.0.1:8000/api/sentiment', {
                areas: [areaToSearch], // Override with specific area
                crimes: [],
                severities: []
            });
            setData(response.data);
        } catch (error) {
            console.error("Sentiment Error:", error);
        } finally {
            setLoading(false);
        }
    };

    // 1. Load data from Dashboard Filters initially
    useEffect(() => {
        if (activeFilters && activeFilters.areas && activeFilters.areas.length > 0) {
            setManualArea(activeFilters.areas[0]); // Sync input box
            fetchData(activeFilters.areas[0]);
        } else {
            // Default fallback if no filter selected
            fetchData("Los Angeles");
        }
    }, [activeFilters]);

    // 2. Handle Manual Search (Enter Key or Button Click)
    const handleSearch = (e) => {
        e.preventDefault();
        if (manualArea.trim()) {
            fetchData(manualArea);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            Scanning News Headlines...
        </div>
    );

    if (!data) return <div className="p-10 text-center text-gray-500">No public perception data available.</div>;

    // --- CHART CONFIG ---
    const gaugeData = {
        labels: ['Fear Level', 'Safety Level'],
        datasets: [{
            data: [data.fearIndex, 100 - data.fearIndex],
            backgroundColor: [
                data.fearIndex > 70 ? '#EF4444' : data.fearIndex > 40 ? '#F59E0B' : '#10B981', 
                '#E5E7EB'
            ],
            borderWidth: 0,
            circumference: 180, 
            rotation: 270,
        }]
    };

    return (
        <div className="p-6">
            {/* --- NEW: SEARCH BAR SECTION --- */}
            <div className="flex justify-between items-center mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div>
                    <h3 className="text-blue-900 font-bold text-lg">Analyze a Specific Area</h3>
                    <p className="text-xs text-blue-600">Enter a city or neighborhood to scan local news.</p>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input 
                        type="text" 
                        value={manualArea}
                        onChange={(e) => setManualArea(e.target.value)}
                        placeholder="e.g. Chicago, Bronx..." 
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
                    />
                    <button 
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        Analyze
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. FEAR INDEX SCORE CARD */}
                <div className="md:col-span-1 bg-white border rounded-xl p-6 shadow-sm text-center flex flex-col justify-center">
                    <h3 className="text-gray-500 font-bold uppercase text-sm mb-4">Public Fear Index</h3>
                    
                    <div className="relative h-40 w-full flex justify-center">
                        <Doughnut data={gaugeData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }} />
                        <div className="absolute bottom-0 text-center">
                            <span className="text-4xl font-extrabold text-gray-800">{data.fearIndex}</span>
                            <span className="text-sm text-gray-400 block">/ 100</span>
                        </div>
                    </div>

                    <div className={`mt-4 px-3 py-1 inline-block rounded-full text-sm font-bold mx-auto ${
                        data.perceptionLabel === 'Panic' ? 'bg-red-100 text-red-800' :
                        data.perceptionLabel === 'Anxious' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                    }`}>
                        Status: {data.perceptionLabel}
                    </div>
                </div>

                {/* 2. NEWS FEED (SCROLLABLE) */}
                <div className="md:col-span-2 bg-white border rounded-xl p-6 shadow-sm">
                    <h3 className="text-gray-800 font-bold mb-4 flex justify-between">
                        <span>Headlines & Sentiment</span>
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">Query: "{data.query}"</span>
                    </h3>
                    
                    {/* ADDED SCROLL HERE with max-h-[500px] */}
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {data.articles.map((article, idx) => (
                            <div key={idx} className="flex justify-between items-start border-b border-gray-100 pb-3 last:border-0 hover:bg-gray-50 p-2 rounded transition-colors">
                                <div>
                                    <h4 className="font-semibold text-sm text-gray-800 leading-snug mb-1">
                                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline">
                                            {article.title}
                                        </a>
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-500">{article.source}</span>
                                        {/* Optional Date if available */}
                                        {article.publishedAt && <span className="text-xs text-gray-400">• {new Date(article.publishedAt).toLocaleDateString()}</span>}
                                    </div>
                                </div>

                                <span className={`text-xs font-bold px-2 py-1 rounded ml-3 whitespace-nowrap ${
                                    article.sentimentLabel === 'Negative' ? 'bg-red-50 text-red-600 border border-red-100' :
                                    article.sentimentLabel === 'Positive' ? 'bg-green-50 text-green-600 border border-green-100' :
                                    'bg-gray-50 text-gray-600 border border-gray-200'
                                }`}>
                                    {article.sentimentLabel}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SentimentTab;