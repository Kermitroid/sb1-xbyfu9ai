import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import firebase from 'firebase/compat/app'; // Import firebase, specifically for the User type

// We'll use firebase.User as the primary user object type
// If you have a separate user profile from your backend (e.g. from Firestore 'users' collection),
// you might want to store that as well, e.g., userProfile: YourAppUserProfile | null;

interface UserState {
  firebaseUser: firebase.User | null; // Stores the Firebase User object
  idToken: string | null;             // Stores the Firebase ID Token
  isLoading: boolean;                 // To manage loading state, e.g., during auth state change
  error: string | null;               // To store any auth-related errors

  // Action to set user and token, typically called by onAuthStateChanged listener
  setUserAndToken: (user: firebase.User | null, token: string | null) => void;
  
  // Action to clear user and token on logout
  clearUserAndToken: () => void;

  // Action to set loading state
  setLoading: (loading: boolean) => void;

  // Action to set error state
  setError: (error: string | null) => void;
}

const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      firebaseUser: null,
      idToken: null,
      isLoading: true, // Initially true until first onAuthStateChanged event
      error: null,
      
      setUserAndToken: (user, token) => {
        set({ 
          firebaseUser: user, 
          idToken: token, 
          isLoading: false, 
          error: null 
        });
      },
      
      clearUserAndToken: () => {
        set({ 
          firebaseUser: null, 
          idToken: null, 
          isLoading: false, 
          error: null 
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error, isLoading: false }),
    }),
    {
      name: 'user-auth-storage', // Changed name to avoid conflict if old storage exists
    }
  )
);

// Helper function to get isAuthenticated status, can be used in components
export const getIsAuthenticated = () => !!useUserStore.getState().firebaseUser;

export default useUserStore;
