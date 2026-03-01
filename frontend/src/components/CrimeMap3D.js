import React, { useEffect, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// Default: Center on Los Angeles (Safety Fallback)
const DEFAULT_VIEW_STATE = {
  longitude: -118.2437,
  latitude: 34.0522,
  zoom: 10,
  minZoom: 5,
  maxZoom: 15,
  pitch: 45,
  bearing: 0
};

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const COLOR_RANGE = [
  [1, 152, 189],
  [73, 227, 206],
  [216, 254, 181],
  [254, 237, 177],
  [254, 173, 84],
  [209, 55, 78]
];

export default function CrimeMap3D({ data }) {
  const [viewState, setViewState] = useState(DEFAULT_VIEW_STATE);

  useEffect(() => {
    // 🔍 DEBUGGING LOGS
    console.log("📊 3D Map Received Data:", data ? data.length : "None");
    
    if (data && data.length > 0) {
      const firstItem = data[0];
      console.log("🧐 Sample Point:", firstItem);

      // Check valid keys
      const lat = Number(firstItem.lat || firstItem.latitude || firstItem.LAT);
      const lng = Number(firstItem.lng || firstItem.lon || firstItem.longitude || firstItem.LON);

      if (isNaN(lat) || isNaN(lng)) {
        console.error("❌ Coordinates appear invalid/missing in the first record!");
        return;
      }

      // Calculate Average safely
      let totalLat = 0;
      let totalLon = 0;
      let validPoints = 0;

      data.forEach(d => {
        const l = Number(d.lat || d.latitude || d.LAT);
        const g = Number(d.lng || d.lon || d.longitude || d.LON);
        if (!isNaN(l) && !isNaN(g) && l !== 0 && g !== 0) {
          totalLat += l;
          totalLon += g;
          validPoints++;
        }
      });

      if (validPoints > 0) {
        const avgLat = totalLat / validPoints;
        const avgLon = totalLon / validPoints;
        
        console.log(`🎥 Flying Camera to: ${avgLat.toFixed(4)}, ${avgLon.toFixed(4)}`);
        
        setViewState(prev => ({
          ...prev,
          latitude: avgLat,
          longitude: avgLon,
          zoom: 11,
          transitionDuration: 1000
        }));
      }
    }
  }, [data]);

  const layers = [
    new HexagonLayer({
      id: 'crime-heatmap',
      data,
      pickable: true,
      extruded: true,
      radius: 200,
      elevationScale: 20, 
      
      // 🔧 ROBUST COORDINATE PARSING
      getPosition: d => {
        const lat = Number(d.lat || d.latitude || d.LAT);
        const lng = Number(d.lng || d.lon || d.longitude || d.LON);
        return [lng, lat];
      },
      
      getElevationWeight: d => 1,
      elevationAggregation: 'SUM',
      colorRange: COLOR_RANGE,
    })
  ];

  return (
    <div style={{ height: '600px', width: '100%', position: 'relative' }}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={true}
        layers={layers}
        getTooltip={({object}) => object && `Crimes: ${object.elevationValue}`}
      >
        <Map reuseMaps mapStyle={MAP_STYLE} />
      </DeckGL>
    </div>
  );
}