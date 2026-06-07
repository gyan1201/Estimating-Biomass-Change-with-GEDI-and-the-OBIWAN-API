import React from 'react';
import './NotificationCenter.css';

export default function NotificationCenter({ isOpen, onClose, notifications }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="notif-backdrop" onClick={onClose}></div>
      <div className="notif-drawer glass">
        <div className="notif-header">
          <h3>Notifications</h3>
          <button className="notif-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="notif-list">
          {notifications.length === 0 ? (
            <div className="notif-empty">No new notifications</div>
          ) : (
            notifications.map(notif => (
              <div key={notif.id} className={`notif-card ${notif.type}`}>
                <div className="notif-icon">
                  {notif.type === 'alert' ? '🚨' : notif.type === 'success' ? '✅' : 'ℹ️'}
                </div>
                <div className="notif-content">
                  <h4>{notif.title}</h4>
                  <p>{notif.message}</p>
                  <span className="notif-time">{notif.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
