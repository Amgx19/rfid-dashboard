// src/components/Header/Header.js
import React from "react";
import "./Header.css";

function Header({ doorState, darkMode, onToggleDarkMode, isConnected }) {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className={`door-icon ${doorState === "unlocked" ? "unlocked" : ""}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <circle cx="17" cy="12" r="1" fill="currentColor" />
          </svg>
        </div>
        <h1>نظام التحكم بالدخول الذكي</h1>
      </div>
      
      <div className="header-right">
        <p className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          {isConnected ? 'متصل بالخادم' : 'غير متصل بالخادم'}
        </p>
        
        <button className="dark-mode-toggle" onClick={onToggleDarkMode} title={darkMode ? "الوضع النهاري" : "الوضع الليلي"}>
          {darkMode ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}

export default Header;