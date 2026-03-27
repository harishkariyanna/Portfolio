import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiGrid, FiFolder, FiBarChart2, FiFileText, FiMail, FiUser, FiLogOut, FiLayers } from 'react-icons/fi';

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
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
      <aside className="admin-sidebar">
        <h2 className="admin-logo">Admin Panel</h2>
        <nav className="admin-nav">
          {links.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
              {icon} <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button onClick={handleLogout} className="admin-logout-btn">
          <FiLogOut /> Logout
        </button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
