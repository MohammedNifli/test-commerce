import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Profile {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface ProfileStore {
  profile: Profile | null;
  setProfile: (profile: Profile) => void;
  clearProfile: () => void;
}

// The storefront has no login; we remember the details a customer enters at
// checkout so the Profile page can show them and look up their order history.
export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      clearProfile: () => set({ profile: null }),
    }),
    { name: 'customer-profile' }
  )
);
