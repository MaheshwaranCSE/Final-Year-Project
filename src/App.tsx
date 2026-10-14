import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { AuthProvider } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Forensic Suite Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CasesPage = lazy(() => import('./pages/CasesPage'));
const CaseDetailPage = lazy(() => import('./pages/CaseDetailPage'));
const EvidencePage = lazy(() => import('./pages/EvidencePage'));
const EvidenceDetailPage = lazy(() => import('./pages/EvidenceDetailPage'));
const ChainOfCustodyPage = lazy(() => import('./pages/ChainOfCustodyPage'));
const BlockchainPage = lazy(() => import('./pages/BlockchainPage'));
const AIAnalysisPage = lazy(() => import('./pages/AIAnalysisPage'));
const IntegrityMonitorPage = lazy(() => import('./pages/IntegrityMonitorPage'));
const CameraMonitorPage = lazy(() => import('./pages/CameraMonitorPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Public & Legacy Pages
const PublicPortal = lazy(() => import('./pages/PublicPortal'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const SearchPage = lazy(() => import('./pages/SearchPage'));

function LoadingFallback() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#0A0E1A',
      }}
    >
      <CircularProgress sx={{ color: '#3B82F6' }} />
    </Box>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Portal & Architecture Showcase */}
          <Route path="/portal" element={<PublicPortal />} />
          <Route path="/about" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/search" element={<SearchPage />} />

          {/* Main BlockVault Forensic Platform with Global Layout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/cases/:id" element={<CaseDetailPage />} />
            <Route path="/evidence" element={<EvidencePage />} />
            <Route path="/evidence/:id" element={<EvidenceDetailPage />} />
            <Route path="/custody" element={<ChainOfCustodyPage />} />
            <Route path="/blockchain" element={<BlockchainPage />} />
            <Route path="/ai-analysis" element={<AIAnalysisPage />} />
            <Route path="/signal-lab" element={<Navigate to="/ai-analysis" replace />} />
            <Route path="/signal-laboratory" element={<Navigate to="/ai-analysis" replace />} />
            <Route path="/signals" element={<Navigate to="/ai-analysis" replace />} />
            <Route path="/integrity" element={<IntegrityMonitorPage />} />
            <Route path="/cameras" element={<CameraMonitorPage />} />
            <Route path="/audit" element={<AuditLogsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Backwards-compatible Role Dashboard redirects */}
            <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin-dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/police/dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/investigator-dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/doctor/dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/court/dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/user/dashboard" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Fallback to Dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
