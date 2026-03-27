import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiCode, FiMail, FiUser, FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();

  const links = [
    { to: '/', label: 'Home', icon: <FiHome /> },
    { to: '/projects', label: 'Projects', icon: <FiCode /> },
    { to: '/contact', label: 'Contact', icon: <FiMail /> },
  ];

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">Portfolio</Link>
      <div className="navbar-links">
        {links.map(({ to, label, icon }) => (
          <Link
            key={to}
            to={to}
            className={`nav-link ${pathname === to ? 'active' : ''}`}
          >
            {icon} <span>{label}</span>
          </Link>
        ))}
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label="Toggle theme"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <FiSun /> : <FiMoon />}
        </button>
        <Link to="/admin/login" className="nav-link nav-admin">
          <FiUser /> <span>Admin</span>
        </Link>
      </div>
    </nav>
  );
}
