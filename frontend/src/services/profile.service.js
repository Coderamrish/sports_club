import api from './api';

const profileService = {
  // ── Athlete ────────────────────────────────────────────────────────────────
  getAthleteProfile: async () => {
    const res = await api.get('/athletes/profile');
    return res.data;
  },

  updateAthleteProfileStep: async (step, data) => {
    const res = await api.patch(`/athletes/profile/step/${step}`, data);
    return res.data;
  },

  uploadAthleteDocument: async (docType, file, name) => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);

    const res = await api.post(`/athletes/profile/documents/${docType}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteAthleteDocument: async (docType) => {
    const res = await api.delete(`/athletes/profile/documents/${docType}`);
    return res.data;
  },

  // ── Coach ──────────────────────────────────────────────────────────────────
  getCoachProfile: async () => {
    const res = await api.get('/coaches/profile');
    return res.data;
  },

  updateCoachProfile: async (data) => {
    const res = await api.patch('/coaches/profile', data);
    return res.data;
  },

  updateCoachProfileStep: async (step, data) => {
    const res = await api.patch(`/coaches/profile/step/${step}`, data);
    return res.data;
  },

  uploadCoachDocument: async (docType, file, name) => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    const res = await api.post(`/coaches/profile/documents/${docType}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteCoachDocument: async (docType) => {
    const res = await api.delete(`/coaches/profile/documents/${docType}`);
    return res.data;
  },
};

export default profileService;