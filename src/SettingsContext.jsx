import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'midnight');
  const [unit, setUnit] = useState(() => localStorage.getItem('unit') || 'mg-ha');
  const [autoCalibrate, setAutoCalibrate] = useState(() => localStorage.getItem('autoCalibrate') === 'true');
  const [aiAlerts, setAiAlerts] = useState(() => localStorage.getItem('aiAlerts') !== 'false');
  const [apiHealth, setApiHealth] = useState(() => localStorage.getItem('apiHealth') !== 'false');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('unit', unit);
  }, [unit]);

  useEffect(() => {
    localStorage.setItem('autoCalibrate', autoCalibrate);
  }, [autoCalibrate]);

  useEffect(() => {
    localStorage.setItem('aiAlerts', aiAlerts);
  }, [aiAlerts]);

  useEffect(() => {
    localStorage.setItem('apiHealth', apiHealth);
  }, [apiHealth]);

  const value = {
    theme, setTheme,
    unit, setUnit,
    autoCalibrate, setAutoCalibrate,
    aiAlerts, setAiAlerts,
    apiHealth, setApiHealth
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
