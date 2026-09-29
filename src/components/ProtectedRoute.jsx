import { Navigate } from 'react-router-dom';
import { useAuth } from '../service/auth';

const ProtectedRoute = ({ children, isAdmin = false }) => {
  const { loading, isAuthenticated, user } = useAuth();

  // While restoring session from localStorage
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#F3F4F6]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // Not logged in → go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Optional: admin/active check
  if (isAdmin && user?.status !== 'active') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;