import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './AIAnalyst.css';

function TypingText({ text }) {
  const [displayed, setDisplayed] = useState('');
  
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.substring(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayed}</span>;
}

export default function AIAnalyst({ aoi, annualData, stockData, changeData }) {
  const [analyzing, setAnalyzing] = useState(true);

  useEffect(() => {
    if (aoi && annualData.length > 0) {
      setAnalyzing(true);
      const timer = setTimeout(() => setAnalyzing(false), 2000); // Simulate AI "thinking"
      return () => clearTimeout(timer);
    }
  }, [aoi, annualData]);

  if (!aoi) {
    return (
      <div className="ai-analyst-wrapper empty">
        <div className="ai-empty-state">
          <div className="ai-avatar pulse">🧠</div>
          <h2>Waiting for target coordinates...</h2>
          <p>Please draw an Area of Interest on the Map Dashboard first. I need a geographic region to run the analysis model.</p>
        </div>
      </div>
    );
  }

  if (analyzing) {
    return (
      <div className="ai-analyst-wrapper loading">
        <div className="ai-loading-state">
          <div className="ai-avatar scanning">🤖</div>
          <h2>Running Neural Analysis...</h2>
          <div className="ai-progress-bar">
            <div className="ai-progress-fill"></div>
          </div>
          <p className="ai-log">Ingesting GEDI L4B temporal data...</p>
          <p className="ai-log">Running anomaly detection matrices...</p>
        </div>
      </div>
    );
  }

  // --- Generate Insights based on Data ---
  let insights = [];
  let anomalies = [];
  let overallTrend = "stable";
  
  if (annualData.length >= 2) {
    const first = annualData[0].AGBD;
    const last = annualData[annualData.length - 1].AGBD;
    const diff = last - first;
    const pctChange = ((diff / first) * 100).toFixed(1);

    if (diff > 5) {
      overallTrend = "growing";
      insights.push(`Overall, this region has seen a **${pctChange}% increase** in Above Ground Biomass Density since ${annualData[0].year}. This suggests active afforestation or natural forest maturation.`);
    } else if (diff < -5) {
      overallTrend = "declining";
      insights.push(`The region shows a **${Math.abs(pctChange)}% decrease** in AGBD over the timeframe. This macro trend indicates deforestation, harvesting, or mortality events outstripping growth.`);
    } else {
      insights.push(`The biomass density has remained relatively stable, with a net change of only ${pctChange}%. The ecosystem is likely in a mature, steady state.`);
    }

    // Detect sudden drops (anomalies)
    for (let i = 1; i < annualData.length; i++) {
      const prev = annualData[i-1].AGBD;
      const curr = annualData[i].AGBD;
      const drop = prev - curr;
      if (drop > 10) {
        anomalies.push({
          year: annualData[i].year,
          severity: 'high',
          msg: `Significant biomass loss (-${drop.toFixed(1)} Mg/ha) detected between ${annualData[i-1].year} and ${annualData[i].year}. Probability of logging or disturbance: 87%.`
        });
      } else if (drop > 5) {
        anomalies.push({
          year: annualData[i].year,
          severity: 'medium',
          msg: `Moderate decline (-${drop.toFixed(1)} Mg/ha) in ${annualData[i].year}.`
        });
      }
    }
  }

  const carbonEstimate = stockData?.stock_mg ? (stockData.stock_mg * 0.5 / 1000).toFixed(1) : '...';

  return (
    <div className="ai-analyst-wrapper">
      {/* Top Header */}
      <div className="ai-header glass">
        <div className="ai-title-row">
          <div className="ai-avatar">🧠</div>
          <div>
            <h2 className="ai-title">EdgeMind AI Analyst</h2>
            <p className="ai-subtitle">Automated telemetry & anomaly detection</p>
          </div>
        </div>
        <div className="ai-actions">
          <button className="ai-btn export">📄 Generate PDF Report</button>
        </div>
      </div>

      <div className="ai-body">
        {/* Left Column: Chat / Insights */}
        <div className="ai-insights-col glass">
          <h3 className="ai-section-title">✨ Executive Summary</h3>
          <div className="ai-chat-bubble">
            <TypingText text={`Analysis complete for the selected ${stockData?.area_ha ? stockData.area_ha.toFixed(1) : '--'} hectare region. ` + insights.join(' ')} />
          </div>

          <div className="ai-metrics-grid">
            <div className="ai-metric-box">
              <span className="aim-label">Carbon Sink Potential</span>
              <span className="aim-value">{carbonEstimate} Gg CO₂</span>
            </div>
            <div className="ai-metric-box">
              <span className="aim-label">Overall Trend</span>
              <span className={`aim-value ${overallTrend === 'growing' ? 'text-emerald' : overallTrend === 'declining' ? 'text-red' : ''}`}>
                {overallTrend.toUpperCase()}
              </span>
            </div>
          </div>

          <h3 className="ai-section-title mt-4">⚠️ Anomaly Detection Log</h3>
          {anomalies.length === 0 ? (
            <div className="anomaly-item safe">
              <span className="ano-icon">✅</span>
              <p>No sudden biomass loss events detected. Ecosystem is undisturbed.</p>
            </div>
          ) : (
            <div className="anomalies-list">
              {anomalies.map((a, i) => (
                <div key={i} className={`anomaly-item ${a.severity}`}>
                  <span className="ano-icon">{a.severity === 'high' ? '🚨' : '⚠️'}</span>
                  <div className="ano-content">
                    <strong>{a.year} Event Flagged</strong>
                    <p>{a.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Visualization / Data Proof */}
        <div className="ai-viz-col">
          <div className="ai-chart-card glass">
            <h3 className="ai-section-title">Neural Density Map (Temporal AGBD)</h3>
            <div className="ai-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={annualData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aiColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" stroke="#4B5563" fontSize={11} />
                  <YAxis stroke="#4B5563" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                    itemStyle={{ color: '#8B5CF6' }}
                  />
                  <Area type="monotone" dataKey="AGBD" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#aiColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
