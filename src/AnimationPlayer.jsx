import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from './api.js';
import './AnimationPlayer.css';

const YEARS = [1999, 2001, 2003, 2005, 2007, 2009, 2011, 2013, 2015, 2017, 2019, 2021, 2023];

// Gradient Legend for Biomass Density
function BiomassGradientLegend() {
  return (
    <div style={{
      background: 'rgba(7, 11, 20, 0.85)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.2)',
      padding: '8px 12px',
      borderRadius: '8px',
      color: 'white',
      fontSize: '0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      alignItems: 'center',
      pointerEvents: 'none',
      width: '100%',
      maxWidth: '240px',
      margin: '0 auto',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Biomass Density</div>
      <div style={{
        width: '100%',
        height: '10px',
        background: 'linear-gradient(to right, #ffffe5, #d9f0a3, #78c679, #238443, #004529)',
        borderRadius: '5px'
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', opacity: 0.8 }}>
        <span>Low</span>
        <span>High (150+)</span>
      </div>
    </div>
  );
}

function yearColor(year) {
  const idx = YEARS.indexOf(year);
  const t = idx / (YEARS.length - 1);
  const r = Math.round(200 - t * 150);
  const g = Math.round(150 + t * 105);
  const b = Math.round(20 + t * 20);
  return `rgb(${r},${g},${b})`;
}

export default function AnimationPlayer({ useCalibration, onAnimating, children }) {
  const [tileCache, setTileCache]     = useState({});
  const [loading, setLoading]         = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [speed, setSpeed]             = useState(1200);
  const [mode, setMode]               = useState('idle');

  const intervalRef = useRef(null);

  useEffect(() => {
    if (onAnimating) onAnimating(mode === 'ready' || mode === 'loading');
  }, [mode, onAnimating]);

  const preloadTiles = useCallback(async () => {
    setMode('loading');
    setLoading(true);
    setLoadProgress(0);

    const cache = {};
    let completed = 0;

    // Concurrent fetching for massive speedup
    await Promise.all(YEARS.map(async (y) => {
      try {
        const data = await api.getBiomassMap(y, useCalibration);
        if (data?.url) cache[y] = data.url;
      } catch (_) {}
      completed++;
      setLoadProgress(Math.round((completed / YEARS.length) * 100));
    }));

    setTileCache(cache);
    setLoading(false);
    setMode('ready');
    setCurrentIdx(0);
  }, [useCalibration]);

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
      {/* Render the map(s) through the render prop */}
      {children({ mode, currentUrl, tileCache, currentYear, validYears })}

      {/* Player UI */}
      <div className={`anim-player mode-${mode}`}>
        {mode === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <BiomassGradientLegend />
            <button className="anim-btn preload-btn" onClick={preloadTiles}>
              <span className="anim-icon">▶</span>
              Animate Biomass Years
            </button>
          </div>
        )}

        {mode === 'loading' && (
          <div className="anim-loading">
            <div className="anim-progress-wrap">
              <div className="anim-progress-bar" style={{ width: `${loadProgress}%` }} />
            </div>
            <span>Loading {loadProgress}% — fetching {YEARS.length} year tiles...</span>
          </div>
        )}

        {mode === 'ready' && (
          <div className="anim-controls">
            <div className="anim-year-badge" style={{ borderColor: yearColor(currentYear), color: yearColor(currentYear) }}>
              <span className="anim-year-label">YEAR</span>
              <span className="anim-year-num">{currentYear ?? '—'}</span>
            </div>

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

            <div className="anim-row">
              <button className="anim-btn ctrl-btn" onClick={() => { setCurrentIdx(0); setIsPlaying(false); }} title="Reset">⏮</button>
              <button className={`anim-btn ctrl-btn play-btn ${isPlaying ? 'active' : ''}`} onClick={() => setIsPlaying(p => !p)}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button className="anim-btn ctrl-btn" onClick={() => { setCurrentIdx(i => Math.max(0, i - 1)); setIsPlaying(false); }} title="Previous">◀</button>
              <button className="anim-btn ctrl-btn" onClick={() => { setCurrentIdx(i => Math.min(validYears.length - 1, i + 1)); setIsPlaying(false); }} title="Next">▶</button>

              <div className="anim-speed">
                <span>🐢</span>
                <input
                  type="range"
                  min={400}
                  max={2400}
                  step={200}
                  value={2800 - speed}
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
            
            <div style={{ marginTop: '8px' }}>
              <BiomassGradientLegend />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
