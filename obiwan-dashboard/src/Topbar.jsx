import React, { useState, useEffect } from 'react';
import './Topbar.css';

export default function Topbar({ activeView, toggleNotifications, hasUnreadNotifications, aoi, annualData, stockData }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format current AGBD
  const currentAGBD = annualData && annualData.length > 0 ? annualData[annualData.length - 1].AGBD.toFixed(2) : '--';
  const currentStock = stockData && stockData.stock_mg ? (stockData.stock_mg / 1000).toFixed(2) : '--'; // convert to Gg
  
  // Format net change
  let netChange = '--';
  let netChangePct = '--';
  let changeIsPositive = null;
  if (annualData && annualData.length > 1) {
    const first = annualData[0].AGBD;
    const last = annualData[annualData.length - 1].AGBD;
    const diff = last - first;
    netChange = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
    netChangePct = ((diff / first) * 100).toFixed(1);
    changeIsPositive = diff >= 0;
  }

  // Format active view title
  const viewTitles = {
    'dashboard': 'Map Dashboard',
    'ai-analyst': 'AI Analyst Engine',
    'forecast': 'Predictive Forecast',
    'compare': 'Compare Maps',
    'story': 'Story Mode',
    'glossary': 'Glossary',
    'settings': 'Settings'
  };

  return (
    <div className="topbar glass">
      <div className="topbar-left">
        <h1 className="view-title">{viewTitles[activeView] || 'EdgeMind Forest'}</h1>
        <div className="api-status">
          <span className="status-dot healthy"></span>
          <span className="status-text">OBIWAN API Online</span>
        </div>
      </div>

      <div className="topbar-center">
        <div className="live-stat">
          <span className="stat-label">Current AGBD</span>
          <span className="stat-value">{currentAGBD} <small>Mg/ha</small></span>
        </div>
        <div className="live-stat">
          <span className="stat-label">Net Change</span>
          <span className={`stat-value ${changeIsPositive === true ? 'positive' : changeIsPositive === false ? 'negative' : ''}`}>
            {netChange} <small>Mg/ha</small> ({netChangePct}%)
          </span>
        </div>
        <div className="live-stat">
          <span className="stat-label">Total Stock</span>
          <span className="stat-value">{currentStock} <small>Gg</small></span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="live-clock">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        
        <button className="topbar-action-btn search-btn" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'k', 'ctrlKey': true}))} title="Command Palette (Ctrl+K)">
          <span className="icon">🔍</span>
          <span className="shortcut">Ctrl+K</span>
        </button>

        <button className="topbar-action-btn notif-btn" onClick={toggleNotifications} title="Notifications">
          <span className="icon">🔔</span>
          {hasUnreadNotifications && <span className="notif-badge"></span>}
        </button>
      </div>
    </div>
  );
}
