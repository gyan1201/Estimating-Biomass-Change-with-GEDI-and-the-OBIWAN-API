import React, { useState, useEffect, useRef } from 'react';
import './CommandPalette.css';

export default function CommandPalette({ isOpen, onClose, setActiveView }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { id: 'dashboard', icon: '🌍', label: 'Go to Map Dashboard', type: 'Navigation' },
    { id: 'ai-analyst', icon: '🧠', label: 'Go to AI Analyst', type: 'Navigation' },
    { id: 'forecast', icon: '📈', label: 'Go to Predictive Forecast', type: 'Navigation' },
    { id: 'compare', icon: '🗺️', label: 'Go to Compare Maps', type: 'Navigation' },
    { id: 'settings', icon: '⚙️', label: 'Open Settings', type: 'Settings' },
    { id: 'export-csv', icon: '📥', label: 'Export Data (CSV)', type: 'Action' },
    { id: 'export-json', icon: '📥', label: 'Export Data (JSON)', type: 'Action' },
    { id: 'toggle-cal', icon: '📐', label: 'Toggle Calibration', type: 'Action' }
  ];

  const filteredCommands = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (cmd) => {
    if (cmd.type === 'Navigation' || cmd.type === 'Settings') {
      setActiveView(cmd.id);
    } else if (cmd.type === 'Action') {
      // Dispatch a custom event that Dashboard can listen to
      document.dispatchEvent(new CustomEvent('cmd-action', { detail: cmd.id }));
    }
    onClose();
  };

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-modal glass" onClick={e => e.stopPropagation()}>
        <div className="cmd-header">
          <span className="cmd-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="cmd-esc" onClick={onClose}>ESC</button>
        </div>
        <div className="cmd-body">
          {filteredCommands.length > 0 ? (
            <div className="cmd-group">
              <div className="cmd-group-label">Suggestions</div>
              {filteredCommands.map(cmd => (
                <button key={cmd.id} className="cmd-item" onClick={() => handleSelect(cmd)}>
                  <span className="cmd-item-icon">{cmd.icon}</span>
                  <span className="cmd-item-label">{cmd.label}</span>
                  <span className="cmd-item-type">{cmd.type}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="cmd-empty">No results found for "{query}"</div>
          )}
        </div>
      </div>
    </div>
  );
}
