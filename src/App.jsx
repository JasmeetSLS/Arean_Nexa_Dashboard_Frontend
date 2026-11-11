import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './service/auth';
import { PermissionProvider, usePermissions } from './context/PermissionContext'; // ✅ Import Context

import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChatBot from './pages/ChatBot';
import RolesPermissions from './pages/RolesPermissions';
import SetupPanel from './pages/SetupPanel';
import Layout from './components/Layout';
import TrainerHome from './pages/TrainerHome';

// ✅ Route Protector (Checks if the user is allowed to see the page)
function PageGuard({ pageKey, children }) {
  const { perms, loading } = usePermissions();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F3F4F6]">
        <div className="h-8 w-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  // If permission is explicitly false, redirect to Dashboard
  if (perms && perms.pages && perms.pages[pageKey] === false) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* ✅ Wrap everything inside the PermissionProvider */}
        <PermissionProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Protected & Permission Guarded */}
            <Route
              path="/"
              element={
                <ProtectedRoute isAdmin={true}>
                  <PageGuard pageKey="dashboard">
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </PageGuard>
                </ProtectedRoute>
              }
            />

            <Route
              path="/setup"
              element={
                <ProtectedRoute isAdmin={true}>
                  <PageGuard pageKey="setup">
                    <Layout>
                      <SetupPanel />
                    </Layout>
                  </PageGuard>
                </ProtectedRoute>
              }
            />

            <Route
              path="/role"
              element={
                <ProtectedRoute isAdmin={true}>
                  <PageGuard pageKey="role">
                    <Layout>
                      <RolesPermissions />
                    </Layout>
                  </PageGuard>
                </ProtectedRoute>
              }
            />

            {/* Chatbot — protected route */}
            <Route
              path="/chatbot"
              element={
                <ProtectedRoute isAdmin={true}>
                  <ChatBot />
                </ProtectedRoute>
              }
            />

            <Route
              path="/trainer"
              element={
                <ProtectedRoute>
                  <TrainerHome />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PermissionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}