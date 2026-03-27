import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { submitContact } from '../services/api';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await submitContact(form);
      setStatus({ type: 'success', msg: 'Message sent successfully!' });
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to send message';
      setStatus({ type: 'error', msg: errorMsg });
      console.error('Contact form error:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Contact | Portfolio</title></Helmet>
      <section className="section">
        <h1 className="section-title">Get in Touch</h1>
        <form className="contact-form" onSubmit={handleSubmit}>
          {status && <div className={`form-${status.type}`}>{status.msg}</div>}
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" value={form.name} onChange={handleChange} required maxLength={100} />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="subject">Subject (Optional)</label>
            <input id="subject" name="subject" value={form.subject} onChange={handleChange} maxLength={200} />
          </div>
          <div className="form-group">
            <label htmlFor="message">Message (minimum 10 characters)</label>
            <textarea id="message" name="message" value={form.message} onChange={handleChange} required minLength={10} rows={6} maxLength={2000} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </section>
    </>
  );
}
