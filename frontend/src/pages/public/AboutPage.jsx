import React from 'react';
import PublicNavbar from '../../components/common/PublicNavbar';

export default function AboutPage() {
  const team = [
    { role: 'Athletes', count: '2,400+', desc: 'Verified competitors across 28 states', icon: '🏃', color: '#3B82F6' },
    { role: 'Coaches', count: '340+', desc: 'Certified trainers and mentors', icon: '🎯', color: '#8B5CF6' },
    { role: 'Competitions', count: '180+', desc: 'Events organized and managed', icon: '🏆', color: '#06D6A0' },
    { role: 'Certificates', count: '5,200+', desc: 'Participation certs distributed', icon: '🏅', color: '#FFB703' },
  ];

  const values = [
    { title: 'Transparency', desc: 'Real-time tracking of registrations, payments and document verification. No hidden processes.', icon: '🔍' },
    { title: 'Accessibility', desc: 'Mobile-first design ensures athletes from every corner can register and participate.', icon: '📱' },
    { title: 'Security', desc: 'Aadhaar verification, encrypted payments and role-based access control at every level.', icon: '🛡️' },
    { title: 'Excellence', desc: 'From registration to certificate, every step is designed for the best athlete experience.', icon: '⭐' },
  ];

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: '#0A0E1A', minHeight: '100vh', color: '#fff', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .nav-glass { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(10,14,26,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.06); }
      `}</style>

      <div className="nav-glass"><PublicNavbar /></div>

      {/* Hero */}
      <section style={{
        paddingTop: 140, paddingBottom: 80, paddingLeft: 20, paddingRight: 20,
        textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(59,130,246,0.1) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 100, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#60A5FA', marginBottom: 24 }}>
            🏟️ About SportsClub
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 900, letterSpacing: -2, lineHeight: 1.05, marginBottom: 20 }}>
            Built for the spirit of<br />
            <span style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6, #06D6A0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Indian Sports</span>
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
            SportsClub was built to eliminate the paperwork, confusion, and delays that hold back talented athletes from competing at their best.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '0 20px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {team.map((item, i) => (
            <div key={i} style={{
              background: '#0D1120', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18,
              padding: '32px 28px', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${item.color}, transparent)` }} />
              <div style={{ fontSize: 32, marginBottom: 12 }}>{item.icon}</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>{item.count}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: item.color, marginBottom: 6 }}>{item.role}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section style={{ padding: '80px 20px', background: '#080B14' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#3B82F6', marginBottom: 14 }}>Our Mission</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, letterSpacing: -1, lineHeight: 1.15, marginBottom: 20 }}>
              Leveling the playing field for every athlete
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, fontSize: 15, marginBottom: 16 }}>
              We believe every talented athlete deserves equal access to competitions, regardless of where they come from. Our platform digitizes the entire process from registration to certification.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, fontSize: 15 }}>
              Admins get powerful tools to manage athletes, coaches, competitions, and payments in one unified dashboard. Athletes get a streamlined onboarding journey. Coaches get visibility into their athletes' performance.
            </p>
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {['Multi-step athlete registration with document verification', 'Age-group & skill-level competition matching', 'Automated email & SMS notifications', 'PDF certificate generation with QR verification', 'UPI, Card & Net Banking payment support'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(6,214,160,0.15)', color: '#06D6A0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>✓</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#3B82F6', marginBottom: 12 }}>Our Values</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, letterSpacing: -1 }}>What drives us</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {values.map((v, i) => (
              <div key={i} style={{ padding: '32px 28px', background: '#0D1120', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{v.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{v.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '60px 20px 80px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 24, padding: '60px 40px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏆</div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, marginBottom: 14, letterSpacing: -0.5 }}>Join the movement</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 28, lineHeight: 1.7 }}>Whether you're an athlete ready to compete or a coach ready to guide — start today.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/auth/register" style={{ padding: '13px 28px', borderRadius: 10, background: 'linear-gradient(135deg, #3B82F6, #6366F1)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14, fontFamily: 'Outfit, sans-serif' }}>Register Now →</a>
            <a href="/contact" style={{ padding: '13px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontWeight: 600, fontSize: 14, fontFamily: 'Outfit, sans-serif' }}>Get In Touch</a>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
        <div style={{ marginBottom: 8, fontWeight: 800, fontSize: 18, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>⚡ SportsClub</div>
        © {new Date().getFullYear()} SportsClub Management System
      </footer>
    </div>
  );
}