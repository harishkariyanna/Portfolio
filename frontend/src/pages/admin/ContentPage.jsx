import { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { aboutApi, skillsApi, experiencesApi, educationApi, certificatesApi, testimonialsApi, achievementsApi, uploadProfileImage, getLinkedInAuthUrl, syncLinkedInProfile } from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUpload, FiExternalLink, FiMenu } from 'react-icons/fi';
import { FaGithub, FaLinkedin, FaTwitter, FaFacebook, FaInstagram, FaYoutube, FaMedium, FaDev, FaStackOverflow, FaBehance, FaDribbble, FaGlobe } from 'react-icons/fa';

// Map skill names to Simple Icons slugs (https://simpleicons.org)
const SKILL_ICON_MAP = {
  react: 'react', 'react.js': 'react', reactjs: 'react',
  angular: 'angular', vue: 'vuedotjs', 'vue.js': 'vuedotjs',
  javascript: 'javascript', typescript: 'typescript',
  html: 'html5', html5: 'html5', css: 'css3', css3: 'css3',
  'node.js': 'nodedotjs', nodejs: 'nodedotjs', node: 'nodedotjs',
  express: 'express', 'express.js': 'express',
  python: 'python', java: 'openjdk', 'c#': 'csharp', csharp: 'csharp',
  'c++': 'cplusplus', c: 'c', go: 'go', golang: 'go', rust: 'rust',
  ruby: 'ruby', php: 'php', swift: 'swift', kotlin: 'kotlin', dart: 'dart',
  flutter: 'flutter', 'react native': 'react',
  mongodb: 'mongodb', postgresql: 'postgresql', postgres: 'postgresql',
  mysql: 'mysql', redis: 'redis', sqlite: 'sqlite',
  docker: 'docker', kubernetes: 'kubernetes', aws: 'amazonwebservices',
  azure: 'microsoftazure', gcp: 'googlecloud', 'google cloud': 'googlecloud',
  git: 'git', github: 'github', gitlab: 'gitlab',
  linux: 'linux', nginx: 'nginx', apache: 'apache',
  graphql: 'graphql', rest: 'openapiinitiative',
  tailwind: 'tailwindcss', 'tailwind css': 'tailwindcss', tailwindcss: 'tailwindcss',
  bootstrap: 'bootstrap', sass: 'sass', scss: 'sass',
  webpack: 'webpack', vite: 'vite', babel: 'babel',
  jest: 'jest', cypress: 'cypress', playwright: 'playwright',
  figma: 'figma', 'adobe xd': 'adobexd',
  firebase: 'firebase', supabase: 'supabase',
  nextjs: 'nextdotjs', 'next.js': 'nextdotjs',
  nuxt: 'nuxtdotjs', 'nuxt.js': 'nuxtdotjs',
  django: 'django', flask: 'flask', fastapi: 'fastapi',
  spring: 'spring', 'spring boot': 'springboot',
  '.net': 'dotnet', dotnet: 'dotnet',
  terraform: 'terraform', ansible: 'ansible', jenkins: 'jenkins',
  'ci/cd': 'githubactions', vercel: 'vercel', netlify: 'netlify',
  heroku: 'heroku', render: 'render',
  openai: 'openai', tensorflow: 'tensorflow', pytorch: 'pytorch',
  pandas: 'pandas', numpy: 'numpy', scikit: 'scikitlearn',
  'machine learning': 'scikitlearn', ai: 'openai',
  postman: 'postman', insomnia: 'insomnia',
  slack: 'slack', jira: 'jira', notion: 'notion', trello: 'trello',
  'vs code': 'visualstudiocode', vscode: 'visualstudiocode',
};

function getSkillIconUrl(skillName) {
  const slug = SKILL_ICON_MAP[skillName?.toLowerCase()?.trim()];
  if (slug) return `https://cdn.simpleicons.org/${slug}`;
  return '';
}
// Sortable Row Component
function SortableRow({ item, entity, onEdit, onDelete, formatValue }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'default',
  };

  return (
    <tr ref={setNodeRef} style={style}>
      <td className="drag-handle" {...attributes} {...listeners}>
        <FiMenu style={{ cursor: 'grab', color: 'var(--text-muted)' }} />
      </td>
      {entity.columns.map(col => <td key={col}>{formatValue(item[col])}</td>)}
      <td className="actions-cell">
        <button className="btn-icon" onClick={() => onEdit(item)}><FiEdit2 /></button>
        <button className="btn-icon btn-danger" onClick={() => onDelete(item._id)}><FiTrash2 /></button>
      </td>
    </tr>
  );
}
const ENTITIES = {
  about: {
    label: 'About Me',
    api: aboutApi,
    fields: [
      { name: 'headline', label: 'Headline', type: 'text', required: true },
      { name: 'bio', label: 'Bio', type: 'textarea', required: true },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'profileImage', label: 'Profile Image', type: 'profile-upload' },
      { name: 'resumeUrl', label: 'Resume URL', type: 'url' },
      { name: 'socialLinks', label: 'Social Links', type: 'social-links' },
      { name: 'typingTaglines', label: 'Typing Taglines (comma-separated)', type: 'taglines' },
    ],
    columns: ['headline', 'location', 'email'],
  },
  skills: {
    label: 'Skills',
    api: skillsApi,
    fields: [
      { name: 'name', label: 'Skill Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select-custom', required: true, options: ['frontend', 'backend', 'database', 'devops', 'mobile', 'ai', 'tools', 'soft-skills', 'other'] },
      { name: 'customCategory', label: 'Custom Category', type: 'text', showIf: { field: 'category', value: 'other' } },
      { name: 'proficiency', label: 'Proficiency (1-5)', type: 'number', required: true, min: 1, max: 5 },
      { name: 'yearsOfExperience', label: 'Years of Experience', type: 'number', min: 0 },
      { name: 'icon', label: 'Icon URL (auto-detected)', type: 'icon-suggest' },
    ],
    columns: ['name', 'category', 'proficiency'],
  },
  experiences: {
    label: 'Experiences',
    api: experiencesApi,
    fields: [
      { name: 'company', label: 'Company', type: 'text', required: true },
      { name: 'role', label: 'Role', type: 'text', required: true },
      { name: 'companyLogo', label: 'Company Logo', type: 'image-upload' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'endDate', label: 'End Date', type: 'date' },
      { name: 'current', label: 'Currently Working', type: 'checkbox' },
      { name: 'location', label: 'Location', type: 'text' },
    ],
    columns: ['company', 'role', 'location'],
  },
  education: {
    label: 'Education',
    api: educationApi,
    fields: [
      { name: 'institution', label: 'Institution', type: 'text', required: true },
      { name: 'degree', label: 'Degree', type: 'text', required: true },
      { name: 'fieldOfStudy', label: 'Field of Study', type: 'text' },
      { name: 'collegeLogo', label: 'College Logo', type: 'image-upload' },
      { name: 'grade', label: 'Grade/GPA', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'endDate', label: 'End Date', type: 'date' },
      { name: 'current', label: 'Currently Studying', type: 'checkbox' },
      { name: 'location', label: 'Location', type: 'text' },
    ],
    columns: ['institution', 'degree', 'fieldOfStudy'],
  },
  certificates: {
    label: 'Certificates',
    api: certificatesApi,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'issuer', label: 'Issuer', type: 'text', required: true },
      { name: 'issueDate', label: 'Issue Date', type: 'date', required: true },
      { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
      { name: 'credentialId', label: 'Credential ID', type: 'text' },
      { name: 'verificationUrl', label: 'Verification URL', type: 'url' },
    ],
    columns: ['title', 'issuer', 'issueDate'],
  },
  testimonials: {
    label: 'Testimonials',
    api: testimonialsApi,
    fields: [
      { name: 'clientName', label: 'Client Name', type: 'text', required: true },
      { name: 'company', label: 'Company', type: 'text' },
      { name: 'role', label: 'Role', type: 'text' },
      { name: 'feedback', label: 'Feedback', type: 'textarea', required: true },
      { name: 'rating', label: 'Rating (1-5)', type: 'number', required: true, min: 1, max: 5 },
      { name: 'featured', label: 'Featured', type: 'checkbox' },
    ],
    columns: ['clientName', 'company', 'rating'],
  },
  achievements: {
    label: 'Achievements',
    api: achievementsApi,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'category', label: 'Category', type: 'select', required: true, options: ['award', 'hackathon', 'certification', 'publication', 'speaking', 'other'] },
      { name: 'issuer', label: 'Issuer', type: 'text' },
      { name: 'link', label: 'Link', type: 'url' },
    ],
    columns: ['title', 'category', 'date'],
  },
};

export default function ContentPage() {
  const [activeEntity, setActiveEntity] = useState('about');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [linkedinSyncing, setLinkedinSyncing] = useState(false);
  const [linkedinMsg, setLinkedinMsg] = useState('');

  const entity = ENTITIES[activeEntity];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchItems = () => {
    setLoading(true);
    entity.api.getAll()
      .then(r => setItems(Array.isArray(r.data) ? r.data : [r.data].filter(Boolean)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(item => item._id === active.id);
    const newIndex = items.findIndex(item => item._id === over.id);

    const reorderedItems = arrayMove(items, oldIndex, newIndex);
    setItems(reorderedItems);

    // Update order in backend
    try {
      const updates = reorderedItems.map((item, index) => ({
        id: item._id,
        order: index
      }));

      // Batch update orders
      await Promise.all(
        updates.map(({ id, order }) => entity.api.update(id, { order }))
      );
    } catch (err) {
      // Revert on error
      fetchItems();
      console.error('Failed to reorder items:', err);
    }
  };

  const handleLinkedInSync = async () => {
    try {
      const { data } = await getLinkedInAuthUrl();
      window.location.href = data.authUrl;
    } catch {
      setLinkedinMsg('Failed to initiate LinkedIn auth');
    }
  };

  const handleLinkedInCallback = async (code) => {
    setLinkedinSyncing(true);
    setLinkedinMsg('');
    try {
      await syncLinkedInProfile(code);
      setLinkedinMsg('✅ LinkedIn profile synced successfully!');
      fetchItems();
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      setLinkedinMsg('❌ ' + (err.response?.data?.error || 'Failed to sync LinkedIn profile'));
    } finally {
      setLinkedinSyncing(false);
    }
  };

  useEffect(() => {
    fetchItems();
    setShowForm(false);
    setEditing(null);
    // Check if LinkedIn callback
    const params = new URLSearchParams(window.location.search);
    if (params.get('linkedinCallback') && params.get('code')) {
      handleLinkedInCallback(params.get('code'));
    }
  }, [activeEntity]);

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete this ${entity.label.slice(0, -1)}?`)) return;
    try {
      await entity.api.remove(id);
      fetchItems();
    } catch { /* ignore */ }
  };

  const formatValue = (val) => {
    if (val === undefined || val === null) return '-';
    if (val instanceof Date || (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val))) {
      return new Date(val).toLocaleDateString();
    }
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    return String(val);
  };

  return (
    <div className="content-page">
      <h1>Content Management</h1>

      <div className="content-tabs">
        {Object.entries(ENTITIES).map(([key, cfg]) => (
          <button
            key={key}
            className={`tab-btn ${activeEntity === key ? 'active' : ''}`}
            onClick={() => setActiveEntity(key)}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      <div className="page-header" style={{ marginTop: '1rem' }}>
        <h2>{entity.label}</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {activeEntity === 'about' && (
            <button 
              className="btn btn-outline" 
              onClick={handleLinkedInSync}
              disabled={linkedinSyncing}
              title="Import profile data from LinkedIn"
            >
              <FaLinkedin /> {linkedinSyncing ? 'Syncing...' : 'Sync LinkedIn'}
            </button>
          )}
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <FiPlus /> Add {entity.label.replace(/s$/, '')}
          </button>
        </div>
      </div>

      {linkedinMsg && (
        <div className={linkedinMsg.startsWith('✅') ? 'form-success' : 'form-error'} style={{ marginTop: '1rem' }}>
          {linkedinMsg}
        </div>
      )}

      {showForm && (
        <ContentForm
          entity={entity}
          item={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={fetchItems}
        />
      )}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : items.length === 0 ? (
        <p className="empty-state">No {entity.label.toLowerCase()} yet.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                {entity.columns.map(col => <th key={col}>{col.charAt(0).toUpperCase() + col.slice(1)}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <SortableContext items={items.map(i => i._id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {items.map(item => (
                  <SortableRow
                    key={item._id}
                    item={item}
                    entity={entity}
                    onEdit={(item) => { setEditing(item); setShowForm(true); }}
                    onDelete={handleDelete}
                    formatValue={formatValue}
                  />
                ))}
              </tbody>
            </SortableContext>
          </table>
        </DndContext>
      )}
    </div>
  );
}

function ContentForm({ entity, item, onClose, onSaved }) {
  const buildInitialForm = () => {
    const initial = {};
    entity.fields.forEach(f => {
      if (item && item[f.name] !== undefined) {
        if (f.type === 'date' && item[f.name]) {
          initial[f.name] = new Date(item[f.name]).toISOString().split('T')[0];
        } else if (f.type === 'social-links') {
          initial[f.name] = item[f.name] || [];
        } else if (f.type === 'taglines') {
          initial[f.name] = Array.isArray(item[f.name]) ? item[f.name].join(', ') : '';
        } else {
          initial[f.name] = item[f.name];
        }
      } else {
        if (f.type === 'social-links') {
          initial[f.name] = [];
        } else {
          initial[f.name] = f.type === 'checkbox' ? false : f.type === 'number' ? '' : '';
        }
      }
    });

    // Handle custom category for skills on edit
    if (item && item.category) {
      const standardCategories = ['frontend', 'backend', 'database', 'devops', 'mobile', 'ai', 'tools', 'soft-skills'];
      if (!standardCategories.includes(item.category)) {
        initial.category = 'other';
        initial.customCategory = item.category;
      }
    }

    return initial;
  };

  const [form, setForm] = useState(buildInitialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const getSocialIcon = (platform) => {
    const icons = {
      github: FaGithub,
      linkedin: FaLinkedin,
      twitter: FaTwitter,
      facebook: FaFacebook,
      instagram: FaInstagram,
      youtube: FaYoutube,
      medium: FaMedium,
      devto: FaDev,
      stackoverflow: FaStackOverflow,
      behance: FaBehance,
      dribbble: FaDribbble,
      website: FaGlobe,
    };
    const Icon = icons[platform] || FaGlobe;
    return <Icon />;
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await uploadProfileImage(file);
      setForm(f => ({ ...f, profileImage: response.data.url }));
    } catch (err) {
      setError('Failed to upload profile image');
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await uploadProfileImage(file); // Reuse the same endpoint
      setForm(f => ({ ...f, [fieldName]: response.data.url }));
    } catch (err) {
      setError(`Failed to upload ${fieldName}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAddSocialLink = () => {
    setForm(f => ({
      ...f,
      socialLinks: [...(f.socialLinks || []), { platform: 'github', url: '', visible: true, order: f.socialLinks?.length || 0 }]
    }));
  };

  const handleRemoveSocialLink = (index) => {
    setForm(f => ({
      ...f,
      socialLinks: f.socialLinks.filter((_, i) => i !== index)
    }));
  };

  const handleSocialLinkChange = (index, field, value) => {
    setForm(f => ({
      ...f,
      socialLinks: f.socialLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => {
      const updated = { ...f, [name]: type === 'checkbox' ? checked : value };
      // Auto-populate icon when skill name changes
      if (name === 'name' && entity.fields.some(field => field.type === 'icon-suggest')) {
        const autoIcon = getSkillIconUrl(value);
        if (autoIcon) updated.icon = autoIcon;
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Clean empty strings
    const payload = {};
    Object.entries(form).forEach(([key, val]) => {
      if (val !== '' && val !== null && val !== undefined) {
        // Handle typing taglines - convert comma-separated string to array
        if (key === 'typingTaglines' && typeof val === 'string') {
          payload[key] = val.split(',').map(s => s.trim()).filter(Boolean);
        } 
        // Handle custom category for skills
        else if (key === 'customCategory' && form.category === 'other' && val) {
          payload.category = val.trim();
        }
        // Skip customCategory field itself (already merged into category above)
        else if (key !== 'customCategory') {
          payload[key] = val;
        }
      }
    });

    try {
      if (item?._id) {
        await entity.api.update(item._id, payload);
      } else {
        await entity.api.create(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Save failed';
      const details = err.response?.data?.details;
      setError(details ? details.map(d => d.message).join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog">
      <div className="modal-content form-modal">
        <div className="modal-header">
          <h2>{item ? 'Edit' : 'Add'} {entity.label.replace(/s$/, '')}</h2>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          {entity.fields.map(f => {
            // Check if field should be shown based on conditions
            if (f.showIf) {
              const conditionMet = form[f.showIf.field] === f.showIf.value;
              if (!conditionMet) return null;
            }

            return (
            <div className="form-group" key={f.name}>
              {f.type === 'checkbox' ? (
                <label className="checkbox-label">
                  <input type="checkbox" name={f.name} checked={!!form[f.name]} onChange={handleChange} />
                  {f.label}
                </label>
              ) : f.type === 'profile-upload' ? (
                <div className="profile-upload-field">
                  <label>{f.label}</label>
                  <div className="profile-upload-container">
                    {form[f.name] && (
                      <div className="profile-preview">
                        <img src={form[f.name]} alt="Profile" />
                      </div>
                    )}
                    <div className="upload-controls">
                      <input
                        type="file"
                        id="profile-upload"
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                        disabled={uploading}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="profile-upload" className="btn btn-outline">
                        <FiUpload /> {uploading ? 'Uploading...' : 'Upload Image'}
                      </label>
                      {form[f.name] && (
                        <a href={form[f.name]} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                          <FiExternalLink /> View
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ) : f.type === 'image-upload' ? (
                <div className="image-upload-field">
                  <label>{f.label}</label>
                  {form[f.name] && (
                    <div className="image-preview" style={{ marginBottom: '0.5rem' }}>
                      <img src={form[f.name]} alt={f.label} style={{ width: '80px', height: '80px', objectFit: 'contain', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.25rem' }} />
                    </div>
                  )}
                  <div className="upload-controls">
                    <input
                      type="file"
                      id={`image-upload-${f.name}`}
                      accept="image/*"
                      onChange={e => handleImageUpload(e, f.name)}
                      disabled={uploading}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor={`image-upload-${f.name}`} className="btn btn-outline btn-sm">
                      <FiUpload /> {uploading ? 'Uploading...' : (form[f.name] ? 'Change' : 'Upload')}
                    </label>
                    {form[f.name] && (
                      <>
                        <a href={form[f.name]} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                          <FiExternalLink /> View
                        </a>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setForm(f => ({ ...f, [f.name]: '' }))}
                        >
                          <FiX /> Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : f.type === 'social-links' ? (
                <div className="social-links-field">
                  <label>{f.label}</label>
                  <div className="social-links-list">
                    {(form[f.name] || []).map((link, idx) => (
                      <div key={idx} className="social-link-item">
                        <div className="social-link-icon">
                          {getSocialIcon(link.platform)}
                        </div>
                        <select
                          value={link.platform}
                          onChange={e => handleSocialLinkChange(idx, 'platform', e.target.value)}
                        >
                          <option value="github">GitHub</option>
                          <option value="linkedin">LinkedIn</option>
                          <option value="twitter">Twitter</option>
                          <option value="facebook">Facebook</option>
                          <option value="instagram">Instagram</option>
                          <option value="youtube">YouTube</option>
                          <option value="medium">Medium</option>
                          <option value="devto">Dev.to</option>
                          <option value="stackoverflow">Stack Overflow</option>
                          <option value="behance">Behance</option>
                          <option value="dribbble">Dribbble</option>
                          <option value="website">Website</option>
                        </select>
                        <input
                          type="url"
                          value={link.url}
                          onChange={e => handleSocialLinkChange(idx, 'url', e.target.value)}
                          placeholder="https://..."
                        />
                        <label className="social-link-toggle">
                          <input
                            type="checkbox"
                            checked={link.visible !== false}
                            onChange={e => handleSocialLinkChange(idx, 'visible', e.target.checked)}
                          />
                          <span>Visible</span>
                        </label>
                        <button
                          type="button"
                          className="btn-icon btn-danger"
                          onClick={() => handleRemoveSocialLink(idx)}
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="btn btn-outline" onClick={handleAddSocialLink}>
                    <FiPlus /> Add Social Link
                  </button>
                </div>
              ) : f.type === 'taglines' ? (
                <>
                  <label>{f.label}</label>
                  <textarea
                    name={f.name}
                    value={form[f.name]}
                    onChange={handleChange}
                    placeholder="e.g., Full-Stack Developer, AI Enthusiast, Open Source Contributor"
                    rows={2}
                  />
                  <small style={{ color: '#888', fontSize: '0.85rem' }}>Separate multiple taglines with commas</small>
                </>
              ) : (
                <>
                  <label>{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea name={f.name} value={form[f.name]} onChange={handleChange} required={f.required} rows={4} />
                  ) : f.type === 'select' ? (
                    <select name={f.name} value={form[f.name]} onChange={handleChange} required={f.required}>
                      <option value="">Select...</option>
                      {f.options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                    </select>
                  ) : f.type === 'select-custom' ? (
                    <select name={f.name} value={form[f.name]} onChange={handleChange} required={f.required}>
                      <option value="">Select...</option>
                      {f.options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                    </select>
                  ) : f.type === 'icon-suggest' ? (
                    <div className="icon-suggest-field">
                      <input
                        type="text"
                        name={f.name}
                        value={form[f.name]}
                        onChange={handleChange}
                        placeholder="Auto-detected from skill name, or paste URL"
                      />
                      {form[f.name] && (
                        <div className="icon-preview">
                          <img src={form[f.name]} alt="icon preview" width="28" height="28" onError={e => { e.target.style.display = 'none'; }} />
                          <span className="icon-preview-label">Preview</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type={f.type}
                      name={f.name}
                      value={form[f.name]}
                      onChange={handleChange}
                      required={f.required}
                      min={f.min}
                      max={f.max}
                    />
                  )}
                </>
              )}
            </div>
            );
          })}
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
