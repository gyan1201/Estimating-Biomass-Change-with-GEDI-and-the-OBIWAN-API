import React, { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import AnimationPlayer from './AnimationPlayer.jsx';
import './Map.css';

// Alabama center coordinates
const ALABAMA = [32.806671, -86.791130];

// Button inside the map to fly to Alabama
function FlyToAlabama() {
  const map = useMap();
  return (
    <div
      style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000 }}
      onClick={() => map.flyTo(ALABAMA, 8, { duration: 1.5 })}
    >
      <button className="map-btn primary">
        ✈ Fly to Alabama
      </button>
    </div>
  );
}

// Overlay for biomass tiles coming from the API — hidden when animation is active
function BiomassTileLayer({ url, hidden }) {
  if (!url || hidden) return null;
  return <TileLayer url={url} opacity={0.55} zIndex={5} />;
}

// Click-to-draw polygon tool
function DrawTool({ onFinish, drawing, setDrawing }) {
  const [points, setPoints] = useState([]);

  useMapEvents({
    click(e) {
      if (!drawing) return;
      const newPts = [...points, [e.latlng.lat, e.latlng.lng]];
      setPoints(newPts);
    },
    contextmenu(e) {
      if (!drawing || points.length < 3) return;
      // Right-click to finish polygon
      const coords = [...points.map(p => [p[1], p[0]]), [points[0][1], points[0][0]]];
      const featureCollection = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } }],
      };
      onFinish(featureCollection, points);
      setPoints([]);
      setDrawing(false);
      e.originalEvent.preventDefault();
    },
  });

  if (points.length < 2) return null;
  return (
    <Polygon
      positions={points}
      pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.25, weight: 2, dashArray: '6,4' }}
    />
  );
}

export default function Map({ onAoiChange, biomassUrl, useCalibration }) {
  const [drawing, setDrawing] = useState(false);
  const [finishedPoints, setFinishedPoints] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFinish = useCallback((featureCollection, pts) => {
    setFinishedPoints(pts);
    onAoiChange(featureCollection);
  }, [onAoiChange]);

  const clearAoi = () => {
    setFinishedPoints(null);
    setDrawing(false);
    onAoiChange(null);
  };

  return (
    <div className="map-wrapper">
      {/* Controls */}
      <div className="map-controls">
        {!drawing && !finishedPoints && (
          <button className="map-btn primary" onClick={() => setDrawing(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            Draw AOI
          </button>
        )}
        {drawing && (
          <span className="map-hint">
            Left-click to add points · Right-click to finish ({'>'}2 points needed)
          </span>
        )}
        {finishedPoints && (
          <button className="map-btn danger" onClick={clearAoi}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Clear Selection
          </button>
        )}
      </div>

      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Esri World Imagery"
        />
        <FlyToAlabama />
        <BiomassTileLayer url={biomassUrl} hidden={isAnimating} />
        <DrawTool onFinish={handleFinish} drawing={drawing} setDrawing={setDrawing} />
        {finishedPoints && (
          <Polygon
            positions={finishedPoints}
            pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.2, weight: 2 }}
          />
        )}
        <AnimationPlayer useCalibration={useCalibration} onAnimating={setIsAnimating} />
      </MapContainer>
    </div>
  );
}
