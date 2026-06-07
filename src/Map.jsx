import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, useMapEvents, useMap, LayersControl, WMSTileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import AnimationPlayer from './AnimationPlayer.jsx';
import { HotspotMarkers } from './Hotspots.jsx';
import './Map.css';

// Alabama center coordinates
const ALABAMA = [32.806671, -86.791130];



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

function BottomLeftControls({ drawing, setDrawing, finishedPoints, clearAoi }) {
  const map = useMap();
  return (
    <div className="map-controls" style={{ position: 'absolute', bottom: 30, left: 12, top: 'auto', zIndex: 1000, display: 'flex', gap: '8px', alignItems: 'center' }}>
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
  );
}

function BottomRightControls() {
  const map = useMap();
  return (
    <div className="map-controls" style={{ position: 'absolute', bottom: 30, right: 12, top: 'auto', left: 'auto', zIndex: 1000 }}>
      <button className="map-btn primary" onClick={() => map.flyTo(ALABAMA, 8, { duration: 1.5 })}>
        ✈ Fly to Alabama
      </button>
    </div>
  );
}

export default function Map({ onAoiChange, biomassUrl, useCalibration }) {
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


      <MapContainer center={ALABAMA} zoom={7} zoomControl={true} style={{ height: '100%', width: '100%' }}>
        <LayersControl position="topright">
          {/* ── BASE LAYERS ── */}
          <LayersControl.BaseLayer checked name="Satellite Imagery (Esri)">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri World Imagery" />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="Terrain / Elevation (Esri)">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}" attribution="Esri Terrain" />
          </LayersControl.BaseLayer>

          {/* ── OVERLAYS ── */}
          <LayersControl.Overlay name="Land Cover 2021 (ESA WorldCover)">
            <WMSTileLayer
              url="https://services.terrascope.be/wms/v2"
              layers="WORLDCOVER_2021_MAP"
              format="image/png"
              transparent={true}
              attribution="ESA WorldCover"
              opacity={0.7}
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Active Fires (NASA FIRMS / GIBS)">
            <WMSTileLayer
              url="https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi"
              layers="MODIS_Terra_Thermal_Anomalies_All"
              format="image/png"
              transparent={true}
              attribution="NASA GIBS"
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Forest Loss (Hansen GFC)">
            <TileLayer
              url="https://storage.googleapis.com/earthenginepartners-hansen/tiles/gfc_v1.10/loss_tree_gain/{z}/{x}/{y}.png"
              attribution="Hansen/UMD/Google/USGS/NASA"
              opacity={0.8}
            />
          </LayersControl.Overlay>
        </LayersControl>

        <BottomLeftControls 
          drawing={drawing} 
          setDrawing={setDrawing} 
          finishedPoints={finishedPoints} 
          clearAoi={clearAoi} 
        />
        <BottomRightControls />
        <BiomassTileLayer url={biomassUrl} hidden={false} />
        
        {!drawing && <HotspotMarkers onSelect={selectHotspot} />}

        <DrawTool onFinish={handleFinish} drawing={drawing} setDrawing={setDrawing} />
        {finishedPoints && <Polygon positions={finishedPoints} pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.2, weight: 2 }} />}
      </MapContainer>
    </div>
  );
}
