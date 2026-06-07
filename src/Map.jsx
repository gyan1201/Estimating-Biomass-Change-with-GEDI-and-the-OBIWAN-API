import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, useMapEvents, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix React-Leaflet default marker icons missing in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});
import 'leaflet/dist/leaflet.css';
import AnimationPlayer from './AnimationPlayer.jsx';
import './Map.css';

// Alabama center coordinates
const ALABAMA = [32.806671, -86.791130];

// Active Change Zones
const HOTSPOTS = [
  {
    id: 1,
    name: "Mobile Delta Deforestation",
    type: "loss",
    lat: 31.05,
    lng: -88.0,
    desc: "Significant biomass loss due to timber harvesting or natural events.",
    points: [[31.1, -88.1], [31.1, -87.9], [30.9, -87.9], [30.9, -88.1]]
  },
  {
    id: 2,
    name: "Talladega Regrowth Edge",
    type: "gain",
    lat: 33.4,
    lng: -85.8,
    desc: "Rapid regeneration and biomass gain along the national forest boundary.",
    points: [[33.45, -85.85], [33.45, -85.75], [33.35, -85.75], [33.35, -85.85]]
  },
  {
    id: 3,
    name: "Black Belt Agricultural Shift",
    type: "mixed",
    lat: 32.3,
    lng: -87.0,
    desc: "Dynamic change zone with active land-use conversion.",
    points: [[32.35, -87.05], [32.35, -86.95], [32.25, -86.95], [32.25, -87.05]]
  }
];

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

export default function Map({ onAoiChange, biomassUrl, changeMapUrl, useCalibration }) {
  const [drawing, setDrawing] = useState(false);
  const [finishedPoints, setFinishedPoints] = useState(null);

  const handleFinish = useCallback((featureCollection, pts) => {
    setFinishedPoints(pts);
    onAoiChange(featureCollection);
  }, [onAoiChange]);

  const clearAoi = () => {
    setFinishedPoints(null);
    setDrawing(false);
    onAoiChange(null);
  };

  const selectHotspot = (hotspot) => {
    const coords = [...hotspot.points.map(p => [p[1], p[0]]), [hotspot.points[0][1], hotspot.points[0][0]]];
    const fc = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } }],
    };
    handleFinish(fc, hotspot.points);
  };

  return (
    <div className="map-wrapper" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Controls Overlay */}
      <div className="map-controls" style={{ position: 'absolute', zIndex: 1000, top: 12, left: 12 }}>
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

      <MapContainer center={ALABAMA} zoom={6} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri World Imagery" />
        <FlyToAlabama />
        <BiomassTileLayer url={biomassUrl} hidden={false} />
        {changeMapUrl && <TileLayer url={changeMapUrl} opacity={0.7} zIndex={6} />}
        
        {!drawing && HOTSPOTS.map(h => (
          <Marker key={h.id} position={[h.lat, h.lng]}>
            <Popup>
              <div style={{ padding: '4px', textAlign: 'center' }}>
                <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                  {h.type === 'loss' ? '🔥' : h.type === 'gain' ? '🌱' : '🔄'} {h.name}
                </strong>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>{h.desc}</p>
                <button 
                  onClick={() => selectHotspot(h)}
                  style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}
                >
                  Analyze Zone
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        <DrawTool onFinish={handleFinish} drawing={drawing} setDrawing={setDrawing} />
        {finishedPoints && <Polygon positions={finishedPoints} pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.2, weight: 2 }} />}
      </MapContainer>
    </div>
  );
}
