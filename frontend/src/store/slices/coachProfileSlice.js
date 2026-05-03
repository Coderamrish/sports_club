import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import profileService from '../../services/profile.service';

export const fetchCoachProfile = createAsyncThunk(
  'coachProfile/fetch',
  async (_, { rejectWithValue }) => {
    try { return await profileService.getCoachProfile(); }
    catch (err) { return rejectWithValue(err.response?.data || { message: err.message }); }
  }
);

export const saveCoachProfile = createAsyncThunk(
  'coachProfile/save',
  async (data, { rejectWithValue }) => {
    try { return await profileService.updateCoachProfile(data); }
    catch (err) { return rejectWithValue(err.response?.data || { message: err.message }); }
  }
);

const coachProfileSlice = createSlice({
  name: 'coachProfile',
  initialState: {
    coachProfile: null,
    isLoading:    false,
    isSaving:     false,
    error:        null,
  },
  reducers: {
    clearCoachError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoachProfile.pending,   (state) => { state.isLoading = true;  state.error = null; })
      .addCase(fetchCoachProfile.fulfilled, (state, action) => {
        state.isLoading    = false;
        state.coachProfile = action.payload?.data?.profile ?? null;
      })
      .addCase(fetchCoachProfile.rejected,  (state, action) => {
        state.isLoading = false;
        state.error     = action.payload?.message || 'Failed to load profile';
      });

    builder
      .addCase(saveCoachProfile.pending,   (state) => { state.isSaving = true;  state.error = null; })
      .addCase(saveCoachProfile.fulfilled, (state, action) => {
        state.isSaving     = false;
        state.coachProfile = action.payload?.data?.profile ?? null;
      })
      .addCase(saveCoachProfile.rejected,  (state, action) => {
        state.isSaving = false;
        state.error    = action.payload?.message || 'Failed to save';
      });
  },
});

export const { clearCoachError } = coachProfileSlice.actions;

export const selectCoachProfile   = (s) => s.coachProfile.coachProfile;
export const selectCoachLoading   = (s) => s.coachProfile.isLoading;
export const selectCoachSaving    = (s) => s.coachProfile.isSaving;
export const selectCoachError     = (s) => s.coachProfile.error;
export const selectCoachCompletion = (s) => {
  const p = s.coachProfile.coachProfile;
  if (!p) return 0;
  const fields = [p.gender, p.specialization?.length, p.experienceYears, p.clubName, p.bio];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
};

export default coachProfileSlice.reducer;