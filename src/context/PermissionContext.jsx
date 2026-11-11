import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getMyPermissions } from '../service/api';
import { useAuth } from '../service/auth'; 

const PermissionContext = createContext(null);

export function PermissionProvider({ children }) {
  const { user } = useAuth(); 
  const [perms, setPerms] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setPerms(null);
      setLoading(false);
      return;
    }

    setLoading(true);
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
  }, [user]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return (
    <PermissionContext.Provider value={{ perms, loading, refreshPermissions: fetchPermissions }}>
      {children}
    </PermissionContext.Provider>
  );
}

export const usePermissions = () => useContext(PermissionContext);