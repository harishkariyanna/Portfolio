import { useState, useEffect } from 'react';
import { getContacts, toggleContactRead, replyContact, deleteContact } from '../../services/api';
import { FiMail, FiSend, FiTrash2, FiCornerUpLeft, FiX, FiCheck, FiCheckCircle } from 'react-icons/fi';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('all'); // all | unread | read

  const fetchContacts = () => {
    getContacts()
      .then(r => setContacts(r.data?.messages || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchContacts(); }, []);

  const handleToggleRead = async (id) => {
    try {
      const res = await toggleContactRead(id);
      setContacts(prev => prev.map(c => c._id === id ? res.data : c));
    } catch {}
  };

  const handleReply = async () => {
    if (!replyMessage.trim() || !replyTo) return;
    setSending(true);
    try {
      const res = await replyContact(replyTo._id, replyMessage);
      setContacts(prev => prev.map(c => c._id === replyTo._id ? res.data.contact : c));
      setReplyTo(null);
      setReplyMessage('');
    } catch {
      alert('Failed to send reply. Check email configuration.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await deleteContact(id);
      setContacts(prev => prev.filter(c => c._id !== id));
    } catch {}
  };

  const filtered = contacts.filter(c => {
    if (filter === 'unread') return !c.read;
    if (filter === 'read') return c.read;
    return true;
  });

  const unreadCount = contacts.filter(c => !c.read).length;

  if (loading) return <div className="loading">Loading contacts...</div>;

  return (
    <div className="contacts-page">
      <div className="contacts-page-header">
        <h1>Messages {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}</h1>
        <div className="contacts-filters">
          {['all', 'unread', 'read'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">{filter === 'all' ? 'No messages yet.' : `No ${filter} messages.`}</p>
      ) : (
        <div className="contacts-list">
          {filtered.map(c => (
            <div key={c._id} className={`contact-card ${c.read ? 'read' : 'unread'}`}>
              <div className="contact-header">
                <div className="contact-info">
                  <span className={`contact-status-dot ${c.read ? '' : 'new'}`} />
                  <h3>{c.name}</h3>
                  {c.replied && <span className="replied-tag"><FiCheck size={12} /> Replied</span>}
                </div>
                <span className="contact-date">{new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="contact-email">{c.email}</p>
              <p className="contact-subject"><strong>{c.subject}</strong></p>
              <p className="contact-message">{c.message}</p>
              <div className="contact-actions">
                <button className="contact-action-btn" onClick={() => handleToggleRead(c._id)} title={c.read ? 'Mark as unread' : 'Mark as read'}>
                  {c.read ? <FiMail size={16} /> : <FiCheckCircle size={16} />}
                  <span>{c.read ? 'Unread' : 'Read'}</span>
                </button>
                <button className="contact-action-btn reply-btn" onClick={() => { setReplyTo(c); setReplyMessage(''); }} title="Reply">
                  <FiCornerUpLeft size={16} /> <span>Reply</span>
                </button>
                <button className="contact-action-btn delete-btn" onClick={() => handleDelete(c._id)} title="Delete">
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {replyTo && (
        <div className="modal-overlay" onClick={() => setReplyTo(null)}>
          <div className="modal reply-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reply to {replyTo.name}</h2>
              <button className="modal-close" onClick={() => setReplyTo(null)}><FiX /></button>
            </div>
            <div className="reply-original">
              <p className="reply-original-label">Original message:</p>
              <p className="reply-original-text">{replyTo.message}</p>
            </div>
            <div className="reply-form">
              <label>To: <strong>{replyTo.email}</strong></label>
              <textarea
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                placeholder="Type your reply..."
                rows={6}
                className="form-input"
                autoFocus
              />
              <button className="btn btn-primary" onClick={handleReply} disabled={sending || !replyMessage.trim()}>
                {sending ? 'Sending...' : <><FiSend /> Send Reply</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
