import React from 'react';
import './Sidebar.css';

export default function Sidebar({ activeView, setActiveView, workspaceName = "BioTrace AI" }) {
  const navItems = [
    { id: 'dashboard', icon: '🌍', label: 'Map Dashboard' },
    { id: 'ai-analyst', icon: '🧠', label: 'AI Analyst' },
    { id: 'forecast', icon: '📈', label: 'Predictive Forecast' },
    { id: 'compare', icon: '🗺️', label: 'Compare Maps' },
    { id: 'story', icon: '📖', label: 'Story Mode' },
    { id: 'glossary', icon: '📚', label: 'Glossary' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <aside className="saas-sidebar glass">
      {/* Workspace Header */}
      <div className="sidebar-header">
        <div className="workspace-icon">🌲</div>
        <div className="workspace-info">
          <h2 className="workspace-name">{workspaceName}</h2>
          <p className="workspace-plan">Enterprise AI Plan</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <p className="nav-section-label">Analytics</p>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User Profile / Bottom */}
      <div className="sidebar-bottom">
        <div className="usage-card">
          <div className="usage-header">
            <span>AI Credits</span>
            <span>85%</span>
          </div>
          <div className="usage-bar-track">
            <div className="usage-bar-fill" style={{ width: '85%' }}></div>
          </div>
        </div>

        <button className="user-profile">
          <div className="avatar">G</div>
          <div className="user-info">
            <p className="user-name">Gyanendra</p>
            <p className="user-role">Admin</p>
          </div>
          <span className="user-chevron">⚙️</span>
        </button>
      </div>
    </aside>
  );
}
