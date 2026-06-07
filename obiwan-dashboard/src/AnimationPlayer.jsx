import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import api from './api.js';
import './AnimationPlayer.css';

const YEARS = [1999, 2001, 2003, 2005, 2007, 2009, 2011, 2013, 2015, 2017, 2019, 2021, 2023];

// Gradient color for each year frame (green intensity increases with biomass)
function yearColor(year) {
  const idx = YEARS.indexOf(year);
  const t = idx / (YEARS.length - 1);
  // From olive-yellow → bright green → deep forest green
  const r = Math.round(200 - t * 150);
  const g = Math.round(150 + t * 105);
  const b = Math.round(20 + t * 20);
  return `rgb(${r},${g},${b})`;
}

// Renders the animated biomass tile at low opacity so satellite imagery shows through
function ActiveTile({ url }) {
  if (!url) return null;
  return <TileLayer url={url} opacity={0.55} zIndex={10} />;
}

export default function AnimationPlayer({ useCalibration, onAnimating }) {
  const map = useMap();

  const [tileCache, setTileCache]     = useState({});          // year → url
  const [loading, setLoading]         = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [speed, setSpeed]             = useState(1200);         // ms per frame
  const [mode, setMode]               = useState('idle');       // idle | loading | ready | playing

  const intervalRef = useRef(null);

  // Tell parent when animation is active so it hides its own static tile layer
  useEffect(() => {
    if (onAnimating) onAnimating(mode === 'ready' || mode === 'loading');
  }, [mode]);

  // Pre-fetch all tile URLs from the API
  const preloadTiles = useCallback(async () => {
    setMode('loading');
    setLoading(true);
    setLoadProgress(0);

    const cache = {};
    for (let i = 0; i < YEARS.length; i++) {
      const y = YEARS[i];
      try {
        const data = await api.getBiomassMap(y, useCalibration);
        if (data?.url) cache[y] = data.url;
      } catch (_) {
        // skip years with no data
      }
      setLoadProgress(Math.round(((i + 1) / YEARS.length) * 100));
    }

    setTileCache(cache);
    setLoading(false);
    setMode('ready');
    setCurrentIdx(0);
  }, [useCalibration]);

  // Play/pause logic
  useEffect(() => {
    if (isPlaying && mode === 'ready') {
      const validYears = YEARS.filter(y => tileCache[y]);
      intervalRef.current = setInterval(() => {
        setCurrentIdx(i => (i + 1) % validYears.length);
      }, speed);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, mode, tileCache]);

  const validYears = YEARS.filter(y => tileCache[y]);
  const currentYear = validYears[currentIdx] ?? null;
  const currentUrl  = currentYear ? tileCache[currentYear] : null;

  return (
    <>
      {/* Tile Overlay */}
      {mode === 'ready' && currentUrl && <ActiveTile url={currentUrl} />}

      {/* Player UI — sits inside the map via absolute positioning */}
      <div className="anim-player">
        {mode === 'idle' && (
          <button className="anim-btn preload-btn" onClick={preloadTiles}>
            <span className="anim-icon">▶</span>
            Animate Biomass Years
          </button>
        )}

        {mode === 'loading' && (
          <div className="anim-loading">
            <div className="anim-progress-wrap">
              <div className="anim-progress-bar" style={{ width: `${loadProgress}%` }} />
            </div>
            <span>Loading {loadProgress}% — fetching {YEARS.length} year tiles…</span>
          </div>
        )}

        {mode === 'ready' && (
          <div className="anim-controls">
            {/* Year badge */}
            <div className="anim-year-badge" style={{ borderColor: yearColor(currentYear), color: yearColor(currentYear) }}>
              <span className="anim-year-label">YEAR</span>
              <span className="anim-year-num">{currentYear ?? '—'}</span>
            </div>

            {/* Scrubber */}
            <div className="anim-scrubber">
              {validYears.map((y, i) => (
                <button
                  key={y}
                  className={`anim-tick ${i === currentIdx ? 'active' : ''}`}
                  style={i === currentIdx ? { background: yearColor(y) } : {}}
                  onClick={() => { setCurrentIdx(i); setIsPlaying(false); }}
                  title={y}
                />
              ))}
            </div>

            {/* Controls row */}
            <div className="anim-row">
              <button
                className="anim-btn ctrl-btn"
                onClick={() => { setCurrentIdx(0); setIsPlaying(false); }}
                title="Reset"
              >⏮</button>

              <button
                className={`anim-btn ctrl-btn play-btn ${isPlaying ? 'active' : ''}`}
                onClick={() => setIsPlaying(p => !p)}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>

              <button
                className="anim-btn ctrl-btn"
                onClick={() => { setCurrentIdx(i => Math.max(0, i - 1)); setIsPlaying(false); }}
                title="Previous"
              >◀</button>

              <button
                className="anim-btn ctrl-btn"
                onClick={() => { setCurrentIdx(i => Math.min(validYears.length - 1, i + 1)); setIsPlaying(false); }}
                title="Next"
              >▶</button>

              {/* Speed slider */}
              <div className="anim-speed">
                <span>🐢</span>
                <input
                  type="range"
                  min={400}
                  max={2400}
                  step={200}
                  value={2800 - speed}  // invert so right = faster
                  onChange={e => setSpeed(2800 - Number(e.target.value))}
                />
                <span>🐇</span>
              </div>

              <button
                className="anim-btn ctrl-btn close-btn"
                onClick={() => { setMode('idle'); setIsPlaying(false); setTileCache({}); if (onAnimating) onAnimating(false); }}
                title="Close"
              >✕</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
