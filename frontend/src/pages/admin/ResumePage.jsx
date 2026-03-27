import { useState, useEffect } from 'react';
import { FiUpload, FiDownload, FiTrash2, FiFile } from 'react-icons/fi';
import { generateResume, uploadResume, getCurrentResume, downloadAdminResume, deleteResume } from '../../services/api';

export default function ResumePage() {
  const [targetRole, setTargetRole] = useState('');
  const [style, setStyle] = useState('professional');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Upload state
  const [currentResume, setCurrentResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  useEffect(() => {
    fetchCurrentResume();
  }, []);

  const fetchCurrentResume = async () => {
    try {
      const { data } = await getCurrentResume();
      setCurrentResume(data);
    } catch {
      setCurrentResume(null);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setUploadMsg('Only PDF files are allowed');
      return;
    }
    setUploading(true);
    setUploadMsg('');
    try {
      await uploadResume(file);
      setUploadMsg('Resume uploaded successfully!');
      fetchCurrentResume();
    } catch (err) {
      setUploadMsg(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async () => {
    try {
      const { data } = await downloadAdminResume();
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentResume?.fileName || 'resume.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setUploadMsg('Download failed');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove the uploaded resume?')) return;
    try {
      await deleteResume();
      setCurrentResume(null);
      setUploadMsg('Resume removed');
    } catch {
      setUploadMsg('Failed to remove resume');
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');
    try {
      const { data } = await generateResume({ targetRole, style });
      setResult(data.resume);
    } catch (err) {
      setError(err.response?.data?.error || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="resume-page">
      <h1>Resume Management</h1>

      {/* Upload Section */}
      <div className="resume-upload-section">
        <h2>Upload Resume</h2>
        <p className="text-muted">Upload your master resume PDF. Public visitors can download role-tailored versions.</p>

        {currentResume ? (
          <div className="resume-current">
            <div className="resume-file-info">
              <FiFile size={24} />
              <div>
                <strong>{currentResume.fileName}</strong>
                <span className="text-muted"> ({formatFileSize(currentResume.fileSize)})</span>
                <br />
                <small className="text-muted">
                  Uploaded: {new Date(currentResume.uploadedAt).toLocaleDateString()}
                </small>
              </div>
            </div>
            <div className="resume-file-actions">
              <button className="btn btn-outline btn-sm" onClick={handleDownload}>
                <FiDownload /> View
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                <FiTrash2 /> Remove
              </button>
            </div>
          </div>
        ) : (
          <p className="empty-state">No resume uploaded yet.</p>
        )}

        <label className="btn btn-primary upload-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <FiUpload /> {uploading ? 'Uploading...' : (currentResume ? 'Replace Resume' : 'Upload PDF')}
          <input type="file" accept=".pdf" onChange={handleUpload} disabled={uploading} hidden />
        </label>

        {uploadMsg && <p className={uploadMsg.includes('success') ? 'form-success' : 'form-error'}>{uploadMsg}</p>}
      </div>

      {/* AI Generator Section */}
      <div className="resume-generate-section">
        <h2>AI Resume Generator</h2>
        <p className="text-muted">Generate a text resume using AI based on your portfolio data.</p>
        <form onSubmit={handleGenerate} className="resume-form">
          <div className="form-group">
            <label htmlFor="targetRole">Target Role</label>
            <input id="targetRole" value={targetRole} onChange={e => setTargetRole(e.target.value)} required placeholder="e.g. Senior Full-Stack Developer" />
          </div>
          <div className="form-group">
            <label htmlFor="style">Style</label>
            <select id="style" value={style} onChange={e => setStyle(e.target.value)}>
              <option value="professional">Professional</option>
              <option value="creative">Creative</option>
              <option value="technical">Technical</option>
              <option value="executive">Executive</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Resume'}
          </button>
        </form>
        {error && <div className="form-error">{error}</div>}
        {result && (
          <div className="resume-output">
            <div className="resume-actions">
              <button className="btn btn-outline" onClick={() => navigator.clipboard.writeText(result)}>Copy to Clipboard</button>
            </div>
            <pre className="resume-content">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
