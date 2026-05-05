import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import api from '../../services/api';
import PublicNavbar from '../../components/common/PublicNavbar';

export default function HomePage() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    api.get('/public/competitions')
      .then(r => setCompetitions(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRegister = (comp) => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    if (user.role === 'athlete') {
      navigate('/athlete/competitions');
    } else {
      navigate('/auth/login');
    }
  };

  const stats = [
    { value: '2,400+', label: 'Athletes', icon: '🏃' },
    { value: '180+', label: 'Competitions', icon: '🏆' },
    { value: '340+', label: 'Coaches', icon: '🎯' },
    { value: '28', label: 'States', icon: '📍' },
  ];

  const features = [
    {
      icon: '⚡',
      title: 'Instant Registration',
      desc: 'Multi-step onboarding with real-time validation. Upload documents, get verified, compete.',
      color: '#FF6B35',
    },
    {
      icon: '🛡️',
      title: 'Verified Profiles',
      desc: 'Document verification with Aadhaar, certificates and NOC checks by certified admins.',
      color: '#00B4D8',
    },
    {
      icon: '📊',
      title: 'Live Dashboard',
      desc: 'Track competition history, documents, payments and results in one unified panel.',
      color: '#7209B7',
    },
    {
      icon: '🏅',
      title: 'Achievement Certs',
      desc: 'Auto-generated PDF certificates with QR verification for all winners and participants.',
      color: '#06D6A0',
    },
    {
      icon: '💳',
      title: 'Secure Payments',
      desc: 'UPI, Cards, Net Banking. Instant receipts. Real-time payment status tracking.',
      color: '#FFB703',
    },
    {
      icon: '📱',
      title: 'Mobile First',
      desc: 'Camera uploads, drag-drop docs, responsive across every device and screen size.',
      color: '#FB5607',
    },
  ];

  return (
    <div style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif", background: '#0A0E1A', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .nav-glass {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: rgba(10,14,26,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          transition: all 0.3s;
        }
        
        .hero-section {
          min-height: 100vh;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
          padding: 100px 20px 60px;
        }
        
        .hero-bg {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.15) 0%, transparent 70%),
                      radial-gradient(ellipse 60% 40% at 80% 80%, rgba(139,92,246,0.1) 0%, transparent 60%),
                      radial-gradient(ellipse 40% 30% at 10% 60%, rgba(6,214,160,0.08) 0%, transparent 50%);
        }
        
        .hero-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 70% 80% at 50% 50%, black 30%, transparent 80%);
        }
        
        .badge-pill {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.3);
          color: #60A5FA; padding: 8px 18px; border-radius: 100px;
          font-size: 13px; font-weight: 600; letter-spacing: 0.5px;
          margin-bottom: 28px;
          animation: fadeUp 0.6s ease forwards;
        }
        
        .hero-title {
          font-size: clamp(2.8rem, 7vw, 6rem);
          font-weight: 900; line-height: 1.05; text-align: center;
          color: #fff; letter-spacing: -2px;
          animation: fadeUp 0.7s ease 0.1s both;
        }
        
        .hero-title .accent {
          background: linear-gradient(135deg, #3B82F6, #8B5CF6, #06D6A0);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .hero-sub {
          font-size: clamp(1rem, 2vw, 1.2rem);
          color: rgba(255,255,255,0.55); max-width: 560px;
          text-align: center; line-height: 1.7; margin-top: 20px;
          font-weight: 400;
          animation: fadeUp 0.7s ease 0.2s both;
        }
        
        .hero-cta {
          display: flex; gap: 14px; margin-top: 40px; flex-wrap: wrap; justify-content: center;
          animation: fadeUp 0.7s ease 0.3s both;
        }
        
        .btn-primary {
          padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 700;
          background: linear-gradient(135deg, #3B82F6, #6366F1);
          color: #fff; border: none; cursor: pointer;
          transition: all 0.2s; letter-spacing: 0.3px;
          box-shadow: 0 0 30px rgba(99,102,241,0.4);
          font-family: inherit;
          text-decoration: none; display: inline-block;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 40px rgba(99,102,241,0.6); }
        
        .btn-outline {
          padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 600;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.8); cursor: pointer;
          transition: all 0.2s; font-family: inherit;
          text-decoration: none; display: inline-block;
        }
        .btn-outline:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.3); transform: translateY(-2px); }
        
        .stats-strip {
          display: flex; gap: 0; flex-wrap: wrap; justify-content: center;
          margin-top: 64px; width: 100%; max-width: 760px;
          animation: fadeUp 0.7s ease 0.4s both;
        }
        
        .stat-item {
          flex: 1; min-width: 160px; text-align: center;
          padding: 28px 20px;
          border-right: 1px solid rgba(255,255,255,0.07);
        }
        .stat-item:last-child { border-right: none; }
        
        .stat-num {
          font-size: 2.4rem; font-weight: 800; color: #fff;
          line-height: 1;
        }
        .stat-label { font-size: 13px; color: rgba(255,255,255,0.45); margin-top: 6px; font-weight: 500; }
        
        .section { padding: 100px 20px; max-width: 1200px; margin: 0 auto; }
        
        .section-label {
          font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
          color: #3B82F6; margin-bottom: 14px;
        }
        
        .section-title {
          font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; color: #fff; line-height: 1.15;
          letter-spacing: -1px;
        }
        .section-title .muted { color: rgba(255,255,255,0.3); }
        
        .features-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1px; background: rgba(255,255,255,0.06);
          border-radius: 20px; overflow: hidden; margin-top: 56px;
        }
        
        .feature-card {
          background: #0D1120; padding: 36px 32px;
          transition: background 0.2s;
        }
        .feature-card:hover { background: #111827; }
        
        .feature-icon {
          width: 52px; height: 52px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; margin-bottom: 20px;
        }
        
        .feature-title { font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 10px; }
        .feature-desc { font-size: 14px; color: rgba(255,255,255,0.45); line-height: 1.7; }
        
        .competitions-section { padding: 100px 20px; background: #080B14; }
        .competitions-inner { max-width: 1200px; margin: 0 auto; }
        
        .comp-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 20px; margin-top: 48px;
        }
        
        .comp-card {
          background: #0D1120; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px; overflow: hidden;
          transition: all 0.25s; cursor: pointer;
        }
        .comp-card:hover { transform: translateY(-4px); border-color: rgba(59,130,246,0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        
        .comp-card-header {
          height: 6px;
          background: linear-gradient(90deg, #3B82F6, #8B5CF6);
        }
        
        .comp-card-body { padding: 28px; }
        
        .comp-status {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(6,214,160,0.12); color: #06D6A0;
          border: 1px solid rgba(6,214,160,0.2); border-radius: 100px;
          padding: 4px 12px; font-size: 12px; font-weight: 600; margin-bottom: 16px;
        }
        .comp-status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #06D6A0; animation: pulse 2s infinite; }
        
        .comp-title { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 10px; line-height: 1.3; }
        .comp-desc { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.6; margin-bottom: 22px; }
        
        .comp-meta {
          display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 24px;
        }
        
        .comp-tag {
          display: flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.05); border-radius: 8px;
          padding: 6px 12px; font-size: 12px; color: rgba(255,255,255,0.6); font-weight: 500;
        }
        
        .btn-register {
          width: 100%; padding: 13px; border-radius: 10px;
          background: linear-gradient(135deg, #3B82F6, #6366F1);
          color: #fff; border: none; cursor: pointer; font-size: 14px; font-weight: 700;
          font-family: inherit; transition: all 0.2s; letter-spacing: 0.3px;
        }
        .btn-register:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(99,102,241,0.4); }
        
        .empty-state {
          text-align: center; padding: 80px 20px; color: rgba(255,255,255,0.3);
        }
        .empty-state .emoji { font-size: 48px; display: block; margin-bottom: 16px; }
        
        .footer-section {
          background: #080B14; border-top: 1px solid rgba(255,255,255,0.06);
          padding: 60px 20px; text-align: center;
          color: rgba(255,255,255,0.3); font-size: 14px;
        }
        
        .footer-logo {
          font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 16px;
          background: linear-gradient(135deg, #3B82F6, #8B5CF6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        
        .footer-links { display: flex; gap: 24px; justify-content: center; margin: 20px 0; flex-wrap: wrap; }
        .footer-link { color: rgba(255,255,255,0.4); text-decoration: none; font-size: 14px; transition: color 0.2s; }
        .footer-link:hover { color: rgba(255,255,255,0.8); }
        
        .scroll-indicator {
          position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          color: rgba(255,255,255,0.3); font-size: 12px; animation: bounce 2s infinite;
        }
        .scroll-arrow { width: 20px; height: 20px; border-right: 2px solid; border-bottom: 2px solid; border-color: rgba(255,255,255,0.2); transform: rotate(45deg); }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
        }
        @keyframes shimmer {
          from { background-position: -200% center; }
          to { background-position: 200% center; }
        }
        
        .floating-orb {
          position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none;
        }
        
        .loading-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; margin-top: 48px;
        }
        .skeleton {
          background: linear-gradient(90deg, #0D1120 25%, #151929 50%, #0D1120 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 18px; height: 280px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        
        @media (max-width: 768px) {
          .hero-title { letter-spacing: -1px; }
          .stat-item { min-width: 140px; }
          .features-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Navbar */}
      <div className="nav-glass">
        <PublicNavbar dark />
      </div>

      {/* Hero */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-bg" />
        <div className="hero-grid" />
        
        {/* Floating orbs */}
        <div className="floating-orb" style={{ width: 400, height: 400, background: 'rgba(59,130,246,0.06)', top: '10%', left: '-5%' }} />
        <div className="floating-orb" style={{ width: 300, height: 300, background: 'rgba(139,92,246,0.08)', bottom: '20%', right: '5%' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div className="badge-pill">
            <span>🏆</span> India's Premier Sports Management Platform
          </div>

          <h1 className="hero-title">
            Train. Compete.<br />
            <span className="accent">Achieve Greatness.</span>
          </h1>

          <p className="hero-sub">
            A unified platform where athletes register, coaches manage, and admins orchestrate competitions at state and national level.
          </p>

          <div className="hero-cta">
            {user ? (
              <a
                href={user.role === 'admin' ? '/admin/dashboard' : user.role === 'coach' ? '/coach/dashboard' : '/athlete/dashboard'}
                className="btn-primary"
              >
                Go to Dashboard →
              </a>
            ) : (
              <>
                <a href="/auth/register" className="btn-primary">Register as Athlete</a>
                <a href="/auth/register?role=coach" className="btn-outline">Join as Coach</a>
              </>
            )}
          </div>

          <div className="stats-strip" style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
            {stats.map((s, i) => (
              <div className="stat-item" key={i}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                <div className="stat-num">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="scroll-indicator">
          <span>Scroll</span>
          <div className="scroll-arrow" />
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '100px 20px', background: '#0A0E1A' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="section-label">Platform Features</div>
          <h2 className="section-title">
            Everything you need<br />
            <span className="muted">to manage sports at scale.</span>
          </h2>
          <div className="features-grid">
            {features.map((f, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-icon" style={{ background: f.color + '18' }}>
                  <span>{f.icon}</span>
                </div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '100px 20px', background: '#080B14' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <div className="section-label">How It Works</div>
          <h2 className="section-title" style={{ textAlign: 'center' }}>Three steps to compete</h2>
          <div style={{ display: 'flex', gap: 0, marginTop: 56, flexWrap: 'wrap', justifyContent: 'center', position: 'relative' }}>
            {[
              { step: '01', title: 'Register & Verify', desc: 'Create your profile, upload documents, get verified by the admin.', icon: '📋' },
              { step: '02', title: 'Join Competitions', desc: 'Browse events, register for your age group and skill level.', icon: '🎯' },
              { step: '03', title: 'Compete & Win', desc: 'Participate, get results published, download your certificate.', icon: '🏅' },
            ].map((step, i) => (
              <div key={i} style={{ flex: 1, minWidth: 240, padding: '40px 32px', position: 'relative', textAlign: 'center' }}>
                {i < 2 && (
                  <div style={{ position: 'absolute', top: '50px', right: '-20px', width: 40, color: 'rgba(255,255,255,0.1)', fontSize: 28, zIndex: 1 }}>→</div>
                )}
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px', }}>
                  {step.icon}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#3B82F6', marginBottom: 10 }}>STEP {step.step}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{step.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitions */}
      <section className="competitions-section" id="competitions">
        <div className="competitions-inner">
          <div className="section-label">Live Events</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <h2 className="section-title">
              Upcoming<br />
              <span className="muted">Competitions</span>
            </h2>
            <a href="/notices" className="btn-outline" style={{ padding: '10px 22px', fontSize: 13 }}>View All →</a>
          </div>

          {loading ? (
            <div className="loading-grid">
              {[1,2,3].map(i => <div key={i} className="skeleton" />)}
            </div>
          ) : competitions.length === 0 ? (
            <div className="empty-state">
              <span className="emoji">🏟️</span>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No competitions yet</div>
              <div>Check back soon — events are being added.</div>
            </div>
          ) : (
            <div className="comp-grid">
              {competitions.slice(0, 6).map((comp) => (
                <div className="comp-card" key={comp._id}>
                  <div className="comp-card-header" />
                  <div className="comp-card-body">
                    <div className="comp-status">OPEN</div>
                    <div className="comp-title">{comp.title}</div>
                    <div className="comp-desc">{comp.description?.slice(0, 100)}{comp.description?.length > 100 ? '...' : ''}</div>
                    <div className="comp-meta">
                      <div className="comp-tag">📅 {new Date(comp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div className="comp-tag">📍 {comp.venue}</div>
                      <div className="comp-tag">💰 ₹{comp.registrationFee}</div>
                      <div className="comp-tag">⏰ Deadline: {new Date(comp.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                    </div>
                    <button className="btn-register" onClick={() => handleRegister(comp)}>
                      {user && user.role === 'athlete' ? '→ Register Now' : '→ Login to Register'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: '80px 20px', background: '#0A0E1A' }}>
        <div style={{
          maxWidth: 900, margin: '0 auto', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))',
          border: '1px solid rgba(59,130,246,0.15)', borderRadius: 24, padding: '64px 40px',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(59,130,246,0.05), transparent)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: -0.5 }}>
              Ready to take the field?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
              Join thousands of athletes and coaches already on the platform. Your journey starts with one registration.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/auth/register" className="btn-primary">Get Started Free →</a>
              <a href="/about" className="btn-outline">Learn More</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-section">
        <div className="footer-logo">⚡ SportsClub</div>
        <p style={{ maxWidth: 400, margin: '0 auto 20px', lineHeight: 1.7 }}>India's comprehensive sports club management platform for athletes, coaches, and administrators.</p>
        <div className="footer-links">
          <a href="/" className="footer-link">Home</a>
          <a href="/about" className="footer-link">About</a>
          <a href="/notices" className="footer-link">Competitions</a>
          <a href="/contact" className="footer-link">Contact</a>
          <a href="/auth/login" className="footer-link">Login</a>
        </div>
        <p style={{ marginTop: 24, fontSize: 12 }}>© {new Date().getFullYear()} SportsClub Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}