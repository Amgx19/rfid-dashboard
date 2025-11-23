// src/components/ActivityLogs/ActivityLogs.js
import React, { useState } from "react";
import "./ActivityLogs.css";

function ActivityLogs({ logs, onRefresh, onClearLogs }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClear = () => {
    setShowConfirm(true);
  };

  const confirmClear = () => {
    onClearLogs();
    setShowConfirm(false);
  };

  const cancelClear = () => {
    setShowConfirm(false);
  };

  return (
    <div className="card panel-card">
      <div className="panel-header">
        <div className="icon-badge bg-amber">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h3>سجل المحاولات</h3>
        <div className="header-actions">
          <button className="btn-icon refresh-btn" onClick={onRefresh} title="تحديث">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
          <button className="btn-icon clear-btn" onClick={handleClear} title="مسح السجل">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </div>
      </div>

      {/* نافذة التأكيد */}
      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <div className="confirm-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h3>تأكيد الحذف</h3>
            <p>هل أنت متأكد من حذف جميع سجلات المحاولات؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="confirm-buttons">
              <button className="btn btn-danger" onClick={confirmClear}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                نعم، احذف الكل
              </button>
              <button className="btn btn-secondary" onClick={cancelClear}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="logs-list">
        {logs.length === 0 ? (
          <p className="empty-state">لا توجد محاولات بعد</p>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className={`log-item ${log.authorized ? "success" : "error"}`}>
              <div className="log-content">
                <svg className="log-icon" viewBox="0 0 24 24" fill="currentColor">
                  {log.authorized ? (
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  ) : (
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  )}
                </svg>
                <div className="log-details">
                  {log.name && <span className="log-name">{log.name}</span>}
                  <span className="log-uid">{log.uid}</span>
                </div>
              </div>
              <span className="log-time">{new Date(log.time).toLocaleString('ar-SA')}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ActivityLogs;