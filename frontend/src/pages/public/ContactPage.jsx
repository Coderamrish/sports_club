import React, { useState } from 'react';
import PublicNavbar from '../../components/common/PublicNavbar';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1200);
  };

  const contacts = [
    { icon: '📧', label: 'Email Us', value: 'tiwariamrish277@gmail.com', sub: 'We reply within 24 hours' },
    { icon: '📞', label: 'Call Us', value: '+91 6206678489', sub: 'Mon–Fri, 9AM–6PM IST' },
    { icon: '📍', label: 'Address', value: 'kolkata, India', sub: 'National Sports Complex' },
  ];

  const faqs = [
    { q: 'How long does document verification take?', a: 'Typically 1–3 business days. You will receive an email once your documents are reviewed.' },
    { q: 'Can I register for multiple competitions?', a: 'Yes, once your profile is approved, you can register for multiple competitions matching your age group and skill level.' },
    { q: 'What documents are required?', a: 'Passport photo, Aadhaar card, birth certificate, school bonafide certificate, and NOC from your club and state association.' },
    { q: 'How are competition fees paid?', a: 'We support UPI, credit/debit cards, and net banking through our secure payment gateway.' },
  ];

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: '#0A0E1A', minHeight: '100vh', color: '#fff', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .nav-glass { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(10,14,26,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .input-field {
          width: 100%; padding: 13px 16px; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
          color: #fff; font-size: 14px; font-family: 'Outfit', sans-serif;
          outline: none; transition: border-color 0.2s;
        }
        .input-field:focus { border-color: #3B82F6; background: rgba(59,130,246,0.05); }
        .input-field::placeholder { color: rgba(255,255,255,0.25); }
        .label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.6); margin-bottom: 8px; display: block; }
        .faq-item { border-bottom: 1px solid rgba(255,255,255,0.06); padding: 20px 0; }
        .faq-q { font-size: 15px; font-weight: 600; color: #fff; margin-bottom: 10px; }
        .faq-a { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.7; }
      `}</style>

      <div className="nav-glass"><PublicNavbar /></div>

      {/* Hero */}
      <section style={{ paddingTop: 140, paddingBottom: 60, paddingLeft: 20, paddingRight: 20, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(59,130,246,0.1) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', gap: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 100, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#60A5FA', marginBottom: 24 }}>
            💬 Get In Touch
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 900, letterSpacing: -2, lineHeight: 1.05, marginBottom: 18 }}>
            We're here to help
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', maxWidth: 460, margin: '0 auto', lineHeight: 1.7 }}>
            Got questions about registration, competitions, or your account? Our team is ready.
          </p>
        </div>
      </section>

      {/* Contact cards */}
      <section style={{ padding: '0 20px 60px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {contacts.map((c, i) => (
            <div key={i} style={{ background: '#0D1120', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{c.icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{c.value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{c.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Form + FAQ */}
      <section style={{ padding: '0 20px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 40 }}>
          {/* Form */}
          <div style={{ background: '#0D1120', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '36px 32px' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, letterSpacing: -0.5 }}>Send a message</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28, lineHeight: 1.6 }}>Fill in the form and we'll get back to you within 24 hours.</p>

            {sent ? (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Message sent!</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>We'll get back to you within 24 hours.</div>
                <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }} style={{ marginTop: 24, padding: '10px 24px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, background: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 14, fontFamily: 'Outfit, sans-serif' }}>
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label className="label">Full Name</label>
                  <input className="input-field" placeholder="Arjun Sharma" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input className="input-field" type="email" placeholder="arjun@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Subject</label>
                  <select className="input-field" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required style={{ background: '#0D1120', cursor: 'pointer' }}>
                    <option value="">Select a subject...</option>
                    <option>Registration Help</option>
                    <option>Document Verification</option>
                    <option>Payment Issue</option>
                    <option>Competition Query</option>
                    <option>Account Problem</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Message</label>
                  <textarea className="input-field" rows={5} placeholder="Describe your query in detail..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required style={{ resize: 'vertical', minHeight: 120 }} />
                </div>
                <button type="submit" disabled={sending} style={{
                  padding: '14px', borderRadius: 10, background: sending ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #3B82F6, #6366F1)',
                  color: '#fff', border: 'none', cursor: sending ? 'not-allowed' : 'pointer',
                  fontSize: 14, fontWeight: 700, fontFamily: 'Outfit, sans-serif',
                  transition: 'all 0.2s', boxShadow: sending ? 'none' : '0 0 20px rgba(99,102,241,0.3)'
                }}>
                  {sending ? 'Sending...' : 'Send Message →'}
                </button>
              </form>
            )}
          </div>

          {/* FAQ */}
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, letterSpacing: -0.5 }}>Frequently Asked</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28, lineHeight: 1.6 }}>Quick answers to the most common questions.</p>
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item">
                <div className="faq-q">{faq.q}</div>
                <div className="faq-a">{faq.a}</div>
              </div>
            ))}

            <div style={{ marginTop: 36, padding: '24px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Still need help? 🤝</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                Our support team is available Monday to Friday from 9AM to 6PM IST. For urgent matters, call us directly.
              </div>
            </div>
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