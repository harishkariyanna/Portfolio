import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiGrid, FiFolder, FiBarChart2, FiFileText, FiMail, FiUser, FiLogOut, FiLayers, FiMenu, FiX } from 'react-icons/fi';

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const links = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <FiGrid /> },
    { to: '/admin/projects', label: 'Projects', icon: <FiFolder /> },
    { to: '/admin/content', label: 'Content', icon: <FiLayers /> },
    { to: '/admin/analytics', label: 'Analytics', icon: <FiBarChart2 /> },
    { to: '/admin/resume', label: 'Resume', icon: <FiFileText /> },
    { to: '/admin/contacts', label: 'Contacts', icon: <FiMail /> },
    { to: '/admin/profile', label: 'Profile', icon: <FiUser /> },
  ];

  return (
    <div className="admin-layout">
      {/* Mobile hamburger */}
      <button className="sidebar-mobile-toggle admin-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
        {mobileOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-logo">A</span>
        </div>
        <nav className="sidebar-links">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
              title={label}
            >
              <span className="sidebar-icon">{icon}</span>
              <span className="sidebar-label">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={handleLogout} className="sidebar-link logout-btn" title="Logout">
            <span className="sidebar-icon"><FiLogOut /></span>
            <span className="sidebar-label">Logout</span>
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
