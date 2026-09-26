import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { authApi } from '../services/endpoints/auth';
import { User } from '../types/api';

// Module-level variables to track intervals and subscriptions
let intervalId: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: any = null;

interface UserStore {
  user: User | null;
  isLoading: boolean;
  lastFetchTime: number;
  isPeriodicFetchActive: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
  startPeriodicFetch: () => void;
  stopPeriodicFetch: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      lastFetchTime: 0,
      isPeriodicFetchActive: false,
      
      setUser: (user) => {
        set({ user });
        // Also save to AsyncStorage for backward compatibility
        if (user) {
          AsyncStorage.setItem('user_data', JSON.stringify(user));
        } else {
          AsyncStorage.removeItem('user_data');
        }
      },
      
      refreshUser: async () => {
        const state = get();
        const now = Date.now();
        
        // Prevent too frequent fetches
        if (now - state.lastFetchTime < 30 * 1000) {
          console.log('User data fetched too recently, skipping');
          return;
        }
        
        // Check if user is authenticated
        if (!authApi.isAuthenticated()) {
          console.log('User not authenticated, skipping refresh');
          return;
        }
        
        set({ isLoading: true });
        
        try {
          const response = await authApi.getProfile();
          if (response.data) {
            set({ 
              user: response.data,
              lastFetchTime: now
            });
            console.log(response.data)
            // Update AsyncStorage for backward compatibility
            await AsyncStorage.setItem('user_data', JSON.stringify(response.data));
            console.log('User data refreshed successfully');
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      clearUser: () => {
        set({ user: null, lastFetchTime: 0 });
        AsyncStorage.removeItem('user_data');
      },
      
      startPeriodicFetch: () => {
        // Prevent duplicate intervals
        if (get().isPeriodicFetchActive) {
          console.log('Periodic fetch already active');
          return;
        }
        
        // Clear any existing intervals/subscriptions
        if (intervalId) clearInterval(intervalId);
        if (appStateSubscription) appStateSubscription.remove();
        
        // Initial fetch
        get().refreshUser();
        
        // Set up periodic fetch
        intervalId = setInterval(() => {
          get().refreshUser();
        }, 1 * 60 * 1000);
        
        // Set up app state listener to refresh when app comes to foreground
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
          if (nextAppState === 'active') {
            // Refresh when app becomes active
            get().refreshUser();
          }
        };
        
        appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
        
        set({ isPeriodicFetchActive: true });
        console.log('Periodic user data fetching started');
      },
      
      stopPeriodicFetch: () => {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        if (appStateSubscription) {
          appStateSubscription.remove();
          appStateSubscription = null;
        }
        set({ isPeriodicFetchActive: false });
        console.log('Periodic user data fetching stopped');
      }
    }),
    {
      name: 'user-store-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        user: state.user,
        lastFetchTime: state.lastFetchTime 
      }),
    }
  )
);

// Type extension for cleanup function
declare module 'zustand' {
  interface SetStateInternal<UserStore> {
    _cleanup?: () => void;
  }
}
