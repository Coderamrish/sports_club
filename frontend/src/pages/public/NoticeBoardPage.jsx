import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import PublicNavbar from '../../components/common/PublicNavbar';
import api from '../../services/api';

export default function NoticeBoardPage() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  useEffect(() => {
    api.get('/public/competitions')
      .then(r => setCompetitions(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRegister = (comp) => {
    if (!user) { navigate('/auth/login'); return; }
    if (user.role === 'athlete') { navigate('/athlete/competitions'); return; }
    navigate('/auth/login');
  };

  const getDaysLeft = (deadline) => {
    const diff = new Date(deadline) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const urgencyColor = (days) => {
    if (days <= 3) return '#EF4444';
    if (days <= 7) return '#F59E0B';
    return '#06D6A0';
  };

  const cardColors = ['#3B82F6', '#8B5CF6', '#06D6A0', '#F59E0B', '#EF4444', '#EC4899'];

  const filteredComps = filter === 'all' ? competitions : competitions.filter(c => c.status === filter);

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: '#0A0E1A', minHeight: '100vh', color: '#fff', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .nav-glass { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(10,14,26,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.06); }
        @keyframes shimmer { from { background-position: -200% center; } to { background-position: 200% center; } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .comp-card { background: #0D1120; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; overflow: hidden; transition: all 0.25s; }
        .comp-card:hover { transform: translateY(-4px); box-shadow: 0 24px 48px rgba(0,0,0,0.5); }
        .filter-btn { padding: 8px 18px; border-radius: 100px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.5); font-family: 'Outfit', sans-serif; }
        .filter-btn.active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        .filter-btn:not(.active):hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); }
        .skeleton { background: linear-gradient(90deg, #0D1120 25%, #151929 50%, #0D1120 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 20px; height: 360px; border: 1px solid rgba(255,255,255,0.06); }
        .register-btn { width: 100%; padding: 13px; border-radius: 10px; background: linear-gradient(135deg, #3B82F6, #6366F1); color: #fff; border: none; cursor: pointer; font-size: 14px; font-weight: 700; font-family: 'Outfit', sans-serif; transition: all 0.2s; letter-spacing: 0.3px; }
        .register-btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(99,102,241,0.4); }
      `}</style>

      <div className="nav-glass"><PublicNavbar /></div>

      {/* Header */}
      <section style={{ paddingTop: 130, paddingBottom: 50, paddingLeft: 20, paddingRight: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', gap: 8, background: 'rgba(6,214,160,0.1)', border: '1px solid rgba(6,214,160,0.2)', borderRadius: 100, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#06D6A0', marginBottom: 24 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06D6A0', display: 'inline-block', alignSelf: 'center', animation: 'pulse 2s infinite' }} />
            Live Competitions
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.4rem)', fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.05, marginBottom: 12 }}>
                Notice Board &<br />
                <span style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Competitions</span>
              </h1>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                {loading ? 'Loading...' : `${competitions.length} event${competitions.length !== 1 ? 's' : ''} available • Register before the deadline`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['all', 'upcoming', 'ongoing'].map(f => (
                <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'All Events' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Competitions grid */}
      <section style={{ padding: '0 20px 80px', maxWidth: 1200, margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" />)}
          </div>
        ) : filteredComps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🏟️</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.5)' }}>No events found</div>
            <div>Try changing the filter or check back later.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {filteredComps.map((comp, idx) => {
              const daysLeft = getDaysLeft(comp.deadline);
              const accentColor = cardColors[idx % cardColors.length];
              return (
                <div key={comp._id} className="comp-card">
                  {/* Color bar */}
                  <div style={{ height: 4, background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
                  
                  <div style={{ padding: '24px' }}>
                    {/* Status + urgency */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(6,214,160,0.1)', border: '1px solid rgba(6,214,160,0.2)', borderRadius: 100, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#06D6A0' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#06D6A0', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                        OPEN
                      </div>
                      {daysLeft > 0 && (
                        <div style={{ fontSize: 12, fontWeight: 700, color: urgencyColor(daysLeft) }}>
                          {daysLeft <= 1 ? 'Last day!' : `${daysLeft} days left`}
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, lineHeight: 1.3, letterSpacing: -0.3 }}>{comp.title}</h3>
                    
                    {/* Description */}
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 20, minHeight: 56 }}>
                      {comp.description?.slice(0, 110)}{comp.description?.length > 110 ? '...' : ''}
                    </p>

                    {/* Meta tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                      {[
                        { icon: '📅', text: new Date(comp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                        { icon: '📍', text: comp.venue },
                        { icon: '💰', text: `₹${comp.registrationFee}` },
                        ...(comp.ageGroups?.length ? [{ icon: '👤', text: comp.ageGroups.join(', ') }] : []),
                      ].map((tag, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '5px 10px', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                          {tag.icon} {tag.text}
                        </div>
                      ))}
                    </div>

                    {/* Deadline bar */}
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Registration deadline</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: urgencyColor(daysLeft) }}>
                        {new Date(comp.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>

                    <button className="register-btn" onClick={() => handleRegister(comp)}
                      style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}>
                      {user && user.role === 'athlete' ? '→ Register for this Event' : '→ Login to Register'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Banner */}
      {!user && (
        <section style={{ padding: '0 20px 80px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 20, padding: '48px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', fontWeight: 800, marginBottom: 8, letterSpacing: -0.5 }}>Ready to compete? 🚀</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6 }}>Create your athlete account, complete your profile, and register for competitions.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <a href="/auth/register" style={{ padding: '13px 28px', borderRadius: 10, background: 'linear-gradient(135deg, #3B82F6, #6366F1)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14, boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
                Register Now →
              </a>
              <a href="/auth/login" style={{ padding: '13px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                Login
              </a>
            </div>
          </div>
        </section>
      )}

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
        <div style={{ marginBottom: 8, fontWeight: 800, fontSize: 18, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>⚡ SportsClub</div>
        © {new Date().getFullYear()} SportsClub Management System
      </footer>
    </div>
  );
}