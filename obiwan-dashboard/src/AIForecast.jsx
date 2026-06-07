import React, { useState, useMemo, useEffect } from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import './AIForecast.css';

// Simple linear regression to find slope and intercept
function calculateRegression(data) {
  if (data.length < 2) return { slope: 0, intercept: 0 };
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  data.forEach(p => {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

export default function AIForecast({ aoi, annualData }) {
  const [analyzing, setAnalyzing] = useState(true);
  const [scenarioMultiplier, setScenarioMultiplier] = useState(1.0); // 1.0 = business as usual

  useEffect(() => {
    if (aoi && annualData.length > 0) {
      setAnalyzing(true);
      const timer = setTimeout(() => setAnalyzing(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [aoi, annualData]);

  const forecastData = useMemo(() => {
    if (!annualData || annualData.length < 2) return [];

    // Map data to x/y for regression (using year offset to prevent huge numbers)
    const baseYear = annualData[0].year;
    const regData = annualData.map(d => ({ x: d.year - baseYear, y: d.AGBD }));
    
    let { slope, intercept } = calculateRegression(regData);
    
    // Apply scenario modifier to the slope (future growth/loss rate)
    // If slope is positive (growing), >1.0 increases growth
    // If slope is negative (declining), >1.0 decreases loss (acts as conservation)
    const modifiedSlope = slope > 0 ? slope * scenarioMultiplier : slope * (2 - scenarioMultiplier);

    const fullSeries = [];
    const lastHistoricalYear = annualData[annualData.length - 1].year;
    
    // 1. Add historical data
    annualData.forEach(d => {
      fullSeries.push({
        year: d.year,
        historical: d.AGBD,
        forecast: null,
        lowerBound: null,
        upperBound: null
      });
    });

    // 2. Add forecast data up to 2035
    let currentY = annualData[annualData.length - 1].AGBD;
    for (let yr = lastHistoricalYear + 1; yr <= 2035; yr++) {
      currentY += modifiedSlope; // linear step
      // Add some artificial uncertainty that grows over time
      const yearsOut = yr - lastHistoricalYear;
      const uncertainty = Math.abs(currentY) * 0.02 * yearsOut; 
      
      fullSeries.push({
        year: yr,
        historical: null,
        forecast: Math.max(0, currentY), // no negative biomass
        lowerBound: Math.max(0, currentY - uncertainty),
        upperBound: Math.max(0, currentY + uncertainty)
      });
    }

    // Connect the lines seamlessly
    const lastHistIndex = fullSeries.findIndex(d => d.year === lastHistoricalYear);
    if (lastHistIndex >= 0) {
      fullSeries[lastHistIndex].forecast = fullSeries[lastHistIndex].historical;
      fullSeries[lastHistIndex].lowerBound = fullSeries[lastHistIndex].historical;
      fullSeries[lastHistIndex].upperBound = fullSeries[lastHistIndex].historical;
    }

    return fullSeries;
  }, [annualData, scenarioMultiplier]);

  if (!aoi) {
    return (
      <div className="forecast-wrapper empty">
        <div className="fc-empty-state">
          <div className="fc-icon pulse">📈</div>
          <h2>Awaiting Region Data</h2>
          <p>Please select an Area of Interest on the map to generate predictive models.</p>
        </div>
      </div>
    );
  }

  if (analyzing) {
    return (
      <div className="forecast-wrapper loading">
        <div className="fc-loading-state">
          <div className="fc-icon scanning">⚙️</div>
          <h2>Building Forecast Model...</h2>
          <div className="fc-progress-bar"><div className="fc-progress-fill"></div></div>
          <p className="fc-log">Calculating historical regression slopes...</p>
        </div>
      </div>
    );
  }

  const currentBiomass = annualData[annualData.length - 1].AGBD;
  const projected2035 = forecastData.find(d => d.year === 2035)?.forecast || 0;
  const netChange = projected2035 - currentBiomass;
  const pctChange = ((netChange / currentBiomass) * 100).toFixed(1);

  return (
    <div className="forecast-wrapper">
      <div className="fc-header glass">
        <div>
          <h2 className="fc-title">Predictive Forecast Model (2025–2035)</h2>
          <p className="fc-subtitle">Powered by historical regression & scenario analysis</p>
        </div>
      </div>

      <div className="fc-body">
        {/* Left Side: Controls & Metrics */}
        <div className="fc-sidebar glass">
          <h3 className="fc-section-title">Scenario Modeling</h3>
          <p className="fc-desc">Adjust the slider to simulate the impact of conservation efforts vs. accelerated harvesting.</p>
          
          <div className="scenario-slider-wrap">
            <div className="slider-labels">
              <span>Severe Loss</span>
              <span>Business as Usual</span>
              <span>Max Conservation</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="1.5" 
              step="0.1" 
              value={scenarioMultiplier}
              onChange={e => setScenarioMultiplier(parseFloat(e.target.value))}
              className="fc-slider"
            />
            <div className="slider-val-readout">
              Modifier: {scenarioMultiplier.toFixed(1)}x
            </div>
          </div>

          <div className="fc-metrics-grid">
            <div className="fc-metric">
              <span className="fcm-label">Current (2023)</span>
              <span className="fcm-val">{currentBiomass.toFixed(1)} Mg/ha</span>
            </div>
            <div className="fc-metric">
              <span className="fcm-label">Projected (2035)</span>
              <span className="fcm-val highlight">{projected2035.toFixed(1)} Mg/ha</span>
            </div>
          </div>

          <div className={`fc-insight-box ${netChange >= 0 ? 'positive' : 'negative'}`}>
            <h4>AI Projection Insight</h4>
            <p>
              Under the current scenario, the model predicts a <strong>{netChange >= 0 ? '+' : ''}{pctChange}%</strong> shift in biomass density by 2035. 
              {netChange >= 0 ? ' This indicates a healthy carbon sequestration trajectory.' : ' This trajectory warns of significant carbon stock depletion.'}
            </p>
          </div>
        </div>

        {/* Right Side: Chart */}
        <div className="fc-chart-card glass">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecastData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="year" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px' }}
                itemStyle={{ color: '#E5E7EB' }}
                labelStyle={{ color: '#9CA3AF', marginBottom: '4px' }}
                formatter={(value) => value ? Number(value).toFixed(1) + ' Mg/ha' : ''}
              />
              
              {/* Confidence Interval (Area) */}
              <Area type="monotone" dataKey="upperBound" stroke="none" fill="#3B82F6" fillOpacity={0.1} />
              <Area type="monotone" dataKey="lowerBound" stroke="none" fill="#070B14" fillOpacity={1} /> {/* Mask to create band */}
              
              {/* Historical Data (Solid) */}
              <Line type="monotone" dataKey="historical" stroke="#10B981" strokeWidth={3} dot={{ r: 3, fill: '#10B981' }} activeDot={{ r: 5 }} />
              
              {/* Projected Data (Dashed) */}
              <Line type="monotone" dataKey="forecast" stroke="#3B82F6" strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={{ r: 5 }} />
              
              <ReferenceLine x={annualData[annualData.length - 1].year} stroke="#6B7280" strokeDasharray="3 3" label={{ position: 'top', value: 'Today', fill: '#9CA3AF', fontSize: 11 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
