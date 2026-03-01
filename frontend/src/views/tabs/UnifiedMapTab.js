import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import axios from 'axios';

// --- SYMBOL ICONS ---
const policeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2564/2564024.png', 
    iconSize: [32, 32], 
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
});

const hospitalIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/4320/4320350.png', 
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
});

// --- PIN ICONS ---
const createPinIcon = (colorUrl) => new L.Icon({
    iconUrl: colorUrl,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const hotspotIcon = createPinIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png');
const startIcon = createPinIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png');
const endIcon = createPinIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png');
// ✅ NEW: Violet icon for user reports
const reportIcon = createPinIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png');

// --- COMPONENTS ---

const HeatmapLayer = ({ points, visible }) => {
    const map = useMap();
    const heatLayerRef = useRef(null);

    useEffect(() => {
        if (heatLayerRef.current) {
            map.removeLayer(heatLayerRef.current);
            heatLayerRef.current = null;
        }

        if (visible && points && points.length > 0) {
            const layer = L.heatLayer(points, { 
                radius: 25, 
                blur: 20, 
                maxZoom: 17, 
                minOpacity: 0.4 
            });
            layer.addTo(map);
            heatLayerRef.current = layer;
        }

        return () => {
            if (heatLayerRef.current) {
                map.removeLayer(heatLayerRef.current);
                heatLayerRef.current = null;
            }
        };
    }, [map, points, visible]);

    return null;
};

const LocationSelector = ({ mode, onSelect }) => {
    useMapEvents({
        click(e) { if (mode !== 'view') onSelect(e.latlng); },
    });
    return null;
};

const LocateControl = ({ hotspotCenters, onWarning }) => {
    const map = useMap();
    const userMarkerRef = useRef(null);
    const accuracyCircleRef = useRef(null);
    const [isWatching, setIsWatching] = useState(false);

    useEffect(() => {
        return () => {
            map.stopLocate();
            if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
            if (accuracyCircleRef.current) map.removeLayer(accuracyCircleRef.current);
        };
    }, [map]);

    const handleLocate = () => {
        if (isWatching) {
            map.stopLocate();
            setIsWatching(false);
            if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
            if (accuracyCircleRef.current) map.removeLayer(accuracyCircleRef.current);
            userMarkerRef.current = null;
            accuracyCircleRef.current = null;
        } else {
            map.locate({ setView: true, maxZoom: 16, watch: true, enableHighAccuracy: true });
            setIsWatching(true);
        }
    };

    useMapEvents({
        locationfound(e) {
            const userLatLng = e.latlng;

            if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
            if (accuracyCircleRef.current) map.removeLayer(accuracyCircleRef.current);

            userMarkerRef.current = L.circleMarker(userLatLng, {
                radius: 8,
                fillColor: "#3b82f6",
                color: "#fff",
                weight: 2,
                opacity: 1,
                fillOpacity: 1
            }).addTo(map).bindPopup("You are here").openPopup();
            
            accuracyCircleRef.current = L.circle(userLatLng, { radius: e.accuracy / 2, color: '#3b82f6', fillOpacity: 0.1, weight: 1 }).addTo(map);

            if (hotspotCenters && hotspotCenters.length > 0) {
                let isNearDanger = false;
                for (let center of hotspotCenters) {
                    const centerLatLng = L.latLng(center[0], center[1]);
                    const distanceMeters = userLatLng.distanceTo(centerLatLng);
                    if (distanceMeters < 500) {
                        isNearDanger = true;
                        break;
                    }
                }
                onWarning(isNearDanger);
            }
        },
        locationerror(e) {
            console.error("GPS Error:", e.message);
            setIsWatching(false);
        }
    });

    return (
        <div className="absolute bottom-4 right-4 z-[1000]">
            <button
                onClick={handleLocate}
                className={`p-3 rounded-full shadow-xl border transition-all transform hover:scale-110 flex items-center justify-center w-12 h-12 ${
                    isWatching 
                    ? "bg-blue-600 text-white border-blue-700 animate-pulse" 
                    : "bg-white text-gray-700 border-gray-200 hover:text-blue-600"
                }`}
                title={isWatching ? "Stop Tracking" : "Locate Me & Track"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
            </button>
        </div>
    );
};

const UnifiedMapTab = ({ activeFilters }) => {
    // Data State
    const [heatmapPoints, setHeatmapPoints] = useState([]);
    const [hotspotCenters, setHotspotCenters] = useState([]);
    const [amenities, setAmenities] = useState([]);
    const [route, setRoute] = useState(null);
    const [incidents, setIncidents] = useState([]); // ✅ NEW: Stores user reports
    
    // UI State
    const [startPt, setStartPt] = useState(null);
    const [endPt, setEndPt] = useState(null);
    const [statusMsg, setStatusMsg] = useState("");
    const [interactionMode, setInteractionMode] = useState('view');
    const [proximityAlert, setProximityAlert] = useState(false);

    // Reporting Modal State
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [tempReportLoc, setTempReportLoc] = useState(null);
    const [reportDesc, setReportDesc] = useState("");
    const [reportCategory, setReportCategory] = useState("Suspicious Activity");

    // Layers State
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [showHotspots, setShowHotspots] = useState(true);
    const [showPolice, setShowPolice] = useState(true);
    const [showHospitals, setShowHospitals] = useState(true);
    const [showIncidents, setShowIncidents] = useState(true); // ✅ NEW: Toggle user reports

    // 1. Initial Data Load
  // 1. Initial Data Load
    useEffect(() => {
        const loadData = async () => {
            if (!activeFilters) return;
            try {
                // Step A: Get Crime Hotspots first
                const hRes = await axios.post('http://localhost:8000/api/hotspots', { ...activeFilters, n_clusters: 15 });
                setHeatmapPoints(hRes.data.heat_data);
                setHotspotCenters(hRes.data.centers);
                
                // ✅ FIX: Calculate the dynamic center of the data
                let centerLat = 34.0522;
                let centerLon = -118.2437;

                if (hRes.data.heat_data && hRes.data.heat_data.length > 0) {
                    // Simple average of all points to find the "middle" of the city
                    const points = hRes.data.heat_data;
                    const total = points.reduce((acc, curr) => ({ lat: acc.lat + curr[0], lon: acc.lon + curr[1] }), { lat: 0, lon: 0 });
                    centerLat = total.lat / points.length;
                    centerLon = total.lon / points.length;
                }

                console.log(`Searching for amenities at: ${centerLat}, ${centerLon}`);

                // Step B: Fetch Amenities for that SPECIFIC location
                const aRes = await axios.post('http://localhost:8000/api/map-context', { lat: centerLat, lon: centerLon });
                setAmenities(aRes.data.amenities);

                fetchIncidents(); // Fetch reports
            } catch (err) {
                console.error("Data load error", err);
            }
        };
        loadData();
    }, [activeFilters]);

    const fetchIncidents = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/incidents');
            setIncidents(res.data.incidents || []);
        } catch (e) {
            console.error("Failed to load incidents", e);
        }
    };

    // 2. Map Interaction Logic
    const handleMapClick = (latlng) => {
        const pt = [latlng.lat, latlng.lng];
        if (interactionMode === 'setStart') {
            setStartPt(pt);
            setInteractionMode('setEnd');
        } else if (interactionMode === 'setEnd') {
            setEndPt(pt);
            setInteractionMode('view');
            fetchRoute(startPt, pt);
        } else if (interactionMode === 'report') {
            // ✅ NEW: Open modal when map is clicked in report mode
            setTempReportLoc(pt);
            setReportModalOpen(true);
            setInteractionMode('view');
        }
    };

    const submitReport = async (e) => {
        e.preventDefault();
        if (!tempReportLoc) return;

        try {
            await axios.post('http://localhost:8000/api/report-incident', {
                lat: tempReportLoc[0],
                lon: tempReportLoc[1],
                description: reportDesc,
                category: reportCategory
            });
            // Reset and Refresh
            setReportModalOpen(false);
            setReportDesc("");
            setTempReportLoc(null);
            setStatusMsg("Incident Reported Successfully!");
            setTimeout(() => setStatusMsg(""), 3000);
            fetchIncidents();
        } catch (err) {
            alert("Failed to report incident");
        }
    };

    const fetchRoute = async (start, end) => {
        if (!start || !end) return;
        setStatusMsg("Calculating route...");
        setRoute(null);
        try {
            const res = await axios.post('http://localhost:8000/api/navigate', { start, end }, { timeout: 25000 });
            setRoute(res.data);
            setStatusMsg("");
        } catch (err) {
            console.error(err);
            setStatusMsg("Error: " + (err.response?.data?.detail || "No path found."));
        }
    };

    const resetMap = () => {
        setStartPt(null);
        setEndPt(null);
        setRoute(null);
        setStatusMsg("");
        setInteractionMode('view');
    };

    return (
        <div className="relative h-[600px] w-full rounded-xl overflow-hidden shadow-xl border border-gray-200">
            
            {/* ALERT BANNER */}
            {proximityAlert && (
                <div className="absolute top-0 left-0 right-0 z-[1100] bg-red-600 text-white p-3 shadow-lg flex justify-between items-center px-4 animate-pulse">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-bold uppercase tracking-wide">Caution: Entering High-Density Crime Zone</span>
                    </div>
                    <button onClick={() => setProximityAlert(false)} className="text-xs bg-red-800 hover:bg-red-900 px-3 py-1 rounded text-white border border-red-400">Dismiss</button>
                </div>
            )}

            {/* REPORT INCIDENT MODAL */}
            {reportModalOpen && (
                <div className="absolute inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">Report Incident</h3>
                        <form onSubmit={submitReport}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select 
                                value={reportCategory} 
                                onChange={(e) => setReportCategory(e.target.value)}
                                className="w-full border rounded p-2 mb-4"
                            >
                                <option>Suspicious Activity</option>
                                <option>Theft</option>
                                <option>Vandalism</option>
                                <option>Assault</option>
                                <option>Hazard</option>
                                <option>Other</option>
                            </select>

                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea 
                                value={reportDesc} 
                                onChange={(e) => setReportDesc(e.target.value)}
                                className="w-full border rounded p-2 mb-4 h-24"
                                placeholder="Describe what you saw..."
                                required
                            />

                            <div className="flex gap-2 justify-end">
                                <button type="button" onClick={() => setReportModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Submit Report</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Control Panel */}
            <div className="absolute top-16 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg max-w-sm w-full">
                <h3 className="font-bold text-gray-800 text-lg mb-2">Interactive Map</h3>
                <div className="flex gap-2 mb-2 flex-wrap">
                    <button 
                        onClick={() => { resetMap(); setInteractionMode('setStart'); }}
                        className={`flex-1 py-2 px-3 rounded-md font-medium text-sm text-white shadow transition-colors ${interactionMode === 'view' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'}`}
                    >
                        Navigate
                    </button>
                    <button 
                        onClick={() => { resetMap(); setInteractionMode('report'); }}
                        className={`flex-1 py-2 px-3 rounded-md font-medium text-sm text-white shadow transition-colors ${interactionMode === 'report' ? 'bg-purple-700 ring-2 ring-purple-300' : 'bg-purple-600 hover:bg-purple-700'}`}
                    >
                        Report Incident
                    </button>
                    {(route || startPt || interactionMode !== 'view') && <button onClick={resetMap} className="px-3 py-2 bg-red-100 text-red-600 rounded-md font-bold">Reset</button>}
                </div>
                
                {interactionMode === 'setStart' && <div className="text-sm bg-blue-50 text-blue-700 p-2 rounded">Click map to set <strong>Start</strong></div>}
                {interactionMode === 'setEnd' && <div className="text-sm bg-green-50 text-green-700 p-2 rounded">Click map to set <strong>Destination</strong></div>}
                {interactionMode === 'report' && <div className="text-sm bg-purple-50 text-purple-700 p-2 rounded">Click map location to <strong>Report</strong></div>}
                
                {statusMsg && <div className="text-sm font-semibold text-green-600 animate-bounce mt-2">{statusMsg}</div>}
                {route && (
                    <div className="grid grid-cols-1 gap-2 text-xs mt-2 font-bold border-t pt-2">
                        <div className="text-green-600 flex items-center gap-1">■ Safest Route</div>
                    </div>
                )}
            </div>

            {/* Layers Panel */}
            <div className="absolute top-16 right-4 z-[1000] bg-white p-3 rounded-lg shadow-lg text-sm flex flex-col gap-1">
                <h4 className="font-semibold border-b pb-1 mb-1">Layers</h4>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={showHeatmap} onChange={e => setShowHeatmap(e.target.checked)} /> 🔥 Heatmap</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={showHotspots} onChange={e => setShowHotspots(e.target.checked)} /> 📍 Hotspots</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={showPolice} onChange={e => setShowPolice(e.target.checked)} /> 🛡️ Police</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={showHospitals} onChange={e => setShowHospitals(e.target.checked)} /> 🏥 Hospitals</label>
                <label className="flex items-center gap-2 cursor-pointer text-purple-700 font-medium"><input type="checkbox" checked={showIncidents} onChange={e => setShowIncidents(e.target.checked)} /> 🟣 User Reports</label>
            </div>

            <MapContainer center={[34.0522, -118.2437]} zoom={12} className="h-full w-full">
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                <LocationSelector mode={interactionMode} onSelect={handleMapClick} />
                
                <LocateControl hotspotCenters={hotspotCenters} onWarning={setProximityAlert} />

                <HeatmapLayer points={heatmapPoints} visible={showHeatmap} />

                {/* Hotspots */}
                {showHotspots && hotspotCenters.map((c, i) => (
                    <Marker key={`hot-${i}`} position={c} icon={hotspotIcon} zIndexOffset={500}>
                        <Popup><strong>Hotspot #{i+1}</strong><br/>High Crime Density</Popup>
                    </Marker>
                ))}

                {/* User Reports */}
                {showIncidents && incidents.map((inc, i) => (
                    <Marker key={`inc-${i}`} position={[inc.lat, inc.lon]} icon={reportIcon} zIndexOffset={600}>
                        <Popup>
                            <div className="text-sm">
                                <strong className="text-purple-700">{inc.category}</strong>
                                <p className="mb-1">{inc.description}</p>
                                <span className="text-xs text-gray-500">{new Date(inc.timestamp).toLocaleString()}</span>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Amenities */}
                {showPolice && amenities.filter(a => a.type === 'police').map((p, i) => (
                    <Marker key={`pol-${i}`} position={[p.lat, p.lon]} icon={policeIcon} zIndexOffset={800}>
                        <Popup><strong>{p.name}</strong><br/>Police Station</Popup>
                    </Marker>
                ))}
                {showHospitals && amenities.filter(a => a.type === 'hospital').map((h, i) => (
                    <Marker key={`hos-${i}`} position={[h.lat, h.lon]} icon={hospitalIcon} zIndexOffset={800}>
                        <Popup><strong>{h.name}</strong><br/>Hospital</Popup>
                    </Marker>
                ))}

                {/* Route Markers */}
                {startPt && <Marker position={startPt} icon={startIcon} draggable={true} zIndexOffset={1000} 
                    eventHandlers={{ dragend: (e) => { const p = e.target.getLatLng(); setStartPt([p.lat, p.lng]); if(endPt) fetchRoute([p.lat, p.lng], endPt); } }} />}
                
                {endPt && <Marker position={endPt} icon={endIcon} draggable={true} zIndexOffset={1000} 
                    eventHandlers={{ dragend: (e) => { const p = e.target.getLatLng(); setEndPt([p.lat, p.lng]); if(startPt) fetchRoute(startPt, [p.lat, p.lng]); } }} />}

                {route && (
                    <>
                        {/* Fastest path removed as per request */}
                        <Polyline positions={route.safest} color="#22c55e" weight={6} opacity={0.9} />
                    </>
                )}
            </MapContainer>
        </div>
    );
};

export default UnifiedMapTab;