import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField,
  CircularProgress, Alert, LinearProgress, Avatar, Chip,
  MenuItem, Select, FormControl, InputLabel, FormHelperText,
  Grid, Stepper, Step, StepLabel, StepConnector, stepConnectorClasses,
  InputAdornment, IconButton, Paper, Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Person, FamilyRestroom, Home, EmojiEvents, Description,
  Gavel, Payment, CheckCircle, ArrowBack, ArrowForward,
  CloudUpload, Delete, Visibility, DirectionsRun,
  Logout, Warning,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  fetchAthleteProfile, saveProfileStep, uploadAthleteDoc, deleteAthleteDoc,
  selectAthleteProfile, selectProfileCurrentStep, selectProfileLoading,
  selectProfileSaving, selectProfileUploading, selectProfileError,
  selectUploadError, setCurrentStep, clearProfileError, selectProfileCompletion,
} from '../../store/slices/profileSlice';
import { logoutUser, selectCurrentUser } from '../../store/slices/authSlice';
import { compressImage, formatFileSize, validateFile } from '../../utils/fileCompression';

// ─── Step Definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Personal',    icon: <Person />,          short: 'Personal Details' },
  { label: 'Family',      icon: <FamilyRestroom />,   short: 'Parent / Guardian' },
  { label: 'Address',     icon: <Home />,             short: 'Address Details' },
  { label: 'Club',        icon: <EmojiEvents />,      short: 'Club & Representation' },
  { label: 'Competition', icon: <DirectionsRun />,    short: 'Competition Details' },
  { label: 'Documents',   icon: <Description />,      short: 'Document Upload' },
  { label: 'Declaration', icon: <Gavel />,            short: 'Declaration & Consent' },
  { label: 'Payment',     icon: <Payment />,          short: 'Payment' },
];

// ─── Custom Stepper Connector ─────────────────────────────────────────────────
const ColorConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 22 },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
    backgroundImage: 'linear-gradient(135deg,#1565C0,#1E88E5)',
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    backgroundImage: 'linear-gradient(135deg,#2E7D32,#43A047)',
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3, border: 0, backgroundColor: '#E0E7EF', borderRadius: 1,
  },
}));

const ColorStepIcon = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: ownerState.completed ? '#2E7D32' : ownerState.active ? '#1565C0' : '#E0E7EF',
  color: ownerState.completed || ownerState.active ? '#fff' : '#90A4AE',
  zIndex: 1, width: 44, height: 44, display: 'flex', borderRadius: '50%',
  justifyContent: 'center', alignItems: 'center',
  boxShadow: ownerState.active ? '0 4px 12px rgba(21,101,192,0.4)' : 'none',
  transition: 'all 0.3s',
}));

function StepIconComponent(props) {
  const { active, completed, icon } = props;
  const icons = STEPS.map(s => s.icon);
  return (
    <ColorStepIcon ownerState={{ active, completed }}>
      {completed ? <CheckCircle fontSize="small" /> : React.cloneElement(icons[icon - 1], { fontSize: 'small' })}
    </ColorStepIcon>
  );
}

// ─── Yup Schemas per step ─────────────────────────────────────────────────────
const schemas = {
  1: yup.object({
    dateOfBirth: yup.date().required('Date of birth is required').max(new Date(), 'Cannot be future date'),
    gender: yup.string().oneOf(['Male', 'Female', 'Other']).required('Gender is required'),
    bloodGroup: yup.string().oneOf(['A+','A-','B+','B-','AB+','AB-','O+','O-']).required('Blood group is required'),
  }),
  2: yup.object({
    fatherName: yup.string().min(2, 'Min 2 chars').required('Father name is required'),
    motherName: yup.string().min(2, 'Min 2 chars').required('Mother name is required'),
    parentMobile: yup.string().matches(/^[6-9]\d{9}$/, 'Valid 10-digit number required').required(),
    parentEmail: yup.string().email('Invalid email').optional().nullable(),
    guardianName: yup.string().optional().nullable(),
  }),
  3: yup.object({
    street: yup.string().required('Street address is required'),
    city: yup.string().required('City is required'),
    district: yup.string().required('District is required'),
    state: yup.string().required('State is required'),
    pinCode: yup.string().matches(/^\d{6}$/, '6-digit PIN code required').required(),
    landmark: yup.string().optional().nullable(),
  }),
  4: yup.object({
    clubName: yup.string().required('Club name is required'),
    stateRepresentation: yup.string().required('State representation is required'),
    districtRepresentation: yup.string().required('District is required'),
  }),
  5: yup.object({
    ageGroup: yup.string().oneOf(['U-10','U-12','U-14','U-16','U-18','U-21','Senior','Masters']).required('Age group is required'),
    skillLevel: yup.string().oneOf(['Beginner','Intermediate','Advanced']).required('Skill level is required'),
  }),
};

// ─── Reusable DocDropzone ─────────────────────────────────────────────────────
function DocDropzone({ label, docType, currentDoc, onUpload, onDelete, isUploading, accept = 'any' }) {
  const [localLoading, setLocalLoading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];
    const validation = validateFile(file, accept);
    if (!validation.valid) { toast.error(validation.error); return; }

    setLocalLoading(true);
    try {
      let finalFile = file;
      if (accept === 'image' || file.type.startsWith('image/')) {
        const { file: compressed, wasCompressed, savings } = await compressImage(file);
        finalFile = compressed;
        if (wasCompressed) toast.success(`Image compressed — saved ${savings}%`);
      }
      await onUpload(docType, finalFile);
      toast.success(`${label} uploaded!`);
    } catch { toast.error('Upload failed'); }
    finally { setLocalLoading(false); }
  }, [docType, label, onUpload, accept]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: false,
    accept: accept === 'image'
      ? { 'image/jpeg': [], 'image/png': [] }
      : accept === 'pdf'
      ? { 'application/pdf': [] }
      : { 'image/jpeg': [], 'image/png': [], 'application/pdf': [] },
  });

  const busy = localLoading || isUploading;

  return (
    <Box>
      <Typography variant="body2" fontWeight={600} mb={1} color="text.secondary">
        {label}
      </Typography>
      {currentDoc?.url ? (
        <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, borderRadius: 2, borderColor: 'success.300', bgcolor: 'success.50' }}>
          <CheckCircle color="success" fontSize="small" />
          <Box flex={1}>
            <Typography variant="body2" fontWeight={600} color="success.dark">Uploaded</Typography>
            <Typography variant="caption" color="text.secondary">
              {currentDoc.status || 'Pending review'} · {currentDoc.uploadedAt ? new Date(currentDoc.uploadedAt).toLocaleDateString('en-IN') : ''}
            </Typography>
          </Box>
          <IconButton size="small" color="error" onClick={() => onDelete(docType)} title="Remove">
            <Delete fontSize="small" />
          </IconButton>
        </Paper>
      ) : (
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'divider',
            borderRadius: 2,
            p: 2,
            textAlign: 'center',
            cursor: busy ? 'not-allowed' : 'pointer',
            bgcolor: isDragActive ? 'primary.50' : 'background.default',
            transition: 'all 0.2s',
            '&:hover': { borderColor: 'primary.light', bgcolor: 'primary.50' },
          }}
        >
          <input {...getInputProps()} />
          {busy ? (
            <CircularProgress size={24} />
          ) : (
            <>
              <CloudUpload sx={{ color: 'text.disabled', mb: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                {isDragActive ? 'Drop here' : 'Drag & drop or click to upload'}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {accept === 'image' ? 'JPG/PNG, max 1MB' : accept === 'pdf' ? 'PDF, max 2MB' : 'JPG/PNG/PDF, max 2MB'}
              </Typography>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AthleteProfileSetup() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const user       = useSelector(selectCurrentUser);
  const profile    = useSelector(selectAthleteProfile);
  const currentStep = useSelector(selectProfileCurrentStep);
  const isLoading  = useSelector(selectProfileLoading);
  const isSaving   = useSelector(selectProfileSaving);
  const isUploading = useSelector(selectProfileUploading);
  const error      = useSelector(selectProfileError);
  const completion = useSelector(selectProfileCompletion);

  // Keep a local display step so user can navigate back
  const [displayStep, setDisplayStep] = useState(1);

  useEffect(() => {
    dispatch(fetchAthleteProfile());
  }, [dispatch]);

  useEffect(() => {
    if (currentStep) setDisplayStep(Math.min(currentStep, 8));
  }, [currentStep]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/auth/login');
  };

  const handleUpload = useCallback(async (docType, file, name) => {
    await dispatch(uploadAthleteDoc({ docType, file, name })).unwrap();
    dispatch(fetchAthleteProfile());
  }, [dispatch]);

  const handleDelete = useCallback(async (docType) => {
    await dispatch(deleteAthleteDoc(docType)).unwrap();
    dispatch(fetchAthleteProfile());
    toast.success('Document removed.');
  }, [dispatch]);

  const handleStepSave = async (data) => {
    try {
      await dispatch(saveProfileStep({ step: displayStep, data })).unwrap();
      toast.success(`Step ${displayStep} saved!`);
    } catch {
      toast.error(error || 'Save failed');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F5F7FA' }}>
      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg,#1565C0,#1E88E5)', color: 'white', px: 3, py: 2 }}>
        <Box sx={{ maxWidth: 900, mx: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 42, height: 42 }}>
              {user?.fullName?.[0]}
            </Avatar>
            <Box>
              <Typography fontWeight={700}>{user?.fullName}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Profile Setup · {completion}% complete
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 140 }}>
              <LinearProgress
                variant="determinate" value={completion}
                sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': { bgcolor: 'white' } }}
              />
            </Box>
            <Button variant="outlined" size="small" startIcon={<Logout />} onClick={handleLogout}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>
              Logout
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
        {/* Stepper */}
        <Card sx={{ mb: 3, overflow: 'visible' }}>
          <CardContent sx={{ pb: '16px !important' }}>
            <Stepper
              activeStep={displayStep - 1}
              alternativeLabel
              connector={<ColorConnector />}
            >
              {STEPS.map((s, i) => (
                <Step
                  key={s.label}
                  completed={profile?.formStep > i + 1}
                  sx={{ cursor: profile?.formStep > i ? 'pointer' : 'default' }}
                  onClick={() => { if (profile?.formStep >= i + 1) setDisplayStep(i + 1); }}
                >
                  <StepLabel StepIconComponent={StepIconComponent}>
                    <Typography variant="caption" fontWeight={displayStep === i + 1 ? 700 : 400}>
                      {s.label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Step Title */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label={`Step ${displayStep} of 8`} color="primary" size="small" />
          <Typography variant="h6" fontWeight={700}>{STEPS[displayStep - 1]?.short}</Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearProfileError())}>{error}</Alert>
        )}

        {/* Step Content */}
        <StepContent
          step={displayStep}
          profile={profile}
          onSave={handleStepSave}
          isSaving={isSaving}
          isUploading={isUploading}
          onUpload={handleUpload}
          onDelete={handleDelete}
          onBack={() => setDisplayStep(s => Math.max(1, s - 1))}
          onGoToDashboard={() => navigate('/athlete/dashboard')}
        />
      </Box>
    </Box>
  );
}

// ─── Step Content Router ──────────────────────────────────────────────────────
function StepContent({ step, profile, onSave, isSaving, isUploading, onUpload, onDelete, onBack, onGoToDashboard }) {
  switch (step) {
    case 1: return <Step1Personal profile={profile} onSave={onSave} isSaving={isSaving} onBack={onBack} />;
    case 2: return <Step2Family profile={profile} onSave={onSave} isSaving={isSaving} onBack={onBack} />;
    case 3: return <Step3Address profile={profile} onSave={onSave} isSaving={isSaving} onBack={onBack} />;
    case 4: return <Step4Club profile={profile} onSave={onSave} isSaving={isSaving} onBack={onBack} />;
    case 5: return <Step5Competition profile={profile} onSave={onSave} isSaving={isSaving} onBack={onBack} />;
    case 6: return <Step6Documents profile={profile} onSave={onSave} isSaving={isSaving} isUploading={isUploading} onUpload={onUpload} onDelete={onDelete} onBack={onBack} />;
    case 7: return <Step7Declaration profile={profile} onSave={onSave} isSaving={isSaving} onBack={onBack} />;
    case 8: return <Step8Payment profile={profile} onGoToDashboard={onGoToDashboard} onBack={onBack} />;
    default: return null;
  }
}

// ─── Shared form wrapper ──────────────────────────────────────────────────────
function StepCard({ children, onBack, onNext, isSaving, isFirst, isLast, nextLabel }) {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, md: 4 } }}>
        {children}
      </CardContent>
      <Divider />
      <Box sx={{ px: 4, py: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={onBack} disabled={isFirst}>
          Back
        </Button>
        <Button
          variant="contained" endIcon={isLast ? <CheckCircle /> : <ArrowForward />}
          onClick={onNext} disabled={isSaving}
          sx={{ minWidth: 140 }}
        >
          {isSaving ? <CircularProgress size={20} color="inherit" /> : (nextLabel || 'Save & Continue')}
        </Button>
      </Box>
    </Card>
  );
}

// ─── Step 1: Personal Details ─────────────────────────────────────────────────
function Step1Personal({ profile, onSave, isSaving, onBack }) {
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: yupResolver(schemas[1]),
    defaultValues: {
      dateOfBirth: profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
      gender: profile?.gender || '',
      bloodGroup: profile?.bloodGroup || '',
    },
  });

  return (
    <StepCard onBack={onBack} onNext={handleSubmit(onSave)} isSaving={isSaving} isFirst>
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}>
          <TextField {...register('dateOfBirth')} label="Date of Birth" type="date"
            fullWidth InputLabelProps={{ shrink: true }}
            error={!!errors.dateOfBirth} helperText={errors.dateOfBirth?.message} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.gender}>
            <InputLabel>Gender</InputLabel>
            <Controller name="gender" control={control} render={({ field }) => (
              <Select {...field} label="Gender">
                {['Male', 'Female', 'Other'].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </Select>
            )} />
            {errors.gender && <FormHelperText>{errors.gender.message}</FormHelperText>}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.bloodGroup}>
            <InputLabel>Blood Group</InputLabel>
            <Controller name="bloodGroup" control={control} render={({ field }) => (
              <Select {...field} label="Blood Group">
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
              </Select>
            )} />
            {errors.bloodGroup && <FormHelperText>{errors.bloodGroup.message}</FormHelperText>}
          </FormControl>
        </Grid>
      </Grid>
    </StepCard>
  );
}

// ─── Step 2: Parent / Guardian ────────────────────────────────────────────────
function Step2Family({ profile, onSave, isSaving, onBack }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schemas[2]),
    defaultValues: {
      fatherName: profile?.fatherName || '',
      motherName: profile?.motherName || '',
      guardianName: profile?.guardianName || '',
      parentMobile: profile?.parentMobile || '',
      parentEmail: profile?.parentEmail || '',
    },
  });

  return (
    <StepCard onBack={onBack} onNext={handleSubmit(onSave)} isSaving={isSaving}>
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}>
          <TextField {...register('fatherName')} label="Father's Name" fullWidth
            error={!!errors.fatherName} helperText={errors.fatherName?.message} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField {...register('motherName')} label="Mother's Name" fullWidth
            error={!!errors.motherName} helperText={errors.motherName?.message} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField {...register('guardianName')} label="Guardian Name (if applicable)" fullWidth
            error={!!errors.guardianName} helperText={errors.guardianName?.message} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField {...register('parentMobile')} label="Parent Mobile" fullWidth
            inputProps={{ maxLength: 10 }}
            error={!!errors.parentMobile} helperText={errors.parentMobile?.message}
            InputProps={{ startAdornment: <InputAdornment position="start">+91</InputAdornment> }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField {...register('parentEmail')} label="Parent Email (optional)" fullWidth
            error={!!errors.parentEmail} helperText={errors.parentEmail?.message} />
        </Grid>
      </Grid>
    </StepCard>
  );
}

// ─── Step 3: Address ──────────────────────────────────────────────────────────
const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
  'Andaman & Nicobar','Chandigarh','Puducherry','Lakshadweep','Dadra & Nagar Haveli',
];

function Step3Address({ profile, onSave, isSaving, onBack }) {
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schemas[3]),
    defaultValues: {
      street: profile?.address?.street || '',
      landmark: profile?.address?.landmark || '',
      city: profile?.address?.city || '',
      district: profile?.address?.district || '',
      state: profile?.address?.state || '',
      pinCode: profile?.address?.pinCode || '',
    },
  });

  const [pinLoading, setPinLoading] = useState(false);
  const [pinMsg, setPinMsg] = useState('');
  const pinCode = watch('pinCode');

  // Auto-detect state/city/district from PIN code
  useEffect(() => {
    if (!pinCode || pinCode.length !== 6 || !/^\d{6}$/.test(pinCode)) {
      setPinMsg('');
      return;
    }
    let cancelled = false;
    const lookup = async () => {
      setPinLoading(true);
      setPinMsg('');
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pinCode}`);
        const data = await res.json();
        if (cancelled) return;
        if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          setValue('state', po.State, { shouldValidate: true });
          setValue('district', po.District, { shouldValidate: true });
          setValue('city', po.Block && po.Block !== 'NA' ? po.Block : po.Division || po.District, { shouldValidate: true });
          setPinMsg(`✅ Auto-filled: ${po.District}, ${po.State}`);
        } else {
          setPinMsg('⚠️ PIN code not found — please fill manually');
        }
      } catch {
        if (!cancelled) setPinMsg('⚠️ Could not look up PIN — please fill manually');
      } finally {
        if (!cancelled) setPinLoading(false);
      }
    };
    lookup();
    return () => { cancelled = true; };
  }, [pinCode, setValue]);

  return (
    <StepCard onBack={onBack} onNext={handleSubmit(onSave)} isSaving={isSaving}>
      <Grid container spacing={2.5}>
        <Grid item xs={12}>
          <TextField {...register('street')} label="Street Address / House No." fullWidth
            error={!!errors.street} helperText={errors.street?.message} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField {...register('landmark')} label="Landmark (optional)" fullWidth
            error={!!errors.landmark} helperText={errors.landmark?.message} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField {...register('pinCode')} label="PIN Code" fullWidth
            inputProps={{ maxLength: 6 }}
            error={!!errors.pinCode} helperText={errors.pinCode?.message}
            InputProps={{
              endAdornment: pinLoading ? (
                <InputAdornment position="end"><CircularProgress size={18} /></InputAdornment>
              ) : null,
            }}
          />
          {pinMsg && (
            <Typography variant="caption" color={pinMsg.startsWith('✅') ? 'success.main' : 'warning.main'} sx={{ mt: 0.5, display: 'block' }}>
              {pinMsg}
            </Typography>
          )}
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField {...register('city')} label="City / Town" fullWidth
            error={!!errors.city} helperText={errors.city?.message}
            InputLabelProps={{ shrink: !!watch('city') }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField {...register('district')} label="District" fullWidth
            error={!!errors.district} helperText={errors.district?.message}
            InputLabelProps={{ shrink: !!watch('district') }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.state}>
            <InputLabel>State</InputLabel>
            <Controller name="state" control={control} render={({ field }) => (
              <Select {...field} label="State">
                {INDIAN_STATES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            )} />
            {errors.state && <FormHelperText>{errors.state.message}</FormHelperText>}
          </FormControl>
        </Grid>
      </Grid>
      <Alert severity="info" sx={{ mt: 2 }} icon={false}>
        💡 <strong>Tip:</strong> Enter your 6-digit PIN code first — State, District, and City will be auto-filled!
      </Alert>
    </StepCard>
  );
}

// ─── Step 4: Club & Representation ───────────────────────────────────────────
function Step4Club({ profile, onSave, isSaving, onBack }) {
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: yupResolver(schemas[4]),
    defaultValues: {
      clubName: profile?.clubName || '',
      stateRepresentation: profile?.stateRepresentation || '',
      districtRepresentation: profile?.districtRepresentation || '',
    },
  });

  return (
    <StepCard onBack={onBack} onNext={handleSubmit(onSave)} isSaving={isSaving}>
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}>
          <TextField {...register('clubName')} label="Club / Academy Name" fullWidth
            error={!!errors.clubName} helperText={errors.clubName?.message} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.stateRepresentation}>
            <InputLabel>State Representation</InputLabel>
            <Controller name="stateRepresentation" control={control} render={({ field }) => (
              <Select {...field} label="State Representation">
                {INDIAN_STATES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            )} />
            {errors.stateRepresentation && <FormHelperText>{errors.stateRepresentation.message}</FormHelperText>}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField {...register('districtRepresentation')} label="District Representation" fullWidth
            error={!!errors.districtRepresentation} helperText={errors.districtRepresentation?.message} />
        </Grid>
      </Grid>
      <Alert severity="info" sx={{ mt: 3 }}>
        NOC documents from your club and state association can be uploaded in the Documents step.
      </Alert>
    </StepCard>
  );
}

// ─── Step 5: Competition Details ──────────────────────────────────────────────
const AGE_GROUPS = ['U-10','U-12','U-14','U-16','U-18','U-21','Senior','Masters'];

function getAgeFromDOB(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function suggestAgeGroup(age) {
  if (age === null) return '';
  if (age < 10) return 'U-10';
  if (age < 12) return 'U-12';
  if (age < 14) return 'U-14';
  if (age < 16) return 'U-16';
  if (age < 18) return 'U-18';
  if (age < 21) return 'U-21';
  if (age < 40) return 'Senior';
  return 'Masters';
}

function Step5Competition({ profile, onSave, isSaving, onBack }) {
  const age = getAgeFromDOB(profile?.dateOfBirth);
  const suggested = suggestAgeGroup(age);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schemas[5]),
    defaultValues: {
      ageGroup: profile?.ageGroup || suggested || '',
      skillLevel: profile?.skillLevel || '',
    },
  });

  const currentGroup = watch('ageGroup');

  // Auto-set on first mount if empty
  useEffect(() => {
    if (!currentGroup && suggested) {
      setValue('ageGroup', suggested, { shouldValidate: true });
    }
  }, [suggested, currentGroup, setValue]);

  return (
    <StepCard onBack={onBack} onNext={handleSubmit(onSave)} isSaving={isSaving}>
      {age !== null && (
        <Alert severity="info" sx={{ mb: 2.5 }} icon={false}>
          📅 Your age: <strong>{age} years</strong>
          {suggested && <> — Suggested group: <Chip label={suggested} size="small" color="primary" sx={{ ml: 1, fontWeight: 700 }} /></>}
        </Alert>
      )}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.ageGroup}>
            <InputLabel>Age Group</InputLabel>
            <Controller name="ageGroup" control={control} render={({ field }) => (
              <Select {...field} label="Age Group">
                {AGE_GROUPS.map(a => (
                  <MenuItem key={a} value={a}>
                    {a} {a === suggested ? '← Recommended' : ''}
                  </MenuItem>
                ))}
              </Select>
            )} />
            {errors.ageGroup && <FormHelperText>{errors.ageGroup.message}</FormHelperText>}
          </FormControl>
          {currentGroup && currentGroup !== suggested && suggested && (
            <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
              ⚠️ Based on your DOB, the recommended group is {suggested}
            </Typography>
          )}
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.skillLevel}>
            <InputLabel>Skill Level</InputLabel>
            <Controller name="skillLevel" control={control} render={({ field }) => (
              <Select {...field} label="Skill Level">
                {['Beginner','Intermediate','Advanced'].map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            )} />
            {errors.skillLevel && <FormHelperText>{errors.skillLevel.message}</FormHelperText>}
          </FormControl>
        </Grid>
      </Grid>
    </StepCard>
  );
}

// ─── Step 6: Documents ────────────────────────────────────────────────────────
function Step6Documents({ profile, onSave, isSaving, isUploading, onUpload, onDelete, onBack }) {
  const docs = profile?.documents || {};
  const noc  = { club: profile?.nocClub, state: profile?.nocStateAssociation };

  return (
    <StepCard onBack={onBack} onNext={() => onSave({})} isSaving={isSaving}>
      <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
        At least <strong>Passport Photo</strong> and <strong>Aadhaar Card</strong> are required. Upload remaining when available.
      </Alert>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <DocDropzone label="Passport Photo *" docType="passportPhoto"
            currentDoc={docs.passportPhoto} onUpload={onUpload} onDelete={onDelete}
            isUploading={isUploading} accept="image" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DocDropzone label="Aadhaar Card *" docType="aadhaarCard"
            currentDoc={docs.aadhaarCard} onUpload={onUpload} onDelete={onDelete}
            isUploading={isUploading} accept="any" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DocDropzone label="Birth Certificate" docType="birthCertificate"
            currentDoc={docs.birthCertificate} onUpload={onUpload} onDelete={onDelete}
            isUploading={isUploading} accept="any" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DocDropzone label="School Bonafide Certificate" docType="schoolBonafide"
            currentDoc={docs.schoolBonafide} onUpload={onUpload} onDelete={onDelete}
            isUploading={isUploading} accept="pdf" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DocDropzone label="Medical Fitness Certificate" docType="medicalFitness"
            currentDoc={docs.medicalFitness} onUpload={onUpload} onDelete={onDelete}
            isUploading={isUploading} accept="pdf" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DocDropzone label="NOC from Club" docType="nocClub"
            currentDoc={noc.club} onUpload={onUpload} onDelete={onDelete}
            isUploading={isUploading} accept="pdf" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DocDropzone label="NOC from State Association" docType="nocStateAssociation"
            currentDoc={noc.state} onUpload={onUpload} onDelete={onDelete}
            isUploading={isUploading} accept="pdf" />
        </Grid>
      </Grid>
    </StepCard>
  );
}

// ─── Step 7: Declaration ──────────────────────────────────────────────────────
function Step7Declaration({ profile, onSave, isSaving, onBack }) {
  const [agreed, setAgreed] = useState(false);
  const [parentConsent, setParentConsent] = useState(false);

  const age = getAgeFromDOB(profile?.dateOfBirth);
  const isMinor = age !== null && age < 18;
  const canProceed = agreed && (!isMinor || parentConsent);

  return (
    <StepCard onBack={onBack} onNext={() => canProceed && onSave({})} isSaving={isSaving}>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, maxHeight: 280, overflow: 'auto', mb: 3, bgcolor: 'grey.50' }}>
        <Typography variant="body2" color="text.secondary" paragraph>
          I hereby declare that all the information provided in this registration form is true and correct to the best of my knowledge.
          I understand that providing false information may lead to disqualification and/or legal action.
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          I agree to abide by the rules and regulations of the Sports Club Management System, the respective sports federation,
          and the organising committee of any event I participate in.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          I give consent for my personal data and performance records to be stored and used for administrative purposes
          in accordance with applicable data protection laws.
        </Typography>
      </Paper>

      {/* Main declaration checkbox */}
      <Box
        onClick={() => setAgreed(a => !a)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
          p: 2, borderRadius: 2, border: '2px solid',
          borderColor: agreed ? 'primary.main' : 'divider',
          bgcolor: agreed ? 'primary.50' : 'transparent',
          transition: 'all 0.2s',
        }}
      >
        <CheckCircle color={agreed ? 'primary' : 'disabled'} />
        <Typography variant="body2" fontWeight={agreed ? 600 : 400}>
          I confirm that all details provided are correct and I agree with the terms and conditions.
        </Typography>
      </Box>

      {/* Dynamic Parent/Guardian consent — only shown if age < 18 */}
      {isMinor && (
        <>
          <Alert severity="warning" icon={<Warning />} sx={{ mt: 2, mb: 1 }}>
            <strong>Athlete is under 18 years old ({age} years).</strong> Parent/Guardian consent is mandatory.
          </Alert>
          <Box
            onClick={() => setParentConsent(c => !c)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
              p: 2, borderRadius: 2, border: '2px solid',
              borderColor: parentConsent ? 'success.main' : 'divider',
              bgcolor: parentConsent ? 'success.50' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <CheckCircle color={parentConsent ? 'success' : 'disabled'} />
            <Box>
              <Typography variant="body2" fontWeight={parentConsent ? 600 : 400}>
                Parent / Guardian Consent
              </Typography>
              <Typography variant="caption" color="text.secondary">
                I, the parent/guardian, give consent for my ward to participate in sports activities and competitions
                organised through this platform. I confirm that the information provided is accurate.
              </Typography>
            </Box>
          </Box>
        </>
      )}

      {!canProceed && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          {!agreed
            ? 'You must agree to the declaration to proceed.'
            : isMinor && !parentConsent
            ? 'Parent/Guardian consent is required for athletes under 18.'
            : ''}
        </Typography>
      )}
    </StepCard>
  );
}

// ─── Step 8: Payment ──────────────────────────────────────────────────────────
function Step8Payment({ profile, onGoToDashboard, onBack }) {
  const isApproved = profile?.registrationStatus === 'Approved';

  const handlePayment = () => {
    toast.success("Payment Gateway Integration is coming in Phase 4!");
  };

  return (
    <Card>
      <CardContent sx={{ p: 4, textAlign: 'center' }}>
        <Avatar sx={{ bgcolor: isApproved ? 'success.100' : 'warning.100', color: isApproved ? 'success.main' : 'warning.main', width: 72, height: 72, mx: 'auto', mb: 2 }}>
          <CheckCircle sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography variant="h5" fontWeight={700} mb={1}>
          {isApproved ? 'Profile Approved!' : 'Profile Submitted!'}
        </Typography>
        <Typography color="text.secondary" mb={3}>
          {isApproved 
            ? 'Your profile has been approved by the admin. You can now proceed to pay the registration fee.'
            : 'Your profile is under review. You\'ll receive an email once approved.'}
        </Typography>
        <Chip
          label={`Status: ${profile?.registrationStatus || 'Pending Review'}`}
          color={isApproved ? 'success' : 'warning'} sx={{ mb: 3, fontWeight: 600 }}
        />
        
        {isApproved ? (
          <Box sx={{ mb: 3, p: 3, bgcolor: 'grey.50', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
            <Typography variant="body1" fontWeight={600} mb={1}>Registration Fee: ₹1,500</Typography>
            <Button variant="contained" color="primary" size="large" onClick={handlePayment} sx={{ px: 4, mt: 1 }}>
              Pay Now
            </Button>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" mb={3}>
            Registration fee payment will be enabled once your documents are approved by the admin.
          </Typography>
        )}
        
        <Button variant="outlined" size="large" onClick={onGoToDashboard} sx={{ px: 4 }}>
          Go to Dashboard
        </Button>
      </CardContent>
      <Divider />
      <Box sx={{ px: 4, py: 2 }}>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={onBack}>Back</Button>
      </Box>
    </Card>
  );
}