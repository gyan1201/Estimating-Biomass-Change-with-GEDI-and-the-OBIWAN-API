import React from 'react';
import { useSettings } from './SettingsContext.jsx';
import './Settings.css';

export default function Settings() {
  const { theme, setTheme, unit, setUnit, autoCalibrate, setAutoCalibrate, aiAlerts, setAiAlerts, apiHealth, setApiHealth } = useSettings();

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <div className="settings-wrapper fade-in">
      <div className="settings-header glass">
        <h2>Workspace Settings</h2>
        <p>Configure your BioTrace AI preferences and defaults.</p>
      </div>

      <div className="settings-body">
        <div className="settings-section glass">
          <h3>🎨 Appearance</h3>
          
          <div className="setting-row">
            <div className="setting-info">
              <h4>UI Theme</h4>
              <p>Select the color scheme for the dashboard.</p>
            </div>
            <div className="theme-selector">
              <button className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => handleThemeChange('dark')}>
                <span className="theme-preview" style={{background: '#1F2937'}}></span> Dark
              </button>
              <button className={`theme-btn ${theme === 'midnight' ? 'active' : ''}`} onClick={() => handleThemeChange('midnight')}>
                <span className="theme-preview" style={{background: '#070B14'}}></span> Midnight
              </button>
              <button className={`theme-btn ${theme === 'forest' ? 'active' : ''}`} onClick={() => handleThemeChange('forest')}>
                <span className="theme-preview" style={{background: '#064E3B'}}></span> Forest
              </button>
            </div>
          </div>
        </div>

        <div className="settings-section glass">
          <h3>📊 Data & Units</h3>
          
          <div className="setting-row">
            <div className="setting-info">
              <h4>Default Biomass Unit</h4>
              <p>Display all charts and numbers in this format.</p>
            </div>
            <div className="toggle-group">
              <button className={unit === 'mg-ha' ? 'active' : ''} onClick={() => setUnit('mg-ha')}>Mg/ha</button>
              <button className={unit === 't-ha' ? 'active' : ''} onClick={() => setUnit('t-ha')}>t/ha</button>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <h4>Auto-Calibration</h4>
              <p>Always apply FIA Inventory Calibration to new AOI queries by default.</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={autoCalibrate} onChange={(e) => setAutoCalibrate(e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-section glass">
          <h3>🔔 Notifications</h3>
          
          <div className="setting-row">
            <div className="setting-info">
              <h4>AI Anomaly Alerts</h4>
              <p>Receive push notifications when AI detects significant biomass drops.</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={aiAlerts} onChange={(e) => setAiAlerts(e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <h4>API Health Status</h4>
              <p>Alerts when OBIWAN endpoints experience latency or downtime.</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={apiHealth} onChange={(e) => setApiHealth(e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-actions">
          <button className="save-btn" onClick={() => alert('Preferences saved globally!')}>Save Preferences</button>
        </div>
      </div>
    </div>
  );
}
