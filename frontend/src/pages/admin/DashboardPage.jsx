import { useState, useEffect } from 'react';
import { getAnalyticsSummary } from '../../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalyticsSummary()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Views</h3>
          <p className="stat-value">{stats?.totalViews || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Unique Sessions</h3>
          <p className="stat-value">{stats?.uniqueSessions || 0}</p>
        </div>
      </div>

      {stats?.deviceBreakdown?.length > 0 && (
        <div className="dashboard-section">
          <h2>Device Breakdown</h2>
          <div className="chart-bars">
            {stats.deviceBreakdown.map(d => (
              <div key={d._id} className="bar-item">
                <span className="bar-label">{d._id || 'unknown'}</span>
                <div className="bar-wrapper">
                  <div className="bar" style={{ width: `${(d.count / stats.totalViews) * 100}%` }} />
                </div>
                <span className="bar-count">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.topPages?.length > 0 && (
        <div className="dashboard-section">
          <h2>Top Pages</h2>
          <table className="data-table">
            <thead><tr><th>Page</th><th>Views</th></tr></thead>
            <tbody>
              {stats.topPages.map(p => (
                <tr key={p._id}><td>{p._id}</td><td>{p.count}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {stats?.actionBreakdown?.length > 0 && (
        <div className="dashboard-section">
          <h2>Actions</h2>
          <div className="chart-bars">
            {stats.actionBreakdown.map(a => (
              <div key={a._id} className="bar-item">
                <span className="bar-label">{a._id}</span>
                <div className="bar-wrapper">
                  <div className="bar" style={{ width: `${(a.count / stats.totalViews) * 100}%` }} />
                </div>
                <span className="bar-count">{a.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
