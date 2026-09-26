import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const BRANCH_ID_KEY = "current_branch_id";
const BRANCH_NAME_KEY = "current_branch_name";
const BRANCH_DATA_KEY = "selectedBranchData";

export type BranchData = {
    id: string;
    name: string;
    address?: string;
    province?: { id: string; name: string };
    city?: { id: string; name: string };
    subdistrict?: { id: string; name: string };
    village?: { id: string; name: string };
};

type BranchStore = {
    // Current selected branch
    currentBranchId: string | null;
    currentBranchName: string | null;
    currentBranchData: BranchData | null;

    // Loading state
    isLoading: boolean;

    // Actions
    setCurrentBranch: (branch: BranchData) => Promise<void>;
    clearCurrentBranch: () => Promise<void>;
    loadFromStorage: () => Promise<void>;
};

export const useBranchStore = create<BranchStore>((set) => ({
    currentBranchId: null,
    currentBranchName: null,
    currentBranchData: null,
    isLoading: true,

    setCurrentBranch: async (branch) => {
        try {
            // Save to AsyncStorage
            await AsyncStorage.setItem(BRANCH_ID_KEY, branch.id);
            await AsyncStorage.setItem(BRANCH_NAME_KEY, branch.name);
            await AsyncStorage.setItem(BRANCH_DATA_KEY, JSON.stringify(branch));
            // Also save with legacy keys for compatibility
            await AsyncStorage.setItem("selectedBranchId", branch.id);

            // Update store
            set({
                currentBranchId: branch.id,
                currentBranchName: branch.name,
                currentBranchData: branch,
            });

            console.log("[BranchStore] Branch saved:", branch.name);
        } catch (e) {
            console.error("[BranchStore] Failed to save branch:", e);
        }
    },

    clearCurrentBranch: async () => {
        try {
            await AsyncStorage.multiRemove([
                BRANCH_ID_KEY,
                BRANCH_NAME_KEY,
                BRANCH_DATA_KEY,
                "selectedBranchId",
            ]);

            set({
                currentBranchId: null,
                currentBranchName: null,
                currentBranchData: null,
            });

            console.log("[BranchStore] Branch cleared");
        } catch (e) {
            console.error("[BranchStore] Failed to clear branch:", e);
        }
    },

    loadFromStorage: async () => {
        if (typeof window === "undefined") return;
        try {
            set({ isLoading: true });

            const [branchId, branchName, branchDataStr] = await Promise.all([
                AsyncStorage.getItem(BRANCH_ID_KEY),
                AsyncStorage.getItem(BRANCH_NAME_KEY),
                AsyncStorage.getItem(BRANCH_DATA_KEY),
            ]);

            let branchData: BranchData | null = null;
            if (branchDataStr) {
                try {
                    branchData = JSON.parse(branchDataStr);
                } catch {
                    // Ignore parse error
                }
            }

            set({
                currentBranchId: branchId,
                currentBranchName: branchName,
                currentBranchData: branchData,
                isLoading: false,
            });

            if (branchName) {
                console.log("[BranchStore] Loaded branch:", branchName);
            }
        } catch (e) {
            console.error("[BranchStore] Failed to load from storage:", e);
            set({ isLoading: false });
        }
    },
}));

// Initialize store from AsyncStorage on app start
useBranchStore.getState().loadFromStorage();
