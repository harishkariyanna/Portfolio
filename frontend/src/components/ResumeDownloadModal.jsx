import { useState, useEffect } from 'react';
import { FiDownload, FiX, FiLoader } from 'react-icons/fi';
import { getResumeRoles, generateRoleResume } from '../services/api';

export default function ResumeDownloadModal({ isOpen, onClose }) {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      getResumeRoles()
        .then(r => setRoles(r.data.roles || []))
        .catch(() => setRoles([
          { value: 'full-stack-developer', label: 'Full Stack Developer' },
          { value: 'software-developer', label: 'Software Developer' },
          { value: 'data-engineer', label: 'Data Engineer' },
          { value: 'ai-engineer', label: 'AI / ML Engineer' },
          { value: 'other', label: 'Other' }
        ]));
      setSelectedRole('');
      setCustomRole('');
      setError('');
    }
  }, [isOpen]);

  const handleDownload = async () => {
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }
    if (selectedRole === 'other' && !customRole.trim()) {
      setError('Please enter the role name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await generateRoleResume(selectedRole, customRole.trim());
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      const roleName = selectedRole === 'other' ? customRole.trim() : selectedRole;
      a.download = `Resume_${roleName.replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch {
      setError('Failed to generate resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Download Resume">
      <div className="modal-content resume-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <FiX />
        </button>

        <h2 className="modal-title">
          <FiDownload /> Download Resume
        </h2>
        <p className="modal-subtitle">
          Select the role you're looking for and I'll tailor my resume accordingly — using only my real skills and experience.
        </p>

        <div className="form-group">
          <label htmlFor="resume-role">Select Role</label>
          <select 
            id="resume-role" 
            value={selectedRole} 
            onChange={e => { setSelectedRole(e.target.value); setError(''); }}
            disabled={loading}
          >
            <option value="">-- Choose a role --</option>
            {roles.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {selectedRole === 'other' && (
          <div className="form-group">
            <label htmlFor="custom-role">Enter Role Name</label>
            <input
              id="custom-role"
              type="text"
              value={customRole}
              onChange={e => { setCustomRole(e.target.value); setError(''); }}
              placeholder="e.g. Cloud Architect, Mobile Developer"
              maxLength={100}
              disabled={loading}
            />
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <button
          className="btn btn-primary modal-download-btn"
          onClick={handleDownload}
          disabled={loading || !selectedRole}
        >
          {loading ? (
            <>
              <FiLoader className="spin" /> Generating Resume...
            </>
          ) : (
            <>
              <FiDownload /> Download Tailored Resume
            </>
          )}
        </button>

        <p className="modal-note">
          The resume will be generated as a PDF with skills and experience relevant to the selected role.
        </p>
      </div>
    </div>
  );
}
