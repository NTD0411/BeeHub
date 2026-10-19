import { create } from "zustand";

interface SidebarStore {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  toggleCollapsed: () =>
    set((state) => ({ isCollapsed: !state.isCollapsed })),
  setMobileOpen: (open: boolean) => set({ isMobileOpen: open }),
}));
