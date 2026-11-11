import React, { createContext, useState, useEffect, useContext } from 'react';
import { getMyPermissions } from '../service/api';

// Create the Context
const PermissionContext = createContext(null);

// Create the Provider Component
export function PermissionProvider({ children }) {
  const [perms, setPerms] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getMyPermissions();
        if (data?.success) {
          setPerms(data.permissions || {});
        }
      } catch (err) {
        console.error('Failed to fetch permissions:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <PermissionContext.Provider value={{ perms, loading }}>
      {children}
    </PermissionContext.Provider>
  );
}

// Custom hook to easily use the context in any component
export const usePermissions = () => useContext(PermissionContext);