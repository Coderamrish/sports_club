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

export const saveCoachProfileStep = createAsyncThunk(
  'coachProfile/saveStep',
  async ({ step, data }, { rejectWithValue }) => {
    try { return await profileService.updateCoachProfileStep(step, data); }
    catch (err) { return rejectWithValue(err.response?.data || { message: err.message }); }
  }
);

export const uploadCoachDoc = createAsyncThunk(
  'coachProfile/uploadDoc',
  async ({ docType, file, name }, { rejectWithValue }) => {
    try { return await profileService.uploadCoachDocument(docType, file, name); }
    catch (err) { return rejectWithValue(err.response?.data || { message: err.message }); }
  }
);

export const deleteCoachDoc = createAsyncThunk(
  'coachProfile/deleteDoc',
  async (docType, { rejectWithValue }) => {
    try { return await profileService.deleteCoachDocument(docType); }
    catch (err) { return rejectWithValue(err.response?.data || { message: err.message }); }
  }
);

const coachProfileSlice = createSlice({
  name: 'coachProfile',
  initialState: {
    coachProfile: null,
    currentStep:  1,
    isLoading:    false,
    isSaving:     false,
    isUploading:  false,
    error:        null,
  },
  reducers: {
    clearCoachError: (state) => { state.error = null; },
    setCurrentStep:  (state, action) => { state.currentStep = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoachProfile.pending,   (state) => { state.isLoading = true;  state.error = null; })
      .addCase(fetchCoachProfile.fulfilled, (state, action) => {
        state.isLoading    = false;
        state.coachProfile = action.payload?.data?.profile ?? null;
        state.currentStep  = action.payload?.data?.profile?.formStep ?? 1;
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

    builder
      .addCase(saveCoachProfileStep.pending,   (state) => { state.isSaving = true;  state.error = null; })
      .addCase(saveCoachProfileStep.fulfilled, (state, action) => {
        state.isSaving     = false;
        state.coachProfile = action.payload?.data?.profile ?? null;
        state.currentStep  = action.payload?.data?.nextStep ?? state.currentStep + 1;
      })
      .addCase(saveCoachProfileStep.rejected,  (state, action) => {
        state.isSaving = false;
        state.error    = action.payload?.message || 'Failed to save step';
      });

    builder
      .addCase(uploadCoachDoc.pending,   (state) => { state.isUploading = true;  state.error = null; })
      .addCase(uploadCoachDoc.fulfilled, (state) => { state.isUploading = false; })
      .addCase(uploadCoachDoc.rejected,  (state, action) => {
        state.isUploading = false;
        state.error       = action.payload?.message || 'Upload failed';
      });

    builder
      .addCase(deleteCoachDoc.pending,   (state) => { state.isUploading = true;  state.error = null; })
      .addCase(deleteCoachDoc.fulfilled, (state) => { state.isUploading = false; })
      .addCase(deleteCoachDoc.rejected,  (state, action) => {
        state.isUploading = false;
        state.error       = action.payload?.message || 'Delete failed';
      });
    //  Logout cleanup
    builder.addMatcher(
      (action) => action.type.startsWith('auth/logout') || action.type === 'auth/clearCredentials',
      (state) => {
        state.coachProfile = null;
        state.currentStep  = 1;
        state.isLoading    = false;
        state.error        = null;
      }
    );
  },
});

export const { clearCoachError, setCurrentStep } = coachProfileSlice.actions;

export const selectCoachProfile   = (s) => s.coachProfile.coachProfile;
export const selectCoachCurrentStep = (s) => s.coachProfile.currentStep;
export const selectCoachLoading   = (s) => s.coachProfile.isLoading;
export const selectCoachSaving    = (s) => s.coachProfile.isSaving;
export const selectCoachUploading = (s) => s.coachProfile.isUploading;
export const selectCoachError     = (s) => s.coachProfile.error;
export const selectCoachCompletion = (s) => {
  const profile = s.coachProfile.coachProfile;
  if (!profile) return 0;
  if (profile.profileFeeStatus === 'Paid') return 100;
  const step = profile.formStep ?? 1;
  return Math.min(Math.round(((step - 1) / 5) * 100), 80);
};

export default coachProfileSlice.reducer;