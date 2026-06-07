import React from 'react';
import './Visuals.css';

// ── Friendly number conversions ──
const toElephants   = (mgHa, areaHa) => Math.round((mgHa * areaHa) / 5000);   // avg elephant ~5 tonnes
const toCars        = (mgHa, areaHa) => Math.round((mgHa * areaHa) / 1.5);    // avg car ~1.5 tonnes
const toTrees       = (mgHa, areaHa) => Math.round((mgHa * areaHa) / 0.05);   // ~50 kg carbon/tree
const toCarbon      = (mgHa, areaHa) => (mgHa * areaHa * 0.5 / 1000).toFixed(1); // ~50% carbon, in Gg

// ── Forest Health Score (0–100) based on AGBD ──
function healthScore(agbd) {
  // >200 Mg/ha = pristine old-growth = 100
  if (!agbd) return 0;
  return Math.min(100, Math.round((agbd / 200) * 100));
}

function healthLabel(score) {
  if (score >= 80) return { label: 'Thriving Forest 🌳', color: '#10B981', emoji: '🌲🌲🌲🌲🌲' };
  if (score >= 60) return { label: 'Healthy Forest 🌿', color: '#34D399', emoji: '🌲🌲🌲🌲🌱' };
  if (score >= 40) return { label: 'Growing Forest 🌱', color: '#F59E0B', emoji: '🌲🌲🌱🌱🌱' };
  if (score >= 20) return { label: 'Young Forest 🪵', color: '#F97316', emoji: '🌱🌱🌱🌱🌱' };
  return          { label: 'Bare Land 🏜️', color: '#EF4444', emoji: '🪨🪨🪨🪨🪨' };
}

// ── Donut / Ring Gauge ──
function RingGauge({ score, color, size = 140 }) {
  const r = (size / 2) - 14;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} className="ring-gauge">
      {/* Background track */}
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12"/>
      {/* Progress arc */}
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 6px ${color})` }}
      />
      <text x={size/2} y={size/2 - 6} textAnchor="middle" dominantBaseline="middle" className="gauge-num" fill={color}>
        {score}
      </text>
      <text x={size/2} y={size/2 + 16} textAnchor="middle" className="gauge-sub" fill="#8B95B0">
        / 100
      </text>
    </svg>
  );
}

// ── Bar showing magnitude with icons ──
function IconBar({ count, max, icon, color }) {
  const capped = Math.min(count, max);
  const pct = max > 0 ? (capped / max) * 100 : 0;
  return (
    <div className="icon-bar-wrap">
      <div className="icon-bar-track">
        <div className="icon-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="icon-bar-emoji">{icon}</span>
      <span className="icon-bar-num" style={{ color }}>{count.toLocaleString()}</span>
    </div>
  );
}

// ── Trend Arrow Card ──
function TrendCard({ dAGBD }) {
  if (dAGBD == null || isNaN(dAGBD)) return null;
  const gain = dAGBD >= 0;
  return (
    <div className={`trend-card ${gain ? 'gain' : 'loss'}`}>
      <div className="trend-emoji">{gain ? '📈' : '📉'}</div>
      <div className="trend-body">
        <p className="trend-title">{gain ? 'The Forest is Growing!' : 'The Forest is Shrinking'}</p>
        <p className="trend-detail">
          {gain
            ? `Trees added ${Math.abs(dAGBD).toFixed(1)} Mg/ha of extra wood and leaves. That's like adding ${Math.round(Math.abs(dAGBD) * 10)} bags of wood chips per hectare!`
            : `The forest lost ${Math.abs(dAGBD).toFixed(1)} Mg/ha of biomass. That's like removing ${Math.round(Math.abs(dAGBD) * 10)} bags of wood chips per hectare.`}
        </p>
      </div>
    </div>
  );
}

// ── What is AGBD? Simple explainer ──
function ExplainerCard({ agbd, areaHa }) {
  if (!agbd || !areaHa) return null;
  const elephants = toElephants(agbd, areaHa);
  const cars      = toCars(agbd, areaHa);
  const trees     = toTrees(agbd, areaHa);
  const carbonGg  = toCarbon(agbd, areaHa);

  return (
    <div className="explainer-card">
      <h3 className="explainer-title">🌍 What does this mean?</h3>
      <p className="explainer-intro">
        The <strong>{agbd.toFixed(0)} Mg/ha</strong> AGBD means if you weighed all the trees in your selected area…
      </p>
      <div className="explainer-comparisons">
        <div className="comparison">
          <span className="cmp-emoji">🐘</span>
          <span className="cmp-text">That's as heavy as</span>
          <span className="cmp-num">{elephants.toLocaleString()} elephants</span>
        </div>
        <div className="comparison">
          <span className="cmp-emoji">🚗</span>
          <span className="cmp-text">Or about</span>
          <span className="cmp-num">{cars.toLocaleString()} cars</span>
        </div>
        <div className="comparison">
          <span className="cmp-emoji">🌳</span>
          <span className="cmp-text">That's roughly</span>
          <span className="cmp-num">{trees.toLocaleString()} trees</span>
        </div>
        <div className="comparison">
          <span className="cmp-emoji">💨</span>
          <span className="cmp-text">Stores about</span>
          <span className="cmp-num">{carbonGg} Gg of CO₂</span>
        </div>
      </div>
    </div>
  );
}

// ── MAIN EXPORT ──
export default function Visuals({ annualData, stockData, changeData }) {
  const latestAGBD = annualData.length > 0 ? annualData[annualData.length - 1].AGBD : null;
  const score = healthScore(latestAGBD);
  const health = healthLabel(score);
  const areaHa = stockData?.area_ha ?? null;
  const dAGBD = changeData?.dAGBD ?? null;

  const hasData = latestAGBD != null;

  if (!hasData) {
    return (
      <div className="visuals-empty">
        <div className="visuals-empty-inner">
          <p className="ve-emoji">🌍</p>
          <p className="ve-title">Draw an AOI over Alabama to see your forest story!</p>
          <p className="ve-sub">We'll turn the data into easy pictures anyone can understand.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="visuals-container">
      {/* Health Gauge */}
      <div className="vis-card health-card glass">
        <h3 className="vis-title">Forest Health Score</h3>
        <div className="health-body">
          <RingGauge score={score} color={health.color} size={130} />
          <div className="health-info">
            <p className="health-label" style={{ color: health.color }}>{health.label}</p>
            <p className="health-emoji">{health.emoji}</p>
            <p className="health-agbd">{latestAGBD?.toFixed(1)} Mg/ha AGBD</p>
            <p className="health-desc">
              {score >= 60
                ? 'This forest is dense and healthy — great for wildlife and carbon storage!'
                : score >= 40
                ? 'This forest is still growing. Give it time and it will become lush!'
                : 'This area has very few trees right now. Let\'s help it grow!'}
            </p>
          </div>
        </div>
      </div>

      {/* Trend Card */}
      <div className="vis-card glass">
        <h3 className="vis-title">Is the Forest Growing?</h3>
        <TrendCard dAGBD={dAGBD} />
        {dAGBD == null && (
          <p className="vis-hint">Go to the <strong>Change Est.</strong> tab and press Analyze</p>
        )}
      </div>

      {/* Timeline Mini Chart */}
      {annualData.length > 1 && (
        <div className="vis-card glass timeline-card">
          <h3 className="vis-title">📅 Forest Weight Over Time</h3>
          <div className="timeline-bars">
            {annualData.map((d, i) => {
              const max = Math.max(...annualData.map(x => x.AGBD));
              const pct = d.AGBD != null ? (d.AGBD / max) * 100 : 0;
              const isLatest = i === annualData.length - 1;
              return (
                <div key={d.year} className="tl-bar-group">
                  <div className="tl-bar-wrap">
                    <div
                      className="tl-bar"
                      style={{
                        height: `${pct}%`,
                        background: isLatest
                          ? 'linear-gradient(to top, #10B981, #34D399)'
                          : `rgba(16,185,129,${0.3 + (pct / 100) * 0.5})`,
                        border: isLatest ? '1px solid #10B981' : 'none',
                      }}
                    />
                  </div>
                  <span className="tl-year">{d.year}</span>
                </div>
              );
            })}
          </div>
          <p className="vis-hint">Each bar = how heavy the trees were that year. Taller = more trees!</p>
        </div>
      )}

      {/* Real-world comparisons */}
      {areaHa && latestAGBD && (
        <ExplainerCard agbd={latestAGBD} areaHa={areaHa} />
      )}
    </div>
  );
}
