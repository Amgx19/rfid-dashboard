// src/components/StatsCards/StatsCards.js
import React from "react";
import "./StatsCards.css";

function StatsCards({ logs, cards, todayAttempts }) {
  // حساب الإحصائيات
  const totalAttempts = logs.length;
  const successfulAttempts = logs.filter(log => log.authorized).length;
  const failedAttempts = logs.filter(log => !log.authorized).length;
  const successRate = totalAttempts > 0 ? ((successfulAttempts / totalAttempts) * 100).toFixed(0) : 0;
  
  // محاولات اليوم
  const today = new Date().toDateString();
  const todayLogs = logs.filter(log => new Date(log.time).toDateString() === today);

  const stats = [
    {
      title: "إجمالي البطاقات",
      value: cards.length,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
      color: "purple",
      trend: null
    },
    {
      title: "محاولات ناجحة",
      value: successfulAttempts,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ),
      color: "green",
      trend: `${successRate}%`
    },
    {
      title: "محاولات مرفوضة",
      value: failedAttempts,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      ),
      color: "red",
      trend: null
    },
    {
      title: "محاولات اليوم",
      value: todayLogs.length,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      color: "blue",
      trend: null
    }
  ];

  return (
    <div className="stats-container">
      {stats.map((stat, idx) => (
        <div key={idx} className={`stat-card stat-${stat.color}`}>
          <div className="stat-icon">
            {stat.icon}
          </div>
          <div className="stat-content">
            <p className="stat-title">{stat.title}</p>
            <div className="stat-value-row">
              <h2 className="stat-value">{stat.value}</h2>
              {stat.trend && (
                <span className="stat-trend">{stat.trend}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatsCards;