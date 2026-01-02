import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ApplicationDetail from './pages/ApplicationDetail';
import AuditLogs from './pages/AuditLogs';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import RERCHeadPanel from './pages/RERCHeadPanel';
import RERCHeadReview from './pages/RERCHeadReview';
import ProtectedRoute from './components/ProtectedRoute';
import { authService } from './services/api';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/application/:rowIndex"
          element={
            <ProtectedRoute>
              <ApplicationDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute>
              <AuditLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute adminOnly={true}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rerc-head-panel"
          element={
            <ProtectedRoute>
              <RERCHeadPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rerc-head-review/:rowIndex"
          element={
            <ProtectedRoute>
              <RERCHeadReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/" 
          element={
            authService.isAuthenticated() 
              ? <Navigate to="/dashboard" /> 
              : <LandingPage />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
