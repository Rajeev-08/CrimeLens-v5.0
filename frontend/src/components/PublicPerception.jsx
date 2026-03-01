import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Badge, Spinner } from 'flowbite-react'; // Assuming you use a UI library, replace if needed

const PublicPerception = () => {
  const [area, setArea] = useState("Los Angeles"); // Default Area
  const [searchInput, setSearchInput] = useState(""); 
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Function to fetch data
  const fetchSentiment = async (targetArea) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/sentiment', {
        areas: [targetArea], // Sending the selected area to backend
        crimes: [],
        severities: []
      });
      setData(response.data);
    } catch (error) {
      console.error("Error fetching sentiment:", error);
    }
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    fetchSentiment(area);
  }, []); 

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setArea(searchInput);
      fetchSentiment(searchInput);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {/* --- TOP BAR: Title & Search --- */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Public Perception</h2>
        
        {/* AREA SEARCH BOX */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input 
            type="text" 
            placeholder="Enter City..." 
            className="border rounded px-2 py-1 text-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button 
            type="submit"
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            Change Area
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-10"><Spinner /> Loading analysis for {area}...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* --- LEFT: GAUGE CHART --- */}
          <div className="col-span-1 flex flex-col items-center justify-center border-r border-gray-100 p-4">
            <h3 className="text-gray-500 uppercase text-xs font-bold mb-4">Public Fear Index</h3>
            
            {/* Simple CSS Gauge Representation */}
            <div className="relative w-40 h-20 overflow-hidden mb-2">
              <div className="w-full h-full bg-gray-200 rounded-t-full"></div>
              <div 
                className="absolute top-0 left-0 w-full h-full bg-orange-500 rounded-t-full origin-bottom transition-all duration-1000"
                style={{ transform: `rotate(${(data?.fearIndex || 0) * 1.8 - 180}deg)` }}
              ></div>
            </div>
            
            <div className="text-4xl font-bold text-gray-800">{data?.fearIndex || 0}</div>
            <div className="text-gray-400 text-xs mb-3">/ 100</div>
            
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              data?.perceptionLabel === 'Panic' ? 'bg-red-100 text-red-700' : 
              data?.perceptionLabel === 'Anxious' ? 'bg-yellow-100 text-yellow-700' : 
              'bg-green-100 text-green-700'
            }`}>
              Status: {data?.perceptionLabel || "Unknown"}
            </span>
            
            <p className="text-xs text-gray-400 mt-4 text-center">
              Based on NLP analysis of recent headlines for:<br/>
              <strong className="text-gray-600">"{area} Crime"</strong>
            </p>
          </div>

          {/* --- RIGHT: NEWS LIST (SCROLLABLE) --- */}
          <div className="col-span-2">
            <h3 className="font-bold text-gray-800 mb-3">Recent Headlines & Sentiment</h3>
            
            {/* SCROLLABLE CONTAINER: max-h-96 allows scrolling if list is long */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {data?.articles?.map((article, index) => (
                <div key={index} className="flex justify-between items-start border-b border-gray-100 pb-3">
                  <div>
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-800 hover:text-blue-600 leading-tight block mb-1">
                      {article.title}
                    </a>
                    <span className="text-xs text-gray-400">{article.source}</span>
                  </div>
                  
                  {/* Sentiment Badge */}
                  <span className={`text-xs px-2 py-1 rounded font-semibold whitespace-nowrap ml-2 ${
                    article.sentimentLabel === 'Negative' ? 'bg-red-50 text-red-600' :
                    article.sentimentLabel === 'Positive' ? 'bg-green-50 text-green-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {article.sentimentLabel} ({article.sentimentScore.toFixed(2)})
                  </span>
                </div>
              ))}
              
              {(!data?.articles || data.articles.length === 0) && (
                <p className="text-sm text-gray-400 italic">No recent news found for this area.</p>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default PublicPerception;