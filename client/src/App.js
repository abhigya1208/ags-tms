import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './services/AuthContext';

import LoginPage from './pages/LoginPage';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import AddStudentPage from './pages/AddStudentPage';
import TeachersPage from './pages/TeachersPage';
import DefaultersPage from './pages/DefaultersPage';
import LogsPage from './pages/LogsPage';
import SessionsPage from './pages/SessionsPage';
import ProfilePage from './pages/ProfilePage';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-sage-300 border-t-sage-600 rounded-full animate-spin" />
        <p className="text-sage-600 font-body text-sm">Loading AGS...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { fontFamily: 'DM Sans, sans-serif', fontSize: '14px', borderRadius: '12px' },
          success: { iconTheme: { primary: '#3d9162', secondary: '#fff' } },
          error: { iconTheme: { primary: '#e04e1a', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <PrivateRoute><Layout /></PrivateRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="students/add" element={<AddStudentPage />} />
          <Route path="students/:id" element={<StudentDetailPage />} />
          <Route path="teachers" element={<PrivateRoute adminOnly><TeachersPage /></PrivateRoute>} />
          <Route path="defaulters" element={<PrivateRoute adminOnly><DefaultersPage /></PrivateRoute>} />
          <Route path="logs" element={<PrivateRoute adminOnly><LogsPage /></PrivateRoute>} />
          <Route path="sessions" element={<PrivateRoute adminOnly><SessionsPage /></PrivateRoute>} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
