import { Navigate } from 'react-router-dom';
import { useAuth } from '../service/auth';

const ProtectedRoute = ({ children, isAdmin = false }) => {
  const { loading, isAuthenticated, user } = useAuth();

  // 1. Waiting for session restore
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#F3F4F6]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // 2. Not logged in → login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. Role guard for admin-only routes
  if (isAdmin && user?.type !== 'admin') {
    // a trainer trying to open /, /setup, /role → send them to /trainer
    return <Navigate to="/trainer" replace />;
  }

  return children;
};

export default ProtectedRoute;