import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, logoutUser } from '../../store/slices/authSlice';

export default function PublicNavbar({ dark = false }) {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/auth/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/auth/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'coach') return '/coach/dashboard';
    return '/athlete/dashboard';
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/notices', label: 'Competitions' },
    { to: '/contact', label: 'Contact' },
  ];

  const navStyle = {
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        
        .navbar-root {
          width: 100%; font-family: 'Outfit', sans-serif;
        }
        
        .navbar-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 24px; height: 64px;
        }
        
        .nav-logo {
          font-size: 20px; font-weight: 800; text-decoration: none; letter-spacing: -0.5px;
          background: linear-gradient(135deg, #3B82F6, #8B5CF6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          display: flex; align-items: center; gap: 8px;
        }
        
        .nav-links {
          display: flex; align-items: center; gap: 4px;
          list-style: none;
        }
        
        .nav-link {
          padding: 8px 14px; border-radius: 8px;
          text-decoration: none; font-size: 14px; font-weight: 500;
          transition: all 0.15s;
          color: rgba(255,255,255,0.6);
        }
        .nav-link:hover { color: #fff; background: rgba(255,255,255,0.06); }
        .nav-link.active { color: #fff; background: rgba(59,130,246,0.12); }
        
        .nav-link-light { color: rgba(0,0,0,0.6); }
        .nav-link-light:hover { color: #000; background: rgba(0,0,0,0.05); }
        .nav-link-light.active { color: #1565C0; background: rgba(21,101,192,0.08); }
        
        .nav-actions { display: flex; align-items: center; gap: 10px; }
        
        .btn-nav-login {
          padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;
          border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.8);
          background: transparent; cursor: pointer; text-decoration: none;
          transition: all 0.15s; font-family: inherit;
          display: inline-flex; align-items: center;
        }
        .btn-nav-login:hover { border-color: rgba(255,255,255,0.4); color: #fff; }
        
        .btn-nav-cta {
          padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 700;
          background: linear-gradient(135deg, #3B82F6, #6366F1); color: #fff;
          border: none; cursor: pointer; text-decoration: none;
          transition: all 0.15s; font-family: inherit;
          display: inline-flex; align-items: center;
          box-shadow: 0 0 20px rgba(99,102,241,0.3);
        }
        .btn-nav-cta:hover { opacity: 0.9; box-shadow: 0 0 28px rgba(99,102,241,0.5); }
        
        .btn-nav-dashboard {
          padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 700;
          background: linear-gradient(135deg, #3B82F6, #6366F1); color: #fff;
          border: none; cursor: pointer; text-decoration: none;
          transition: all 0.15s; font-family: inherit;
          display: inline-flex; align-items: center; gap: 6px;
        }
        
        .btn-nav-logout {
          padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 500;
          border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5);
          background: transparent; cursor: pointer; font-family: inherit;
          transition: all 0.15s;
        }
        .btn-nav-logout:hover { color: rgba(255,255,255,0.8); border-color: rgba(255,255,255,0.2); }
        
        .user-badge {
          display: flex; align-items: center; gap: 8px;
          padding: 5px 12px 5px 5px; border-radius: 100px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
        }
        .user-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #3B82F6, #8B5CF6);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #fff;
        }
        .user-name { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.8); max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .user-role { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: capitalize; }
        
        .hamburger { display: none; flex-direction: column; gap: 4px; cursor: pointer; padding: 8px; background: none; border: none; }
        .hamburger span { width: 22px; height: 2px; background: rgba(255,255,255,0.7); border-radius: 2px; transition: all 0.2s; display: block; }
        
        .mobile-menu {
          display: none; position: fixed; top: 64px; left: 0; right: 0;
          background: rgba(10,14,26,0.98); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 16px 24px; z-index: 99;
          flex-direction: column; gap: 4px;
        }
        .mobile-menu.open { display: flex; }
        .mobile-link { padding: 12px 14px; border-radius: 8px; color: rgba(255,255,255,0.7); text-decoration: none; font-size: 15px; font-weight: 500; }
        .mobile-link:hover { background: rgba(255,255,255,0.06); color: #fff; }
        
        @media (max-width: 768px) {
          .nav-links, .nav-actions { display: none; }
          .hamburger { display: flex; }
        }
      `}</style>

      <div className="navbar-root" style={navStyle}>
        <div className="navbar-inner">
          <a href="/" className="nav-logo">
            ⚡ SportsClub
          </a>

          <ul className="nav-links">
            {navLinks.map(link => (
              <li key={link.to}>
                <RouterLink
                  to={link.to}
                  className={`nav-link${isActive(link.to) ? ' active' : ''}`}
                >
                  {link.label}
                </RouterLink>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            {user ? (
              <>
                <div className="user-badge">
                  <div className="user-avatar">{user.fullName?.[0]?.toUpperCase()}</div>
                  <div>
                    <div className="user-name">{user.fullName?.split(' ')[0]}</div>
                    <div className="user-role">{user.role}</div>
                  </div>
                </div>
                <RouterLink to={getDashboardLink()} className="btn-nav-dashboard">
                  Dashboard →
                </RouterLink>
                <button className="btn-nav-logout" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <RouterLink to="/auth/login" className="btn-nav-login">Login</RouterLink>
                <RouterLink to="/auth/register" className="btn-nav-cta">Register →</RouterLink>
              </>
            )}
          </div>

          <button className="hamburger" onClick={() => setMobileOpen(o => !o)}>
            <span />
            <span />
            <span />
          </button>
        </div>

        <div className={`mobile-menu${mobileOpen ? ' open' : ''}`}>
          {navLinks.map(link => (
            <RouterLink key={link.to} to={link.to} className="mobile-link" onClick={() => setMobileOpen(false)}>
              {link.label}
            </RouterLink>
          ))}
          {user ? (
            <>
              <RouterLink to={getDashboardLink()} className="mobile-link" onClick={() => setMobileOpen(false)}>Dashboard</RouterLink>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', textAlign: 'left', padding: '12px 14px', color: 'rgba(255,255,255,0.5)', fontSize: 15, cursor: 'pointer' }}>Logout</button>
            </>
          ) : (
            <>
              <RouterLink to="/auth/login" className="mobile-link" onClick={() => setMobileOpen(false)}>Login</RouterLink>
              <RouterLink to="/auth/register" className="mobile-link" onClick={() => setMobileOpen(false)}>Register</RouterLink>
            </>
          )}
        </div>
      </div>
    </>
  );
}