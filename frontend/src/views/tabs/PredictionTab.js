import React, { useState, useMemo } from 'react';
import { getStgatPrediction } from '../../services/api';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Dynamically re-center the map when data loads
const ChangeView = ({ center }) => {
    const map = useMap();
    map.setView(center, 11);
    return null;
};

// Enhanced local bounding box mapper for LA coordinates
const getNeighborhoodName = (lat, lon) => {
    if (lat >= 34.02 && lat <= 34.08 && lon >= -118.30 && lon <= -118.20) return "Downtown / Central LA";
    if (lat >= 33.90 && lat < 34.02 && lon >= -118.40 && lon <= -118.30) return "Inglewood / LAX Area";
    if (lat >= 33.90 && lat < 34.02 && lon >= -118.30 && lon <= -118.20) return "South LA";
    if (lat >= 34.08 && lat <= 34.15 && lon >= -118.40 && lon <= -118.30) return "Hollywood / West Hollywood";
    if (lat >= 34.00 && lat <= 34.10 && lon >= -118.50 && lon < -118.40) return "Santa Monica / Westside";
    if (lat >= 33.70 && lat <= 33.85 && lon >= -118.25 && lon <= -118.10) return "Long Beach";
    if (lat >= 34.15 && lat <= 34.30 && lon >= -118.60 && lon <= -118.30) return "San Fernando Valley";
    return "Los Angeles County";
};

const PredictionTab = ({ activeFilters }) => {
    const [predictions, setPredictions] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handlePredict = async () => {
        setIsLoading(true);
        try {
            const res = await getStgatPrediction(activeFilters);
            const rawData = res.data.predictions;

            if (rawData && rawData.length > 0) {
                // Find the max prediction to scale scores 0-100
                const maxPred = Math.max(...rawData.map(p => p.predicted_crimes));
                
                const enhancedData = rawData.map(p => {
                    const riskScore = Math.min(100, Math.round((p.predicted_crimes / maxPred) * 100));
                    
                    // Parse coordinates
                    const gridLat = parseFloat(p.lat);
                    const gridLon = parseFloat(p.lon);

                    return {
                        ...p,
                        riskScore,
                        neighborhood: getNeighborhoodName(gridLat, gridLon)
                    };
                });

                // Sort by highest risk
                enhancedData.sort((a, b) => b.riskScore - a.riskScore);
                setPredictions(enhancedData);
            } else {
                setPredictions([]);
            }
        } catch (err) {
            console.error("Prediction failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    const mapCenter = useMemo(() => {
        if (predictions && predictions.length > 0) {
            return [predictions[0].lat, predictions[0].lon];
        }
        return [34.0522, -118.2437]; // Default LA
    }, [predictions]);

    // Color gradient based on Risk Score
    const getRiskStyles = (score) => {
        if (score >= 80) return { fill: '#ef4444', border: '#b91c1c', bg: 'bg-red-50', text: 'text-red-700' }; 
        if (score >= 50) return { fill: '#f97316', border: '#c2410c', bg: 'bg-orange-50', text: 'text-orange-700' }; 
        return { fill: '#eab308', border: '#a16207', bg: 'bg-yellow-50', text: 'text-yellow-700' }; 
    };

    return (
        <div className="p-4 flex flex-col h-full">
            <div className="mb-4 flex justify-between items-end">
                <div>
                    <h3 className="text-xl font-bold mb-1">ST-GAT Spatial Forecast</h3>
                    <p className="text-sm text-gray-600">
                        Predictive risk clustering powered by Spatio-Temporal Graph Neural Networks.
                    </p>
                </div>
                <button 
                    onClick={handlePredict} disabled={isLoading}
                    className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400 shadow-md"
                >
                    {isLoading ? 'Processing Tensor...' : 'Generate Forecast'}
                </button>
            </div>

            {predictions && (
                <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[500px]">
                    
                    {/* --- LEFT: CIRCLE MARKER MAP --- */}
                    <div className="w-full lg:w-1/2 rounded-xl overflow-hidden border border-gray-300 shadow-inner relative z-0">
                        <MapContainer center={mapCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
                            <ChangeView center={mapCenter} />
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                attribution='&copy; CARTO'
                            />
                            
                            {predictions.map((p, i) => {
                                const styles = getRiskStyles(p.riskScore);
                                return (
                                    <CircleMarker
                                        key={i}
                                        center={[p.lat, p.lon]}
                                        radius={p.riskScore / 5 + 8} // Size scales with risk
                                        pathOptions={{
                                            fillColor: styles.fill,
                                            color: styles.border,
                                            weight: 2,
                                            fillOpacity: 0.6
                                        }}
                                    >
                                        <Popup>
                                            <div className="text-center p-1">
                                                <div className="font-bold text-gray-800 text-sm mb-1">{p.neighborhood}</div>
                                                <div className="text-xs text-gray-500 font-mono mb-2">Grid: {p.grid_id}</div>
                                                <div className={`text-lg font-black ${styles.text}`}>
                                                    Risk: {p.riskScore}/100
                                                </div>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                );
                            })}
                        </MapContainer>
                    </div>

                    {/* --- RIGHT: INTELLIGENCE LIST --- */}
                    <div className="w-full lg:w-1/2 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
                        <h4 className="font-bold text-gray-700 uppercase tracking-wider text-xs mb-2">Priority Zones</h4>
                        
                        {predictions.map((p, i) => {
                            const styles = getRiskStyles(p.riskScore);

                            return (
                                <div key={i} className={`p-4 border rounded-lg shadow-sm ${styles.bg} border-opacity-50 transition-all hover:shadow-md`}>
                                    <div className="flex justify-between items-center">
                                        
                                        {/* Location Info */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg font-bold text-gray-800">{p.neighborhood}</span>
                                            </div>
                                            <span className="text-xs font-mono text-gray-500">
                                                Grid: {p.grid_id}
                                            </span>
                                        </div>

                                        {/* Score Block */}
                                        <div className="text-right flex flex-col items-end">
                                            <div className={`text-3xl font-black ${styles.text}`}>
                                                {p.riskScore}
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                                                Risk Index
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>
            )}
        </div>
    );
};

export default PredictionTab;