import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import profileService from '../../services/profile.service';

// Thunks

export const fetchAthleteProfile = createAsyncThunk(
  'profile/fetchAthlete',
  async (_, { rejectWithValue }) => {
    try { return await profileService.getAthleteProfile(); }
    catch (err) { return rejectWithValue(err.response?.data || { message: err.message }); }
  }
);

export const saveProfileStep = createAsyncThunk(
  'profile/saveStep',
  async ({ step, data }, { rejectWithValue }) => {
    try { return await profileService.updateAthleteProfileStep(step, data); }
    catch (err) { return rejectWithValue(err.response?.data || { message: err.message }); }
  }
);

export const uploadAthleteDoc = createAsyncThunk(
  'profile/uploadDoc',
  async ({ docType, file, name }, { rejectWithValue }) => {
    try { return await profileService.uploadAthleteDocument(docType, file, name); }
    catch (err) { return rejectWithValue(err.response?.data || { message: err.message }); }
  }
);

export const deleteAthleteDoc = createAsyncThunk(
  'profile/deleteDoc',
  async (docType, { rejectWithValue }) => {
    try { return await profileService.deleteAthleteDocument(docType); }
    catch (err) { return rejectWithValue(err.response?.data || { message: err.message }); }
  }
);

//  Slice

const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    athleteProfile:  null,
    currentStep:     1,
    isLoading:       false,
    isSaving:        false,
    isUploading:     false,
    error:           null,
    uploadError:     null,
    lastSavedStep:   null,
  },
  reducers: {
    setCurrentStep:    (state, action) => { state.currentStep = action.payload; },
    clearProfileError: (state)         => { state.error = null; state.uploadError = null; },
    updateLocalProfile:(state, action) => {
      if (state.athleteProfile) {
        state.athleteProfile = { ...state.athleteProfile, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {

    // Fetch profile
    builder
      .addCase(fetchAthleteProfile.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchAthleteProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        // Guard: payload may be missing data or profile
        const profile = action.payload?.data?.profile ?? null;
        state.athleteProfile = profile;
        state.currentStep    = profile?.formStep ?? 1;
      })
      .addCase(fetchAthleteProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload?.message || 'Failed to load profile';
        // Don't crash — leave athleteProfile as null, component handles it
      });

    // Save step
    builder
      .addCase(saveProfileStep.pending, (state) => {
        state.isSaving = true;
        state.error    = null;
      })
      .addCase(saveProfileStep.fulfilled, (state, action) => {
        state.isSaving       = false;
        const profile  = action.payload?.data?.profile ?? null;
        const nextStep = action.payload?.data?.nextStep ?? state.currentStep + 1;
        state.athleteProfile = profile;
        state.currentStep    = nextStep;
        state.lastSavedStep  = (profile?.formStep ?? 1) - 1;
      })
      .addCase(saveProfileStep.rejected, (state, action) => {
        state.isSaving = false;
        state.error    = action.payload?.message || 'Failed to save step';
      });

    //  Upload doc
    builder
      .addCase(uploadAthleteDoc.pending,   (state) => { state.isUploading = true;  state.uploadError = null; })
      .addCase(uploadAthleteDoc.fulfilled, (state) => { state.isUploading = false; })
      .addCase(uploadAthleteDoc.rejected,  (state, action) => {
        state.isUploading = false;
        state.uploadError = action.payload?.message || 'Upload failed';
      });

    //Delete doc
    builder
      .addCase(deleteAthleteDoc.pending,   (state) => { state.isUploading = true;  state.uploadError = null; })
      .addCase(deleteAthleteDoc.fulfilled, (state) => { state.isUploading = false; })
      .addCase(deleteAthleteDoc.rejected,  (state, action) => {
        state.isUploading = false;
        state.uploadError = action.payload?.message || 'Delete failed';
      });
    // Logout cleanup 
    builder.addMatcher(
      (action) => action.type.startsWith('auth/logout') || action.type === 'auth/clearCredentials',
      (state) => {
        state.athleteProfile = null;
        state.currentStep    = 1;
        state.isLoading      = false;
        state.error          = null;
      }
    );
  },
});

export const { setCurrentStep, clearProfileError, updateLocalProfile } = profileSlice.actions;

// Selectors
export const selectAthleteProfile     = (s) => s.profile.athleteProfile;
export const selectProfileCurrentStep = (s) => s.profile.currentStep;
export const selectProfileLoading     = (s) => s.profile.isLoading;
export const selectProfileSaving      = (s) => s.profile.isSaving;
export const selectProfileUploading   = (s) => s.profile.isUploading;
export const selectProfileError       = (s) => s.profile.error;
export const selectUploadError        = (s) => s.profile.uploadError;

export const selectProfileCompletion = (s) => {
  const profile = s.profile.athleteProfile;
  if (!profile) return 0;
  // 9 total milestones: steps 1-8 + profile fee paid
  const step = profile.formStep ?? 1;
  
  if (profile.profileFeeStatus === 'Paid') return 100;
  return Math.min(Math.round(((step - 1) / 8) * 100), 88);
};

export default profileSlice.reducer;