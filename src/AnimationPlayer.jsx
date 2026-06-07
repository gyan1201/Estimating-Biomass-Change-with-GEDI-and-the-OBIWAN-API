import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from './api.js';
import './AnimationPlayer.css';

const YEARS = [1999, 2001, 2003, 2005, 2007, 2009, 2011, 2013, 2015, 2017, 2019, 2021, 2023];

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
      <div className="anim-player" style={{ position: mode === 'idle' ? 'absolute' : 'relative', bottom: mode === 'idle' ? 20 : 0, left: mode === 'idle' ? 20 : 0, right: mode === 'idle' ? 'auto' : 0, width: mode === 'idle' ? 'auto' : '100%', zIndex: 1000 }}>
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
          </div>
        )}
      </div>
    </>
  );
}
