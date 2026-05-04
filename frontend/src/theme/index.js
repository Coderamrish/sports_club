import { createTheme, alpha } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      50:  '#E3F2FD',
      100: '#BBDEFB',
      200: '#90CAF9',
      main: '#1565C0',
      light: '#1E88E5',
      dark: '#0D47A1',
      contrastText: '#fff',
    },
    secondary: {
      main: '#FF6F00',
      light: '#FFA000',
      dark: '#E65100',
      contrastText: '#fff',
    },
    success: {
      50:   '#E8F5E9',
      100:  '#C8E6C9',
      main: '#2E7D32',
      light: '#43A047',
      dark:  '#1B5E20',
    },
    error: {
      50:   '#FFEBEE',
      main: '#C62828',
    },
    warning: {
      50:   '#FFF8E1',
      main: '#F57F17',
    },
    info: { main: '#01579B' },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A2E',
      secondary: '#546E7A',
    },
    divider: '#E0E7EF',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: '2rem',   fontWeight: 700, lineHeight: 1.3 },
    h3: { fontSize: '1.75rem', fontWeight: 600 },
    h4: { fontSize: '1.5rem',  fontWeight: 600 },
    h5: { fontSize: '1.25rem', fontWeight: 600 },
    h6: { fontSize: '1.1rem',  fontWeight: 600 },
    subtitle1: { fontSize: '1rem',    fontWeight: 500 },
    body1:     { fontSize: '0.95rem', lineHeight: 1.6 },
    body2:     { fontSize: '0.875rem',lineHeight: 1.5 },
    button:    { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 12px rgba(21,101,192,0.25)' },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #1565C0, #1E88E5)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#FAFBFC',
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1565C0' },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.04)',
        },
      },
    },
    MuiPaper:    { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiChip:     { styleOverrides: { root: { borderRadius: 6, fontWeight: 500 } } },
    MuiAlert:    { styleOverrides: { root: { borderRadius: 8 } } },
    MuiStepLabel:{ styleOverrides: { label: { fontWeight: 500 } } },
  },
});

export default theme;