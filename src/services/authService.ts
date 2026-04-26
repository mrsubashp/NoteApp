import { 
  GoogleAuthProvider, 
  OAuthProvider,
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');

const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.addScope('Files.ReadWrite');
microsoftProvider.addScope('user.read');

let _accessToken: string | null = null;
let _idToken: string | null = null;

export const getAccessToken = () => _accessToken;

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    _accessToken = credential?.accessToken || null;
    const user = result.user;
    await syncUserProfile(user);
    return user;
  } catch (error) {
    console.error('Google Login error:', error);
    throw error;
  }
};

export const signInWithApple = async () => {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    const credential = OAuthProvider.credentialFromResult(result);
    _idToken = credential?.idToken || null;
    const user = result.user;
    await syncUserProfile(user);
    return user;
  } catch (error) {
    console.error('Apple Login error:', error);
    throw error;
  }
};

export const signInWithMicrosoft = async () => {
  try {
    const result = await signInWithPopup(auth, microsoftProvider);
    const credential = OAuthProvider.credentialFromResult(result);
    _accessToken = credential?.accessToken || null;
    const user = result.user;
    await syncUserProfile(user);
    return user;
  } catch (error) {
    console.error('Microsoft Login error:', error);
    throw error;
  }
};

async function syncUserProfile(user: User) {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'User',
      categories: ['General', 'Work', 'Personal', 'Ideas'],
      syncPreference: 'firebase'
    };
    await setDoc(userRef, profile);
  }
}

export const logout = () => signOut(auth);

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
