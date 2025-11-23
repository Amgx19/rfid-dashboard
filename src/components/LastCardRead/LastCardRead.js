// src/components/LastCardRead/LastCardRead.js
import React from "react";
import "./LastCardRead.css";

function LastCardRead({ lastCard, lastCardName, status }) {
  return (
    <div className="card panel-card">
      <div className="panel-header">
        <div className="icon-badge bg-indigo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        </div>
        <h3>آخر بطاقة مقروءة</h3>
      </div>

      <div className={`card-display ${lastCard !== "-" ? "active" : ""}`}>
        {lastCardName && <p className="card-name">{lastCardName}</p>}
        <p className="card-uid">{lastCard}</p>
      </div>

      <div className="status-display">
        {status.includes("مصرح") ? (
          <>
            <svg className="status-icon success" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span className="status-text success">مصرح بالدخول</span>
          </>
        ) : status.includes("مرفوض") ? (
          <>
            <svg className="status-icon error" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span className="status-text error">غير مصرح</span>
          </>
        ) : (
          <span className="status-text idle">في انتظار القراءة...</span>
        )}
      </div>
    </div>
  );
}

export default LastCardRead;