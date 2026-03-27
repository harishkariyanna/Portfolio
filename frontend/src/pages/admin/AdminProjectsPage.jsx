import { useState, useEffect } from 'react';
import { getProjects, createProject, updateProject, deleteProject } from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { resolveImageUrl } from '../../utils/imageUtils';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = () => {
    setLoading(true);
    getProjects({ limit: 100 })
      .then(r => setProjects(r.data.projects || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await deleteProject(id);
      fetchProjects();
    } catch { /* ignore */ }
  };

  return (
    <div className="admin-projects">
      <div className="page-header">
        <h1>Projects</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          <FiPlus /> Add Project
        </button>
      </div>

      {showForm && (
        <ProjectForm
          project={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={fetchProjects}
        />
      )}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr><th>Image</th><th>Title</th><th>Category</th><th>Published</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p._id}>
                <td>
                  {p.images?.[0]?.url ? (
                    <img 
                      src={resolveImageUrl(p.images[0].url)} 
                      alt={p.title} 
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} 
                    />
                  ) : (
                    <div style={{ width: '50px', height: '50px', background: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#999' }}>No image</div>
                  )}
                </td>
                <td>{p.title}</td>
                <td>{p.category || '-'}</td>
                <td>{p.published ? 'Yes' : 'No'}</td>
                <td className="actions-cell">
                  <button className="btn-icon" onClick={() => { setEditing(p); setShowForm(true); }}><FiEdit2 /></button>
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(p._id)}><FiTrash2 /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ProjectForm({ project, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: project?.title || '',
    description: project?.description || '',
    shortDescription: project?.shortDescription || '',
    category: project?.category || 'web',
    techStack: project?.techStack?.join(', ') || '',
    githubUrl: project?.githubUrl || '',
    liveUrl: project?.liveUrl || '',
    videoUrl: project?.videoUrl || '',
    startDate: project?.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
    endDate: project?.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
    published: project?.published ?? true,
    featured: project?.featured ?? false,
  });
  const [existingImages, setExistingImages] = useState(project?.images || []);
  const [files, setFiles] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleDeleteImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (val !== '' && val !== null && val !== undefined) {
        formData.append(key, val);
      }
    });
    
    // Send existing images that weren't deleted
    formData.append('existingImages', JSON.stringify(existingImages));
    
    if (files) {
      Array.from(files).forEach(f => formData.append('images', f));
    }
    try {
      if (project?._id) {
        await updateProject(project._id, formData);
      } else {
        await createProject(formData);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog">
      <div className="modal-content form-modal">
        <div className="modal-header">
          <h2>{project ? 'Edit Project' : 'New Project'}</h2>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Short Description (optional, for preview)</label>
            <input name="shortDescription" value={form.shortDescription} onChange={handleChange} maxLength={300} />
          </div>
          <div className="form-group">
            <label>Full Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} required rows={4} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleChange}>
                <option value="web">Web</option>
                <option value="mobile">Mobile</option>
                <option value="ai">AI</option>
                <option value="devops">DevOps</option>
                <option value="open-source">Open Source</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tech Stack (comma-separated)</label>
              <input name="techStack" value={form.techStack} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>GitHub URL</label>
              <input name="githubUrl" value={form.githubUrl} onChange={handleChange} type="url" />
            </div>
            <div className="form-group">
              <label>Live URL</label>
              <input name="liveUrl" value={form.liveUrl} onChange={handleChange} type="url" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Video URL (YouTube, Vimeo, etc.)</label>
              <input name="videoUrl" value={form.videoUrl} onChange={handleChange} type="url" placeholder="https://youtube.com/embed/..." />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input name="startDate" value={form.startDate} onChange={handleChange} type="date" />
            </div>
            <div className="form-group">
              <label>End Date (optional)</label>
              <input name="endDate" value={form.endDate} onChange={handleChange} type="date" />
            </div>
          </div>
          <div className="form-row">
            <label className="checkbox-label">
              <input type="checkbox" name="published" checked={form.published} onChange={handleChange} /> Published
            </label>
            <label className="checkbox-label">
              <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} /> Featured
            </label>
          </div>
          <div className="form-group">
            <label>Images</label>
            {existingImages.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                {existingImages.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <img 
                      src={resolveImageUrl(img.url)} 
                      alt={`Project ${idx + 1}`} 
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '2px solid #ddd' }} 
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(idx)}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#ff4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                      title="Delete image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input type="file" multiple accept="image/*" onChange={e => setFiles(e.target.files)} />
            <small style={{ color: '#666', fontSize: '0.85rem' }}>Upload new images (will be added to existing)</small>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
