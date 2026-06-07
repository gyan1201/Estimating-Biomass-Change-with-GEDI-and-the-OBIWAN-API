import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MapContainer, TileLayer, Polygon, useMapEvents, useMap
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from './api.js';
import './CompareMap.css';

const ALABAMA = [32.806671, -86.791130];
const YEARS   = [1999, 2001, 2003, 2005, 2007, 2009, 2011, 2013, 2015, 2017, 2019, 2021, 2023];

// ── Syncs secondary map to primary map's movements ──
function SyncSecondary({ primaryRef }) {
  const map = useMap();
  useEffect(() => {
    const primary = primaryRef.current;
    if (!primary) return;
    // Copy current view immediately
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

  const [drawing, setDrawing]           = useState(false);
  const [aoiPoints, setAoiPoints]       = useState(null);
  const [biomassYear, setBiomassYear]   = useState(2021);

  const handleFinish = useCallback((fc, pts) => {
    setAoiPoints(pts);
    setDrawing(false);
    if (onAoiChange) onAoiChange(fc);
  }, [onAoiChange]);

  const clearAoi = () => { setAoiPoints(null); if (onAoiChange) onAoiChange(null); };

  return (
    <div className="compare-root">
      {/* ── Controls Bar ── */}
      <div className="compare-bar glass">
        <div className="compare-labels">
          <span className="compare-label left-label">🗺️ Reference Map (Street)</span>
          <span className="compare-divider-label">← COMPARE →</span>
          <span className="compare-label right-label">🛰️ OBIWAN Biomass Overlay</span>
        </div>
        <div className="compare-controls">
          <label className="ctrl-lbl">Biomass Year:</label>
          <select
            value={biomassYear}
            onChange={e => setBiomassYear(+e.target.value)}
            className="yr-select"
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            <option value={2023}>2023</option>
          </select>

          {!drawing && !aoiPoints && (
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
      <div className="compare-maps">
        {/* LEFT — Street Reference Map */}
        <div className="map-half left-half">
          <div className="map-badge left-badge">Street / Reference</div>
          <MapContainer
            center={ALABAMA}
            zoom={8}
            zoomControl={true}
            style={{ width: '100%', height: '100%' }}
            ref={primaryRef}
          >
            {/* OpenStreetMap tile — looks like Google Maps style */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png"
              attribution="&copy; CartoDB"
              maxZoom={19}
            />
            {/* Also show a road overlay */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
              opacity={0.4}
              maxZoom={19}
            />
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
        <div className="compare-divider">
          <div className="divider-line" />
          <div className="divider-handle">⇔</div>
          <div className="divider-line" />
        </div>

        {/* RIGHT — Satellite + OBIWAN Biomass */}
        <div className="map-half right-half">
          <div className="map-badge right-badge">GEDI Biomass · {biomassYear}</div>
          <MapContainer
            center={ALABAMA}
            zoom={8}
            zoomControl={false}
            style={{ width: '100%', height: '100%' }}
            ref={secondaryRef}
          >
            {/* Satellite base */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Esri World Imagery"
            />
            {/* OBIWAN biomass overlay */}
            <BiomassTile year={biomassYear} useCalibration={useCalibration} />
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

      {/* Legend */}
      <div className="compare-legend glass">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#10B981' }} />
          High Biomass
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#F59E0B' }} />
          Medium Biomass
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#EF4444' }} />
          Low Biomass
        </span>
        <span className="legend-sep">|</span>
        <span className="legend-text">Powered by NASA GEDI L4B via OBIWAN API · {biomassYear}</span>
      </div>
    </div>
  );
}
