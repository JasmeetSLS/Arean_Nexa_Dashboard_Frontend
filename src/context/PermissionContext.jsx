import React, { createContext, useState, useEffect, useContext } from 'react';
import { getMyPermissions } from '../service/api';
import { useAuth } from '../service/auth';

const PermissionContext = createContext(null);

export function PermissionProvider({ children }) {
  const { user } = useAuth();
  const [perms, setPerms] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch permissions ONLY when the user ID changes (login, logout, refresh)
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getMyPermissions()
      .then(res => setPerms(res.data.permissions || {}))
      .catch(console.error)
      .finally(() => setLoading(false));

  }, [user?.id]); 

  // 2. Simple function to refresh after saving in RolesPermissions page
  const refreshPermissions = async () => {
    if (!user) return;
    const res = await getMyPermissions();
    setPerms(res.data.permissions || {});
  };

  return (
    <PermissionContext.Provider value={{ perms, loading, refreshPermissions }}>
      {children}
    </PermissionContext.Provider>
  );
}

export const usePermissions = () => useContext(PermissionContext);