import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function ManageResults({ competitionId }) {
  const [registrations, setRegistrations] = useState([]);
  const [results, setResults] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    // Fetch all registrations for this competition
    axios.get(`/api/competitions/${competitionId}/registrations`, { withCredentials: true })
      .then(res => {
        setRegistrations(res.data);
        const initial = {};
        res.data.forEach(r => { initial[r.userId._id] = { medal: 'Participant', attendance: 'Present', userType: r.userType || 'athlete' }; });
        setResults(initial);
      });
  }, [competitionId]);

  const handleChange = (userId, field, value) => {
    setResults(prev => ({ ...prev, [userId]: { ...prev[userId], [field]: value } }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMsg('');
    const payload = registrations.map(r => ({
      userId: r.userId._id,
      userType: results[r.userId._id]?.userType,
      medal: results[r.userId._id]?.medal,
      attendanceStatus: results[r.userId._id]?.attendance,
    }));
    try {
      await axios.post('/api/certificates/admin/results', { competitionId, results: payload }, { withCredentials: true });
      setMsg('✅ Certificates generated and emails sent!');
    } catch (e) {
      setMsg('❌ Error: ' + e.response?.data?.message);
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h2>Manage Results & Issue Certificates</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#1a3c5e', color: '#fff' }}>
            <th style={{ padding: 10, textAlign: 'left' }}>Name</th>
            <th>Type</th>
            <th>Attendance</th>
            <th>Medal</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map(r => (
            <tr key={r.userId._id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 10 }}>{r.userId.name}<br /><small>{r.userId.email}</small></td>
              <td>
                <select value={results[r.userId._id]?.userType} onChange={e => handleChange(r.userId._id, 'userType', e.target.value)}>
                  <option value="athlete">Athlete</option>
                  <option value="coach">Coach</option>
                </select>
              </td>
              <td>
                <select value={results[r.userId._id]?.attendance} onChange={e => handleChange(r.userId._id, 'attendance', e.target.value)}>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                </select>
              </td>
              <td>
                <select value={results[r.userId._id]?.medal} onChange={e => handleChange(r.userId._id, 'medal', e.target.value)}>
                  <option value="Gold">🥇 Gold</option>
                  <option value="Silver">🥈 Silver</option>
                  <option value="Bronze">🥉 Bronze</option>
                  <option value="Participant">Participant</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleSubmit} disabled={saving} style={{
        marginTop: 20, padding: '12px 32px', background: '#c8a951', color: '#1a3c5e',
        border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: 'pointer'
      }}>
        {saving ? 'Generating...' : '🏅 Generate Certificates & Email All'}
      </button>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}