import { useUserStore } from '../stores/user-store';

export const useUserPlan = () => {
  const { user, isLoading, refreshUser } = useUserStore();

  const isSuperOrAdmin = user?.role === 'superadmin' || user?.role === 'admin';
  const plan = user?.plan || null;
  const isTrial = plan === 'trial' || plan === 'TRIAL';
  const isPro = isSuperOrAdmin || plan === 'pro' || plan === 'PRO';
  const isBasic = !isPro && !isTrial && !isLoading;
  const isDisabled = user?.is_disabled === true;
  const hasProAccess = isPro || isTrial;
  
  return { 
    isPro, 
    loading: isLoading, 
    isBasic,
    isTrial,
    isDisabled,
    hasProAccess,
    refreshUser,
    plan
  };
};
