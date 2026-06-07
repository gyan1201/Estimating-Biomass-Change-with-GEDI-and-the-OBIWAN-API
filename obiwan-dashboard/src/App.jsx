import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Dashboard from './Dashboard.jsx';
// Placeholder imports for future components:
// import AIAnalyst from './AIAnalyst.jsx';
// import AIForecast from './AIForecast.jsx';
import './App.css';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <div className="app-layout">
      <div className="bg-mesh" />
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      <main className="app-main">
        {/* We pass activeView down so Dashboard knows which feature to render */}
        {/* Alternatively, if they are separate components, we conditionally render them here. */}
        {/* For now, Dashboard handles compare/story/glossary via its own internal state, 
            but we will migrate that to activeView next. */}
        <Dashboard activeView={activeView} />
      </main>
    </div>
  );
}
