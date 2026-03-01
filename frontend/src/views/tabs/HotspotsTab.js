// frontend/src/views/tabs/HotspotsTab.js

import React, { useState, useEffect, useMemo } from 'react';
import { getHotspots } from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

// Fix for default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to programmatically change the map's view
function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

// Component that correctly applies the heatmap layer
const HeatmapLayer = ({ heatData }) => {
    // Use the official useMap hook from react-leaflet
    const map = useMap();

    useEffect(() => {
        if (!heatData || heatData.length === 0) {
            return;
        }

        // Create the heat layer and add it to the map
        const heatLayer = L.heatLayer(heatData, { radius: 25 }).addTo(map);

        // Cleanup function: remove the layer when the component is unmounted or data changes
        return () => {
            map.removeLayer(heatLayer);
        };
    }, [map, heatData]); // Re-run effect if map instance or heatData changes

    return null; // This component does not render any visible DOM element
};


const HotspotsTab = ({ activeFilters }) => {
    const [hotspotData, setHotspotData] = useState({ centers: [], heat_data: [] });
    const [numClusters, setNumClusters] = useState(10);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!activeFilters) return;
            setLoading(true);
            try {
                const response = await getHotspots(activeFilters, numClusters);
                setHotspotData(response.data);
            } catch (error) {
                console.error("Failed to fetch hotspots:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeFilters, numClusters]);

    const mapCenter = useMemo(() => {
        if (hotspotData.heat_data.length > 0) {
            const lats = hotspotData.heat_data.map(p => p[0]);
            const lons = hotspotData.heat_data.map(p => p[1]);
            return [lats.reduce((a, b) => a + b, 0) / lats.length, lons.reduce((a, b) => a + b, 0) / lons.length];
        }
        return [34.0522, -118.2437]; // Default to LA
    }, [hotspotData.heat_data]);


    return (
        <div>
            <h3 className="text-xl font-bold mb-4">Crime Hotspots & Heatmap</h3>
            <div className="mb-4">
                <label htmlFor="clusters" className="block text-sm font-medium text-gray-700">Number of Hotspot Clusters: {numClusters}</label>
                <input
                    id="clusters"
                    type="range"
                    min="5"
                    max="25"
                    value={numClusters}
                    onChange={(e) => setNumClusters(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
            </div>
            {loading ? <p className="text-center">Loading map...</p> : (
                <MapContainer center={mapCenter} zoom={11} style={{ height: '500px', width: '100%', borderRadius: '8px' }}>
                    {/* This component will re-center the map when the data loads */}
                    <ChangeView center={mapCenter} zoom={11} />

                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    
                    {/* This component now correctly gets the map instance and adds the layer */}
                    <HeatmapLayer heatData={hotspotData.heat_data} />

                    {hotspotData.centers.map((center, idx) => (
                        <Marker key={idx} position={[center[0], center[1]]}>
                            <Popup>Hotspot Cluster {idx + 1}</Popup>
                        </Marker>
                    ))}
                </MapContainer>
            )}
        </div>
    );
};

export default HotspotsTab;