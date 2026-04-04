import { create } from 'zustand';

const usePWAStore = create((set) => ({
  deferredPrompt: null,
  isInstallable: false,
  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt, isInstallable: true }),
  clearDeferredPrompt: () => set({ deferredPrompt: null, isInstallable: false }),
}));

export default usePWAStore;
