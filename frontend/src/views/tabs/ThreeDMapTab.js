// frontend/src/components/tabs/ThreeDMapTab.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CrimeMap3D from '../../components/CrimeMap3D'; // The deck.gl component you created

const ThreeDMapTab = ({ activeFilters }) => {
    const [mapData, setMapData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch data from your existing backend endpoint
                // We send activeFilters so the backend sends relevant points
                const response = await axios.post('http://127.0.0.1:8000/api/hotspots', {
                    filters: activeFilters
                });
                
                // Ensure response.data.hotspots is an array
                setMapData(response.data.hotspots || []); 
            } catch (error) {
                console.error("Error fetching 3D map data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (activeFilters) {
            fetchData();
        }
    }, [activeFilters]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <svg className="animate-spin h-10 w-10 mb-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p>Rendering 3D Hexbins...</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-xl relative">
            {/* Overlay Title */}
            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-sm p-3 rounded border border-white/10 text-white">
                <h3 className="font-bold text-lg">Density Analysis</h3>
                <p className="text-xs text-gray-300">Height = Volume | Color = Severity</p>
            </div>

            {/* The 3D Map Component */}
            <CrimeMap3D data={mapData} />
        </div>
    );
};

export default ThreeDMapTab;