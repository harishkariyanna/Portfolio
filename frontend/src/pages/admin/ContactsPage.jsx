import { useState, useEffect } from 'react';
import { getContacts } from '../../services/api';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContacts()
      .then(r => setContacts(r.data?.messages || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading contacts...</div>;

  return (
    <div className="contacts-page">
      <h1>Contact Submissions</h1>
      {contacts.length === 0 ? (
        <p className="empty-state">No contact submissions yet.</p>
      ) : (
        <div className="contacts-list">
          {contacts.map((c, i) => (
            <div key={i} className="contact-card">
              <div className="contact-header">
                <h3>{c.name}</h3>
                <span className="contact-date">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="contact-email">{c.email}</p>
              <p className="contact-subject"><strong>{c.subject}</strong></p>
              <p className="contact-message">{c.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
