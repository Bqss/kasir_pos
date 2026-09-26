import { UserRole, canAccessRole, hasPermission, normalizeRole } from '@/config/permissions';
import { useUserStore } from '@/stores/user-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export function usePermissions() {
  const user = useUserStore((state) => state.user);
  const [storedRole, setStoredRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserRole = useCallback(async () => {
    try {
      if (user?.role) {
        const norm = normalizeRole(user.role);
        setStoredRole(norm);
        await AsyncStorage.setItem('user_role', norm);
      } else {
        const role = await AsyncStorage.getItem('user_role');
        if (role) {
          setStoredRole(normalizeRole(role));
        } else {
          setStoredRole(normalizeRole(user?.role));
        }
      }
    } catch (error) {
      console.error('Error loading user role:', error);
      setStoredRole(normalizeRole(user?.role));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserRole();
  }, [loadUserRole]);

  const activeRole: UserRole = storedRole || normalizeRole(user?.role);

  const saveUserRole = async (role: UserRole) => {
    try {
      const norm = normalizeRole(role);
      await AsyncStorage.setItem('user_role', norm);
      setStoredRole(norm);
    } catch (error) {
      console.error('Error saving user role:', error);
    }
  };

  const clearUserRole = async () => {
    try {
      await AsyncStorage.removeItem('user_role');
      setStoredRole(null);
    } catch (error) {
      console.error('Error clearing user role:', error);
    }
  };

  const checkPermission = useCallback(
    (menuKey: string): boolean => {
      return hasPermission(activeRole, menuKey);
    },
    [activeRole]
  );

  const checkRoleAccess = useCallback(
    (requiredRole: UserRole): boolean => {
      return canAccessRole(requiredRole, activeRole);
    },
    [activeRole]
  );

  return {
    userRole: activeRole,
    loading,
    saveUserRole,
    clearUserRole,
    hasPermission: checkPermission,
    canAccessRole: checkRoleAccess,
  };
}

export function usePermission(menuKey: string) {
  const { hasPermission, loading } = usePermissions();
  const [permitted, setPermitted] = useState(true);

  useEffect(() => {
    if (!loading) {
      setPermitted(hasPermission(menuKey));
    }
  }, [menuKey, hasPermission, loading]);

  return { permitted, loading };
}

