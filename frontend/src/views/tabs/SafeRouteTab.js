import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to handle Map Clicks
const LocationSelector = ({ onLocationSelect, mode }) => {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng, mode);
        },
    });
    return null;
};

const SafeRouteTab = () => {
    const [startPoint, setStartPoint] = useState(null);
    const [endPoint, setEndPoint] = useState(null);
    const [routes, setRoutes] = useState(null);
    const [selectionMode, setSelectionMode] = useState('start'); // 'start' or 'end'
    const [loading, setLoading] = useState(false);

    const handleMapClick = (latlng, mode) => {
        if (mode === 'start') {
            setStartPoint([latlng.lat, latlng.lng]);
            setSelectionMode('end'); // Auto-switch to end selection
        } else {
            setEndPoint([latlng.lat, latlng.lng]);
        }
    };

    const fetchRoute = async () => {
        if (!startPoint || !endPoint) return;
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/api/navigate', {
                start: startPoint,
                end: endPoint
            });
            setRoutes(response.data);
        } catch (error) {
            console.error("Routing error:", error);
            alert("Could not calculate route. Ensure the graph is loaded.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="bg-white p-4 shadow-sm rounded-lg mb-4 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-gray-700">Safe Navigation</h3>
                    <p className="text-sm text-gray-500">
                        {selectionMode === 'start' ? "Click map to set START point" : "Click map to set END point"}
                    </p>
                </div>
                <div className="space-x-2">
                    <button 
                        onClick={() => setSelectionMode('start')}
                        className={`px-3 py-1 text-sm rounded ${selectionMode === 'start' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        Set Start
                    </button>
                    <button 
                        onClick={() => setSelectionMode('end')}
                        className={`px-3 py-1 text-sm rounded ${selectionMode === 'end' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        Set End
                    </button>
                    <button 
                        onClick={fetchRoute}
                        disabled={!startPoint || !endPoint}
                        className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? "Calculating..." : "Find Safe Route"}
                    </button>
                </div>
            </div>

            <MapContainer center={[34.0522, -118.2437]} zoom={13} style={{ height: '500px', width: '100%', borderRadius: '8px' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                <LocationSelector onLocationSelect={handleMapClick} mode={selectionMode} />

                {startPoint && <Marker position={startPoint}><Popup>Start</Popup></Marker>}
                {endPoint && <Marker position={endPoint}><Popup>End</Popup></Marker>}

                {routes && (
                    <>
                        <Polyline positions={routes.fastest} color="red" weight={4} opacity={0.6}>
                            <Popup>Fastest Route (High Risk)</Popup>
                        </Polyline>
                        <Polyline positions={routes.safest} color="green" weight={4} opacity={0.8}>
                            <Popup>Safest Route (Low Risk)</Popup>
                        </Polyline>
                    </>
                )}
            </MapContainer>
            
            {routes && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-center">
                        <span className="block font-bold text-red-700">Fastest Route</span>
                        <span className="text-xs text-gray-600">Takes the most direct path, ignoring crime data.</span>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded text-center">
                        <span className="block font-bold text-green-700">Safest Route</span>
                        <span className="text-xs text-gray-600">Detours around high-severity crime clusters.</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SafeRouteTab;