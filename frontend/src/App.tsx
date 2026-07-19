import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import CandidateDashboard from './pages/CandidateDashboard';
import HRDashboard from './pages/HRDashboard';
import JobsList from './pages/JobsList';
import ProtectedRoute from './components/ProtectedRoute';
import CandidateResume from './pages/CandidateResume';
import CandidateProfile from './pages/CandidateProfile';
import CandidateApplications from './pages/CandidateApplications';
import HRCandidates from './pages/HRCandidates';
import AICoverLetter from './pages/AICoverLetter';
import AIInterviewPrep from './pages/AIInterviewPrep';
import HRAnalytics from './pages/HRAnalytics';
import AdminDashboard from './pages/AdminDashboard';

export const App: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/jobs" element={<JobsList />} />
      
      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          user ? (
            user.role === 'Admin' ? (
              <Navigate to="/admin" replace />
            ) : user.role === 'HR' ? (
              <Navigate to="/hr" replace />
            ) : (
              <Navigate to="/candidate" replace />
            )
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/register"
        element={
          user ? (
            user.role === 'Admin' ? (
              <Navigate to="/admin" replace />
            ) : user.role === 'HR' ? (
              <Navigate to="/hr" replace />
            ) : (
              <Navigate to="/candidate" replace />
            )
          ) : (
            <Register />
          )
        }
      />

      {/* Candidate Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['Candidate']} />}>
        <Route path="/candidate" element={<CandidateDashboard />} />
        <Route path="/candidate/profile" element={<CandidateProfile />} />
        <Route path="/candidate/resume" element={<CandidateResume />} />
        <Route path="/candidate/applications" element={<CandidateApplications />} />
        <Route path="/candidate/cover-letter" element={<AICoverLetter />} />
        <Route path="/candidate/interview-prep" element={<AIInterviewPrep />} />
      </Route>

      {/* HR Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['HR', 'Admin']} />}>
        <Route path="/hr" element={<HRDashboard />} />
        <Route path="/hr/candidates" element={<HRCandidates />} />
        <Route path="/hr/analytics" element={<HRAnalytics />} />
      </Route>

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
export default App;
