import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiCode, FiMail, FiUser, FiSun, FiMoon, FiMenu, FiX } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: '/', label: 'Home', icon: <FiHome /> },
    { to: '/projects', label: 'Projects', icon: <FiCode /> },
    { to: '/contact', label: 'Contact', icon: <FiMail /> },
  ];

  return (
    <>
      {/* Mobile hamburger */}
      <button className="sidebar-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
        {mobileOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <nav className={`sidebar public-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <Link to="/" className="sidebar-logo" onClick={() => setMobileOpen(false)}>P</Link>
        </div>
        <div className="sidebar-links">
          {links.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={`sidebar-link ${pathname === to ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
              title={label}
            >
              <span className="sidebar-icon">{icon}</span>
              <span className="sidebar-label">{label}</span>
            </Link>
          ))}
        </div>
        <div className="sidebar-bottom">
          <button
            onClick={toggleTheme}
            className="sidebar-link theme-toggle-btn"
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className="sidebar-icon">{theme === 'dark' ? <FiSun /> : <FiMoon />}</span>
            <span className="sidebar-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
          <Link to="/admin/login" className="sidebar-link" title="Admin" onClick={() => setMobileOpen(false)}>
            <span className="sidebar-icon"><FiUser /></span>
            <span className="sidebar-label">Admin</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
