import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { UserProfile } from '@/types';

const googleProvider = new GoogleAuthProvider();

export const authService = {
  // Sign up with email and password
  async signUpWithEmail(email: string, password: string): Promise<UserProfile> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return this.mapUser(userCredential.user);
  },

  // Sign in with email and password
  async signInWithEmail(email: string, password: string): Promise<UserProfile> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return this.mapUser(userCredential.user);
  },

  // Sign in with Google
  async signInWithGoogle(): Promise<UserProfile> {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return this.mapUser(userCredential.user);
  },

  // Sign out
  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  },

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  // Subscribe to auth state changes
  onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      callback(user ? this.mapUser(user) : null);
    });
  },

  // Map Firebase User to UserProfile
  mapUser(user: User): UserProfile {
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
    };
  },
};
