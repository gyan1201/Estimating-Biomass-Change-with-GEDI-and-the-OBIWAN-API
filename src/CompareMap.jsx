import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MapContainer, TileLayer, Polygon, useMapEvents, useMap
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from './api.js';
import AnimationPlayer from './AnimationPlayer.jsx';
import './CompareMap.css';

const ALABAMA = [32.806671, -86.791130];
const YEARS   = [1999, 2001, 2003, 2005, 2007, 2009, 2011, 2013, 2015, 2017, 2019, 2021, 2023];

// ── Syncs secondary map to primary map's movements ──
function SyncSecondary({ primaryRef }) {
  const map = useMap();
  useEffect(() => {
    const primary = primaryRef.current;
    if (!primary) return;
    map.setView(primary.getCenter(), primary.getZoom(), { animate: false });
  }, []);
  return null;
}

// ── Primary map: listens to moves and mirrors to secondary ──
function SyncPrimary({ secondaryRef }) {
  const map = useMap();
  useMapEvents({
    move() {
      const sec = secondaryRef.current;
      if (!sec) return;
      sec.setView(map.getCenter(), map.getZoom(), { animate: false });
    },
  });
  return null;
}

// ── Secondary map: also syncs back to primary (two-way) ──
function SyncBack({ primaryRef }) {
  const map = useMap();
  useMapEvents({
    move() {
      const pri = primaryRef.current;
      if (!pri) return;
      pri.setView(map.getCenter(), map.getZoom(), { animate: false });
    },
  });
  return null;
}

// ── Draw tool on primary map ──
function DrawTool({ onFinish, drawing }) {
  const [points, setPoints] = useState([]);
  useMapEvents({
    click(e) {
      if (!drawing) return;
      setPoints(p => [...p, [e.latlng.lat, e.latlng.lng]]);
    },
    contextmenu(e) {
      if (!drawing || points.length < 3) return;
      const coords = [...points.map(p => [p[1], p[0]]), [points[0][1], points[0][0]]];
      onFinish({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } }]
      }, points);
      setPoints([]);
      e.originalEvent.preventDefault();
    },
  });
  if (points.length < 2) return null;
  return <Polygon positions={points} pathOptions={{ color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.2, weight: 2, dashArray: '6,4' }} />;
}

// ── Fly-to-Alabama button ──
function FlyBtn() {
  const map = useMap();
  return (
    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
      <button
        className="fly-btn"
        onClick={() => map.flyTo(ALABAMA, 8, { duration: 1.5 })}
      >✈ Alabama</button>
    </div>
  );
}

// ── BIOMASS TILE LAYER with loading state ──
function BiomassTile({ year, useCalibration }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setUrl(null);
    api.getBiomassMap(year, useCalibration)
      .then(d => setUrl(d?.url || null))
      .catch(() => setUrl(null))
      .finally(() => setLoading(false));
  }, [year, useCalibration]);

  if (!url) return null;
  return <TileLayer url={url} opacity={0.6} zIndex={10} />;
}

// ── MAIN COMPARE MAP ──
export default function CompareMap({ useCalibration, onAoiChange }) {
  const primaryRef   = useRef(null);
  const secondaryRef = useRef(null);

  const [drawing, setDrawing]     = useState(false);
  const [aoiPoints, setAoiPoints] = useState(null);
  const [yearA, setYearA]         = useState(1999);
  const [yearB, setYearB]         = useState(2023);

  const handleFinish = useCallback((fc, pts) => {
    setAoiPoints(pts);
    setDrawing(false);
    if (onAoiChange) onAoiChange(fc);
  }, [onAoiChange]);

  const clearAoi = () => { setAoiPoints(null); if (onAoiChange) onAoiChange(null); };

  return (
    <div className="compare-root" style={{ display: 'flex', flexDirection: 'column' }}>
      <AnimationPlayer useCalibration={useCalibration} onAnimating={() => {}}>
        {({ mode, currentUrl, tileCache, currentYear, validYears }) => {
          const isAnimating = mode === 'ready' || mode === 'loading';

          return (
            <>
              {/* ── Controls Bar ── */}
              <div className="compare-bar glass">
                <div className="compare-labels">
                  <span className="compare-label left-label">🗺️ Baseline: {yearA}</span>
                  <span className="compare-divider-label">← COMPARE →</span>
                  <span className="compare-label right-label">
                    {isAnimating ? `🌳 Animating Biomass` : `🛰️ Target: ${yearB}`}
                  </span>
                </div>
                
                {/* Year Selectors (only visible when not animating) */}
                <div className="compare-controls">
                  {!isAnimating && (
                    <>
                      <label className="ctrl-lbl">Left Year:</label>
                      <select value={yearA} onChange={e => setYearA(+e.target.value)} className="yr-select">
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>

                      <label className="ctrl-lbl">Right Year:</label>
                      <select value={yearB} onChange={e => setYearB(+e.target.value)} className="yr-select">
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </>
                  )}

                  {!drawing && !aoiPoints && !isAnimating && (
                    <button className="compare-draw-btn" onClick={() => setDrawing(true)}>
                      ✏️ Draw AOI
                    </button>
                  )}
                  {drawing && (
                    <span className="compare-hint">Left-click: add point · Right-click: finish</span>
                  )}
                  {aoiPoints && (
                    <button className="compare-clear-btn" onClick={clearAoi}>✕ Clear AOI</button>
                  )}
                </div>
              </div>

              {/* ── Two Maps Side by Side ── */}
              <div className="compare-maps" style={{ flex: 1, display: 'flex', position: 'relative' }}>
                
                {/* LEFT — Baseline Map */}
                <div className="map-half left-half" style={{ flex: 1, position: 'relative' }}>
                  <div className="map-badge left-badge">Baseline: {yearA}</div>
                  <MapContainer
                    center={ALABAMA}
                    zoom={8}
                    zoomControl={true}
                    style={{ width: '100%', height: '100%' }}
                    ref={primaryRef}
                  >
                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri World Imagery" />
                    <BiomassTile year={yearA} useCalibration={useCalibration} />
                    
                    <SyncPrimary secondaryRef={secondaryRef} />
                    <FlyBtn />
                    <DrawTool onFinish={handleFinish} drawing={drawing} />
                    {aoiPoints && (
                      <Polygon
                        positions={aoiPoints}
                        pathOptions={{ color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.15, weight: 2 }}
                      />
                    )}
                  </MapContainer>
                </div>

                {/* DIVIDER */}
                <div className="compare-divider" style={{ width: '4px', background: '#334155', zIndex: 1000 }}>
                  <div className="divider-line" />
                  <div className="divider-handle">⇔</div>
                  <div className="divider-line" />
                </div>

                {/* RIGHT — Target / Animated Map */}
                <div className="map-half right-half" style={{ flex: 1, position: 'relative' }}>
                  <div className="map-badge right-badge">
                    {isAnimating ? `Animation: ${currentYear || '...'}` : `Target: ${yearB}`}
                  </div>
                  <MapContainer
                    center={ALABAMA}
                    zoom={8}
                    zoomControl={false}
                    style={{ width: '100%', height: '100%' }}
                    ref={secondaryRef}
                  >
                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri World Imagery" />
                    
                    {/* Render Animation Layers OR Static Year B */}
                    {mode === 'ready' ? (
                      validYears.map(y => (
                        <TileLayer key={y} url={tileCache[y]} opacity={y === currentYear ? 0.65 : 0} zIndex={10} />
                      ))
                    ) : (
                      <BiomassTile year={yearB} useCalibration={useCalibration} />
                    )}

                    <SyncSecondary primaryRef={primaryRef} />
                    <SyncBack primaryRef={primaryRef} />
                    {aoiPoints && (
                      <Polygon
                        positions={aoiPoints}
                        pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.15, weight: 2 }}
                      />
                    )}
                  </MapContainer>
                </div>
              </div>
            </>
          );
        }}
      </AnimationPlayer>
    </div>
  );
}
