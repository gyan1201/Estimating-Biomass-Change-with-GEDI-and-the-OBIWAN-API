import React, { useState, useCallback, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import Map from './Map.jsx';
import api from './api.js';
import Visuals from './Visuals.jsx';
import CompareMap from './CompareMap.jsx';
import KidGuide from './KidGuide.jsx';
import Glossary from './Glossary.jsx';
import AIAnalyst from './AIAnalyst.jsx';
import AIForecast from './AIForecast.jsx';
import Topbar from './Topbar.jsx';
import AIChat from './AIChat.jsx';
import './Dashboard.css';

// ===== HELPERS =====
const fmt = (val, digits = 2) => (val == null || isNaN(val) ? '—' : Number(val).toFixed(digits));
const fmtSigned = (val, digits = 2) => (val == null || isNaN(val) ? '—' : (Number(val) >= 0 ? '+' : '') + Number(val).toFixed(digits));
// ===== SMALL HELPERS =====
const Loader = () => (
  <div className="loader-wrap">
    <div className="loader-ring"/>
    <span>Querying OBIWAN API...</span>
  </div>
);

const EmptyState = ({ icon, text }) => (
  <div className="empty-state">
    <div className="empty-icon">{icon}</div>
    <p>{text}</p>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tt-label">{label ?? payload[0]?.payload?.Year}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ===== METRIC CARD =====
function MetricCard({ label, value, unit, change, colorClass, icon, loading }) {
  return (
    <motion.div
      className={`metric-card glass ${colorClass}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mc-icon">{icon}</div>
      <div className="mc-body">
        <span className="mc-label">{label}</span>
        {loading ? (
          <span className="mc-loading pulse">—</span>
        ) : (
          <span className="mc-value">{value} <span className="mc-unit">{unit}</span></span>
        )}
        {change !== undefined && !loading && (
          <span className={`mc-change ${change >= 0 ? 'positive' : 'negative'}`}>
            {change >= 0 ? '▲' : '▼'} {fmt(Math.abs(change))} Mg/ha/yr
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ===== MAIN DASHBOARD =====
export default function Dashboard({ activeView, onOpenCmd, onToggleNotif }) {
  const [aoi, setAoi] = useState(null);
  const [useCalibration, setUseCalibration] = useState(false);
  const [activeTab, setActiveTab]     = useState('annual');

  // Derive mode flags from the activeView prop
  const compareMode = activeView === 'compare';
  const storyMode = activeView === 'story';
  const glossaryMode = activeView === 'glossary';
  const aiAnalystMode = activeView === 'ai-analyst';
  const forecastMode = activeView === 'forecast';
  const isDashboard = activeView === 'dashboard';



  // Biomass map overlay
  const [biomassYear, setBiomassYear] = useState(2021);
  const [biomassUrl, setBiomassUrl] = useState(null);
  const [loadingMap, setLoadingMap] = useState(false);

  // Annual trend
  const [annualData, setAnnualData] = useState([]);
  const [loadingAnnual, setLoadingAnnual] = useState(false);

  // Point-in-time stock
  const [stockYear, setStockYear] = useState(2021);
  const [stockData, setStockData] = useState(null);
  const [loadingStock, setLoadingStock] = useState(false);

  // Change estimation
  const [changeStart, setChangeStart] = useState(2007);
  const [changeEnd, setChangeEnd] = useState(2021);
  const [changeData, setChangeData] = useState(null);
  const [loadingChange, setLoadingChange] = useState(false);

  // Additionality
  const [addBaseStart, setAddBaseStart] = useState(2010);
  const [addBaseEnd, setAddBaseEnd] = useState(2015);
  const [addTargetStart, setAddTargetStart] = useState(2016);
  const [addTargetEnd, setAddTargetEnd] = useState(2021);
  const [additionalityData, setAdditionalityData] = useState(null);
  const [loadingAdd, setLoadingAdd] = useState(false);

  // Command Palette Listener
  useEffect(() => {
    const handleCmdAction = (e) => {
      const action = e.detail;
      if (action === 'toggle-cal') setUseCalibration(c => !c);
      else if (action === 'export-csv') handleExportCSV();
      else if (action === 'export-json') handleExportJSON();
    };
    document.addEventListener('cmd-action', handleCmdAction);
    return () => document.removeEventListener('cmd-action', handleCmdAction);
  }, [annualData, stockData]);

  const [error, setError] = useState(null);

  const humanError = (e) => {
    if (e.message.includes('500')) {
      return '⚠ This area has no GEDI data. The OBIWAN API covers Alabama, USA only. Please draw your AOI over Alabama (use the "Fly to Alabama" button on the map).';
    }
    return e.message;
  };

  // ── Load biomass tile overlay whenever year/calibration changes ──
  useEffect(() => {
    setLoadingMap(true);
    api.getBiomassMap(biomassYear, useCalibration)
      .then(data => setBiomassUrl(data?.url || null))
      .catch(() => setBiomassUrl(null))
      .finally(() => setLoadingMap(false));
  }, [biomassYear, useCalibration]);

  // ── When AOI is drawn, auto-run all analyses ──
  useEffect(() => {
    if (!aoi) { setAnnualData([]); setStockData(null); setChangeData(null); setAdditionalityData(null); return; }
    runAllAnalyses();
  }, [aoi, useCalibration]);

  const runAllAnalyses = async () => {
    if (!aoi) return;
    setError(null);

    // Annual trend
    setLoadingAnnual(true);
    api.annualStock(aoi, useCalibration)
      .then(data => {
        const sorted = [...data].sort((a, b) => (a.Year || a.year) - (b.Year || b.year));
        setAnnualData(sorted.map(d => ({ year: d.Year || d.year, AGBD: d.AGBD != null ? +Number(d.AGBD).toFixed(2) : null, stdAGBD: d.stdAGBD != null ? +Number(d.stdAGBD).toFixed(2) : null })));
      })
      .catch(e => setError(humanError(e)))
      .finally(() => setLoadingAnnual(false));

    // Point-in-time stock
    setLoadingStock(true);
    api.estimateStock(stockYear, aoi, useCalibration)
      .then(d => setStockData(d))
      .catch(e => setError(humanError(e)))
      .finally(() => setLoadingStock(false));

    // Change
    setLoadingChange(true);
    api.estimateChange(changeStart, changeEnd, aoi, useCalibration)
      .then(d => setChangeData(d))
      .catch(e => setError(humanError(e)))
      .finally(() => setLoadingChange(false));

    // Additionality
    setLoadingAdd(true);
    api.estimateAdditionality(addBaseStart, addBaseEnd, addTargetStart, addTargetEnd, aoi, useCalibration)
      .then(d => setAdditionalityData(d))
      .catch(e => setError(humanError(e)))
      .finally(() => setLoadingAdd(false));
  };

  const annualRate = annualData.length >= 2
    ? ((annualData[annualData.length - 1].AGBD - annualData[0].AGBD) / (annualData.length - 1))
    : null;

  const latestAGBD = annualData.length > 0 ? annualData[annualData.length - 1].AGBD : null;

  const YEARS = Array.from({ length: 13 }, (_, i) => 1999 + i * 2);

  // --- Feature 6: Data Export ---
  const handleExportCSV = () => {
    if (!annualData || annualData.length === 0) return;
    const headers = "Year,AGBD (Mg/ha),Std_AGBD\n";
    const rows = annualData.map(d => `${d.year},${d.AGBD},${d.stdAGBD || ''}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biotrace-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportJSON = () => {
    if (!annualData || annualData.length === 0) return;
    const exportData = {
      aoi: aoi,
      annualData: annualData,
      stockData: stockData,
      changeData: changeData
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biotrace-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // --- Feature 7: AOI Bookmarks ---
  const [savedRegions, setSavedRegions] = useState(() => JSON.parse(localStorage.getItem('savedRegions') || '[]'));
  const [bookmarkName, setBookmarkName] = useState('');

  const saveRegion = () => {
    if (!aoi) return;
    const name = bookmarkName || `Region ${savedRegions.length + 1}`;
    const newRegions = [...savedRegions, { name, aoi }];
    setSavedRegions(newRegions);
    localStorage.setItem('savedRegions', JSON.stringify(newRegions));
    setBookmarkName('');
  };

  const loadRegion = (region) => {
    setAoi(region.aoi);
  };

  return (
    <div className="dashboard" style={{ display: activeView === 'settings' ? 'none' : 'flex' }}>
      <Topbar 
        activeView={activeView}
        onOpenCmd={onOpenCmd}
        hasUnreadNotifications={false}
        toggleNotifications={onToggleNotif}
        aoi={aoi}
        annualData={annualData}
        stockData={stockData}
      />

      <AIChat 
        aoi={aoi}
        annualData={annualData}
        stockData={stockData}
      />

      {/* ── DASHBOARD CONTROLS ── */}
      <header className="dashboard-controls glass" style={{ display: isDashboard ? 'flex' : 'none' }}>
        <div className="dc-left">
          {/* Biomass Map Year */}
          <div className="control-group">
            <label>Biomass Layer Year</label>
            <select value={biomassYear} onChange={e => setBiomassYear(+e.target.value)}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              <option value={2023}>2023</option>
            </select>
          </div>

          {/* Calibration Toggle */}
          <label className="toggle-control">
            <div
              className={`toggle-switch ${useCalibration ? 'on' : ''}`}
              onClick={() => setUseCalibration(c => !c)}
            >
              <div className="toggle-knob"/>
            </div>
            <span>Inventory Calibration</span>
          </label>
        </div>

        <div className="dc-center">
          {/* Bookmark Manager */}
          <div className="bookmark-manager">
            <input 
              type="text" 
              placeholder="Name this region..." 
              value={bookmarkName} 
              onChange={e => setBookmarkName(e.target.value)}
              disabled={!aoi}
            />
            <button onClick={saveRegion} disabled={!aoi} title="Save AOI">💾 Save</button>
            <select onChange={(e) => {
              const r = savedRegions.find(sr => sr.name === e.target.value);
              if (r) loadRegion(r);
            }} value="">
              <option value="" disabled>Load Region...</option>
              {savedRegions.map((r, i) => <option key={i} value={r.name}>{r.name}</option>)}
            </select>
          </div>
        </div>

        <div className="dc-right">
           <button className="export-btn" onClick={handleExportCSV} disabled={!annualData.length}>CSV</button>
           <button className="export-btn" onClick={handleExportJSON} disabled={!annualData.length}>JSON</button>
        </div>
      </header>

      {error && (
        <div className="error-bar">
          ⚠ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* ── COMPARE MAP MODE ── */}
      {compareMode && (
        <div className="compare-mode-wrapper">
          <CompareMap useCalibration={useCalibration} onAoiChange={setAoi} />
        </div>
      )}

      {/* ── STORY MODE OVERLAY ── */}
      {storyMode && (
        <div className="story-overlay">
          <KidGuide onClose={() => {}} /> {/* Close handled by sidebar now, or we can leave it empty */}
        </div>
      )}

      {/* ── GLOSSARY MODE ── */}
      {glossaryMode && (
        <div className="glossary-mode-wrapper">
          <Glossary onClose={() => {}} />
        </div>
      )}

      {/* ── AI ANALYST MODE ── */}
      {aiAnalystMode && (
        <AIAnalyst 
          aoi={aoi} 
          annualData={annualData} 
          stockData={stockData} 
          changeData={changeData} 
        />
      )}

      {/* ── AI FORECAST MODE ── */}
      {forecastMode && (
        <AIForecast 
          aoi={aoi} 
          annualData={annualData} 
        />
      )}

      {/* ── NORMAL DASHBOARD MODE ── */}
      <div className="dash-body" style={{ display: isDashboard ? 'grid' : 'none' }}>
        {/* ── LEFT: MAP ── */}
        <section className="map-section">
          <div className="section-header">
            <div>
              <h2>Area of Interest</h2>
              <p>Draw a polygon over <strong style={{color:'var(--emerald)'}}>Alabama, USA</strong> — the coverage region of this OBIWAN API instance.</p>
            </div>
            <span className="badge badge-amber">📍 Alabama Coverage</span>
            {loadingMap && <span className="mini-loader pulse">Loading tile...</span>}
          </div>
          <div className="map-container">
            <Map 
              biomassUrl={biomassUrl}
              onAoiChange={setAoi}
              useCalibration={useCalibration}
            />
          </div>
          {!aoi && (
            <div className="map-cta">
              <span>👆 Click <strong>Draw AOI</strong>, then click points over Alabama to create a polygon. Right-click to finish.</span>
            </div>
          )}
        </section>

        {/* ── RIGHT: PANELS ── */}
        <section className="panels-section">
          {/* Metric Cards */}
          <div className="metrics-row">
            <MetricCard
              label="Current AGBD"
              value={fmt(latestAGBD)}
              unit="Mg/ha"
              colorClass="emerald"
              loading={loadingAnnual && !latestAGBD}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22V12m0 0a5 5 0 0 0 5-5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 0 5 5z"/></svg>}
            />
            <MetricCard
              label="Annual Change Rate"
              value={fmtSigned(annualRate)}
              unit="Mg/ha/yr"
              colorClass="blue"
              loading={loadingAnnual && !annualData.length}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}
            />
            <MetricCard
              label="Net Change (dAGBD)"
              value={changeData ? fmtSigned(changeData.dAGBD) : '—'}
              unit={`Mg/ha (${changeStart}→${changeEnd})`}
              colorClass="purple"
              loading={loadingChange}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>}
            />
            <MetricCard
              label="Area Coverage"
              value={stockData ? fmt(stockData.area_ha / 1e4, 1) : '—'}
              unit="×10⁴ ha"
              colorClass="amber"
              loading={loadingStock}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>}
            />
          </div>

          {/* Tabs */}
          <div className="tabs-bar">
            {['annual', 'change', 'additionality', 'stock', 'story'].map(t => (
              <button
                key={t}
                className={`tab-btn ${activeTab === t ? 'active' : ''}`}
                onClick={() => setActiveTab(t)}
              >
                {{ annual: '📈 Annual', change: '🔄 Change', additionality: '⚖️ Additionality', stock: '🛰️ Stock', story: '🌳 Story' }[t]}
              </button>
            ))}
          </div>

          {/* Tab Panels */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="tab-panel glass"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >

              {/* ANNUAL TREND */}
              {activeTab === 'annual' && (
                <div className="panel-inner">
                  <div className="panel-header">
                    <div>
                      <h3>Annual Biomass Trend</h3>
                      <p>Above-Ground Biomass Density (AGBD) per year for your selected AOI</p>
                    </div>
                    <span className="badge badge-emerald">1999 → 2023</span>
                  </div>
                  {loadingAnnual ? <Loader /> : annualData.length === 0 ? (
                    <EmptyState icon="🌍" text="Draw an AOI on the map to view the annual biomass trend" />
                  ) : (
                    <div className="chart-area">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={annualData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="agbdGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="year" stroke="#4B5470" tick={{ fill: '#8B95B0', fontSize: 12 }} />
                          <YAxis stroke="#4B5470" tick={{ fill: '#8B95B0', fontSize: 12 }} label={{ value: 'Mg/ha', angle: -90, position: 'insideLeft', fill: '#4B5470', fontSize: 11 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ color: '#8B95B0', fontSize: 12 }} />
                          <Area type="monotone" dataKey="AGBD" name={useCalibration ? 'Calibrated AGBD' : 'AGBD'} stroke="#10B981" fill="url(#agbdGrad)" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* CHANGE ESTIMATION */}
              {activeTab === 'change' && (
                <div className="panel-inner">
                  <div className="panel-header">
                    <div>
                      <h3>Change Estimation</h3>
                      <p>Estimated biomass change between two years for your AOI</p>
                    </div>
                  </div>
                  <div className="year-selectors">
                    <div className="year-field">
                      <label>Start Year</label>
                      <select value={changeStart} onChange={e => setChangeStart(+e.target.value)}>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div className="year-arrow">→</div>
                    <div className="year-field">
                      <label>End Year</label>
                      <select value={changeEnd} onChange={e => setChangeEnd(+e.target.value)}>
                        {[...YEARS, 2023].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <button className="run-btn" onClick={runAllAnalyses} disabled={!aoi || loadingChange}>
                      {loadingChange ? '...' : 'Analyze AOI'}
                    </button>
                  </div>

                  {loadingChange ? <Loader /> : !changeData ? (
                    <EmptyState icon="📈" text="Draw an AOI on the map, then press Analyze" />
                  ) : (
                    <>
                      <div className="result-cards">
                      <div className="result-card emerald">
                        <span className="rc-label">Δ AGBD</span>
                        <span className="rc-value">{fmtSigned(changeData.dAGBD, 3)}</span>
                        <span className="rc-unit">Mg/ha</span>
                      </div>
                      <div className="result-card blue">
                        <span className="rc-label">Std AGBD</span>
                        <span className="rc-value">±{fmt(changeData.stddAGBD, 3)}</span>
                        <span className="rc-unit">Mg/ha</span>
                      </div>
                      <div className="result-card purple">
                        <span className="rc-label">Area</span>
                        <span className="rc-value">{(changeData.area_ha).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                        <span className="rc-unit">ha</span>
                      </div>
                      <div className={`result-card ${(changeData.dAGBD ?? 0) >= 0 ? 'emerald' : 'red'}`}>
                        <span className="rc-label">Verdict</span>
                        <span className="rc-value" style={{ fontSize: '1.1rem' }}>
                          {(changeData.dAGBD ?? 0) >= 0 ? '↑ Gain' : '↓ Loss'}
                        </span>
                        <span className="rc-unit">{changeStart} → {changeEnd}</span>
                      </div>
                    </div>
                    </>
                  )}
                </div>
              )}

              {/* ADDITIONALITY */}
              {activeTab === 'additionality' && (
                <div className="panel-inner">
                  <div className="panel-header">
                    <div>
                      <h3>Additionality Estimation</h3>
                      <p>Compare biomass change rate between a baseline period and a target period</p>
                    </div>
                    <span className="badge badge-purple">Market / Treaty</span>
                  </div>
                  <div className="add-selectors">
                    <div className="add-group">
                      <label className="add-group-label">Baseline Period</label>
                      <div className="year-selectors">
                        <div className="year-field">
                          <label>Start</label>
                          <select value={addBaseStart} onChange={e => setAddBaseStart(+e.target.value)}>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                        <div className="year-arrow">→</div>
                        <div className="year-field">
                          <label>End</label>
                          <select value={addBaseEnd} onChange={e => setAddBaseEnd(+e.target.value)}>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="add-group">
                      <label className="add-group-label">Target Period</label>
                      <div className="year-selectors">
                        <div className="year-field">
                          <label>Start</label>
                          <select value={addTargetStart} onChange={e => setAddTargetStart(+e.target.value)}>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                        <div className="year-arrow">→</div>
                        <div className="year-field">
                          <label>End</label>
                          <select value={addTargetEnd} onChange={e => setAddTargetEnd(+e.target.value)}>
                            {[...YEARS, 2023].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                    <button className="run-btn" onClick={runAllAnalyses} disabled={!aoi || loadingAdd}>
                      {loadingAdd ? '...' : 'Compute'}
                    </button>
                  </div>

                  {loadingAdd ? <Loader /> : !additionalityData ? (
                    <EmptyState icon="⚖️" text="Draw an AOI and press Compute to measure additionality" />
                  ) : (
                    <div className="result-cards">
                      {Object.entries(additionalityData).filter(([k]) => k !== 'asset_version' && k !== 'use_calibration').map(([key, val]) => (
                        <div key={key} className="result-card blue">
                          <span className="rc-label">{key.replace(/_/g, ' ')}</span>
                          <span className="rc-value">{val == null ? '—' : typeof val === 'number' ? fmt(val, 3) : String(val)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* BIOMASS STOCK */}
              {activeTab === 'stock' && (
                <div className="panel-inner">
                  <div className="panel-header">
                    <div>
                      <h3>Biomass Stock Estimation</h3>
                      <p>Point-in-time AGBD for a specific year</p>
                    </div>
                  </div>
                  <div className="year-selectors">
                    <div className="year-field">
                      <label>Year</label>
                      <select value={stockYear} onChange={e => setStockYear(+e.target.value)}>
                        {[...YEARS, 2023].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <button className="run-btn" onClick={runAllAnalyses} disabled={!aoi || loadingStock}>
                      {loadingStock ? '...' : 'Fetch'}
                    </button>
                  </div>

                  {loadingStock ? <Loader /> : !stockData ? (
                    <EmptyState icon="🛰️" text="Draw an AOI and press Fetch to retrieve biomass stock data" />
                  ) : (
                    <div className="result-cards">
                      <div className="result-card emerald">
                        <span className="rc-label">AGBD (Mean)</span>
                        <span className="rc-value">{fmt(stockData.AGBD, 3)}</span>
                        <span className="rc-unit">Mg/ha</span>
                      </div>
                      <div className="result-card blue">
                        <span className="rc-label">Std AGBD</span>
                        <span className="rc-value">±{fmt(stockData.stdAGBD, 3)}</span>
                        <span className="rc-unit">Mg/ha</span>
                      </div>
                      <div className="result-card purple">
                        <span className="rc-label">Area</span>
                        <span className="rc-value">{(stockData.area_ha).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        <span className="rc-unit">ha</span>
                      </div>
                      <div className="result-card amber">
                        <span className="rc-label">Year</span>
                        <span className="rc-value">{stockData.year ?? stockYear}</span>
                        <span className="rc-unit">Reference Year</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* STORY / VISUALS TAB */}
              {activeTab === 'story' && (
                <div style={{ height: '100%', overflow: 'hidden' }}>
                  <Visuals
                    annualData={annualData}
                    stockData={stockData}
                    changeData={changeData}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>

      {/* Footer */}
      <footer className="dash-footer">
        <span>ObiWan.AI — Powered by NASA GEDI L4B &amp; OBIWAN API</span>
        <span>Data: <a href="https://gedi.umd.edu" target="_blank" rel="noopener noreferrer">gedi.umd.edu</a></span>
      </footer>
    </div>
  );
}
