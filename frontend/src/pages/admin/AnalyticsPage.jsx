import { useState, useEffect } from 'react';
import { getAnalyticsSummary } from '../../services/api';

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalyticsSummary()
      .then(r => setStats(r.data))
      .catch((err) => {
        console.error('Failed to load analytics:', err);
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (!stats || stats.totalViews === 0) return (
    <div className="analytics-page">
      <h1>Analytics</h1>
      <div className="empty-state">
        <p>No analytics data available yet.</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Visitor analytics will appear here once people start browsing your portfolio.
        </p>
      </div>
    </div>
  );

  return (
    <div className="analytics-page">
      <h1>Analytics</h1>
      <div className="stats-grid">
        <div className="stat-card"><h3>Total Views</h3><p className="stat-value">{stats.totalViews}</p></div>
        <div className="stat-card"><h3>Unique Sessions</h3><p className="stat-value">{stats.uniqueSessions}</p></div>
      </div>

      {stats.dailyViews?.length > 0 && (
        <div className="dashboard-section">
          <h2>Daily Views (Last 30 Days)</h2>
          <div className="daily-chart">
            {stats.dailyViews.map(d => (
              <div key={d._id} className="daily-bar-col">
                <div className="daily-bar" style={{ height: `${Math.max(4, (d.count / Math.max(...stats.dailyViews.map(v => v.count))) * 150)}px` }} />
                <span className="daily-label">{d._id.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.topPages?.length > 0 && (
        <div className="dashboard-section">
          <h2>Top Pages</h2>
          <table className="data-table">
            <thead><tr><th>Page</th><th>Views</th></tr></thead>
            <tbody>
              {stats.topPages.map(p => <tr key={p._id}><td>{p._id}</td><td>{p.count}</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
