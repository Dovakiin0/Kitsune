import { create } from "zustand";
import { persist } from "zustand/middleware";

export type IAuth = {
  id: string;
  avatar: string;
  email: string;
  username: string;
  collectionId: string;
  collectionName: string;
  autoSkip: boolean;
};

export interface IAuthStore {
  auth: IAuth | null;
  setAuth: (state: IAuth) => void;
  clearAuth: () => void;
  isRefreshing: boolean;
  setIsRefreshing: (val: boolean) => void;
}

export const useAuthStore = create<IAuthStore>()(
  persist(
    (set) => ({
      auth: null,
      setAuth: (state: IAuth) => set({ auth: state }),
      clearAuth: () => set({ auth: null }),
      isRefreshing: true,
      setIsRefreshing: (val: boolean) => set({ isRefreshing: val }),
    }),
    {
      name: "auth",
      partialize: (state) => ({
        auth: state.auth,
      }),
      version: 0,
    },
  ),
);

export const useAuthHydrated = () => {
  return useAuthStore.persist.hasHydrated();
};
