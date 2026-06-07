import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Dashboard from './Dashboard.jsx';
import Topbar from './Topbar.jsx';
import CommandPalette from './CommandPalette.jsx';
import NotificationCenter from './NotificationCenter.jsx';
import AIChat from './AIChat.jsx';
import Settings from './Settings.jsx';
import './App.css';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // We normally lift state up, but for the prototype we'll listen to CustomEvents
  // if Dashboard is not unmounted. Or we can just let Dashboard handle its own data.
  // Actually, to pass data to AIChat, we need it. But wait, Dashboard fetches data.
  // Since Dashboard is always mounted (just hidden when not active), it can dispatch events
  // or we can just keep AIChat inside Dashboard as we did earlier.
  // Wait, I put AIChat and Topbar here but they need data from Dashboard!
  // It's cleaner to put them inside Dashboard.jsx if they need 'annualData', OR
  // lift the data state to App.jsx.
  // Let's lift the data state to App.jsx so it's globally available.
  return (
    <div className="app-layout">
      <div className="bg-mesh" />
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      <main className="app-main">
        {/* We need Topbar here. But Topbar needs data... Let's just render the global UI components */}
        <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} setActiveView={setActiveView} />
        <NotificationCenter isOpen={notifOpen} onClose={() => setNotifOpen(false)} notifications={[]} />
        
        {/* The Dashboard acts as our main state container for the map data.
            I will pass setCmdOpen and setNotifOpen to it so it can render Topbar inside itself 
            and pass the data directly! That saves refactoring all state. */}
        <Dashboard 
          activeView={activeView} 
          onOpenCmd={() => setCmdOpen(true)}
          onToggleNotif={() => setNotifOpen(n => !n)}
        />

        {activeView === 'settings' && <Settings />}
      </main>
    </div>
  );
}
