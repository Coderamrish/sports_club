import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import profileReducer from './slices/profileSlice';
import coachProfileReducer from './slices/coachProfileSlice'; // ← ADD

const store = configureStore({
  reducer: {
    auth:         authReducer,
    ui:           uiReducer,
    profile:      profileReducer,
    coachProfile: coachProfileReducer, // ← ADD
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setUser'],
      },
    }),
});

export default store;