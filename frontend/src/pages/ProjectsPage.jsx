import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { getProjects } from '../services/api';
import ProjectCard from '../components/ProjectCard';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 9 };
    if (category) params.category = category;
    getProjects(params)
      .then(r => {
        setProjects(r.data.projects || []);
        setTotalPages(r.data.totalPages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, category]);

  return (
    <>
      <Helmet>
        <title>Projects | Portfolio</title>
      </Helmet>
      <section className="section">
        <h1 className="section-title">Projects</h1>
        <div className="filter-bar">
          {['', 'web', 'mobile', 'ai', 'devops', 'open-source', 'other'].map(cat => (
            <button
              key={cat}
              className={`filter-btn ${category === cat ? 'active' : ''}`}
              onClick={() => { setCategory(cat); setPage(1); }}
            >
              {cat || 'All'}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="loading">Loading projects...</div>
        ) : projects.length > 0 ? (
          <div className="projects-grid">
            {projects.map(p => <ProjectCard key={p._id} project={p} />)}
          </div>
        ) : (
          <p className="empty-state">No projects found.</p>
        )}
        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </section>
    </>
  );
}
