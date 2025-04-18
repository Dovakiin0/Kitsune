import { create } from "zustand";

export type IAuth = {
  id: string;
  avatar: string;
  email: string;
  username: string;
  collectionId: string;
  collectionName: string;
};

export interface IAuthStore {
  auth: IAuth | null;
  setAuth: (state: IAuth) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<IAuthStore>((set) => ({
  auth: null,
  setAuth: (state: IAuth) => set({ auth: state }),
  clearAuth: () => set({ auth: null }),
}));
