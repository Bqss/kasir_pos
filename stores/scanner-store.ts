import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const STORAGE_KEY = "scanner_saved_device";

export type ScannerConnectionType = "usb" | "bluetooth";

export type SavedScannerDevice = {
    name: string;
    address: string;
    connectionType: ScannerConnectionType;
};

type ScannerStore = {
    // Saved device (persisted to AsyncStorage)
    savedDevice: SavedScannerDevice | null;

    // Runtime connection state
    isConnected: boolean;
    isConnecting: boolean;
    isScanning: boolean;
    error: string | null;

    // Actions
    setSavedDevice: (device: SavedScannerDevice | null) => Promise<void>;
    clearSavedDevice: () => Promise<void>;
    setIsConnected: (connected: boolean) => void;
    setIsConnecting: (connecting: boolean) => void;
    setIsScanning: (scanning: boolean) => void;
    setError: (error: string | null) => void;
    loadFromStorage: () => Promise<void>;

    // Computed
    getDisplayName: () => string;
};

export const useScannerStore = create<ScannerStore>((set, get) => ({
    savedDevice: null,
    isConnected: false,
    isConnecting: false,
    isScanning: false,
    error: null,

    setSavedDevice: async (device) => {
        try {
            if (device) {
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(device));
            } else {
                await AsyncStorage.removeItem(STORAGE_KEY);
            }
            set({ savedDevice: device });
        } catch (e) {
            console.error("[ScannerStore] Failed to save device:", e);
        }
    },

    clearSavedDevice: async () => {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
            set({ savedDevice: null, isConnected: false });
        } catch (e) {
            console.error("[ScannerStore] Failed to clear device:", e);
        }
    },

    setIsConnected: (connected) => set({ isConnected: connected }),
    setIsConnecting: (connecting) => set({ isConnecting: connecting }),
    setIsScanning: (scanning) => set({ isScanning: scanning }),
    setError: (error) => set({ error }),

    loadFromStorage: async () => {
        if (typeof window === "undefined") return;
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const device: SavedScannerDevice = JSON.parse(stored);
                set({ savedDevice: device });
            }
        } catch (e) {
            console.error("[ScannerStore] Failed to load from storage:", e);
        }
    },

    getDisplayName: () => {
        const { savedDevice } = get();
        if (savedDevice) {
            return savedDevice.name || savedDevice.address;
        }
        return "Belum Terhubung";
    },
}));

// Initialize store from AsyncStorage on app start
useScannerStore.getState().loadFromStorage();
