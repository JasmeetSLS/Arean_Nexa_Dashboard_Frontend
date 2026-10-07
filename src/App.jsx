import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './service/auth';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChatBot from './pages/ChatBot';
import RolesPermissions from './pages/RolesPermissions';
import SetupPanel from './pages/SetupPanel';
import Layout from './components/Layout';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute isAdmin={true}>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/setup"
            element={
              <ProtectedRoute isAdmin={true}>
                <Layout>
                  <SetupPanel />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/role"
            element={
              <ProtectedRoute isAdmin={true}>
                <Layout>
                  <RolesPermissions />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Chatbot — protected route (shareable URL, still needs a valid token) */}
          <Route
            path="/chatbot"
            element={
              <ProtectedRoute isAdmin={true}>
                <ChatBot />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}