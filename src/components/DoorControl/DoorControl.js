// src/components/DoorControl/DoorControl.js
import React from "react";
import "./DoorControl.css";

function DoorControl({ doorState, onUnlock, onLock }) {
  return (
    <div className="card panel-card">
      <div className="panel-header">
        <div className="icon-badge bg-blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <circle cx="17" cy="12" r="1" fill="currentColor" />
          </svg>
        </div>
        <h3>حالة البوابة</h3>
      </div>

      <div className="door-control">
        {/* مؤشر دائري بسيط وأنيق */}
        <div className="barrier-container">
          <div className={`circle-indicator ${doorState === "unlocked" ? "unlocked" : "locked"}`}>
            {doorState === "unlocked" ? (
              // أيقونة قفل مفتوح
              <svg className="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
              </svg>
            ) : (
              // أيقونة قفل مغلق
              <svg className="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            )}
          </div>
        </div>
        <p className="door-status-text">{doorState === "unlocked" ? "مفتوح" : "مغلق"}</p>
      </div>

      <div className="door-buttons">
        <button className="btn btn-success" onClick={onUnlock}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
          </svg>
          فتح البوابة
        </button>
        <button className="btn btn-danger" onClick={onLock}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          قفل البوابة
        </button>
      </div>
    </div>
  );
}

export default DoorControl;