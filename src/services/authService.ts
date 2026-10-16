import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from '../types/auth';

const USERS_COLLECTION = 'users';

/**
 * Format Firebase Auth errors into clear, actionable messages
 */
export const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.';
    case 'auth/email-already-in-use':
      return 'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.';
    case 'auth/invalid-email':
      return 'Địa chỉ email không hợp lệ.';
    case 'auth/weak-password':
      return 'Mật khẩu phải có ít nhất 6 ký tự.';
    case 'auth/too-many-requests':
      return 'Bạn đã thử quá nhiều lần. Vui lòng đợi trong giây lát rồi thử lại.';
    case 'auth/network-request-failed':
      return 'Không thể kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn.';
    default:
      return 'Đã xảy ra lỗi xác thực. Vui lòng thử lại.';
  }
};

/**
 * Fetch user profile from Firestore `users` collection
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data();
      return {
        id: uid,
        name: data.name || 'User',
        email: data.email || '',
        avatarUrl: data.avatarUrl || null,
        createdAt: data.createdAt
          ? data.createdAt.toDate?.()?.toISOString?.() || data.createdAt
          : undefined,
      };
    }

    // If profile document does not exist yet (e.g. created directly in console), create it
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === uid) {
      const fallbackProfile: UserProfile = {
        id: uid,
        name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        email: currentUser.email || '',
        avatarUrl: currentUser.photoURL || null,
      };

      await setDoc(userDocRef, {
        id: uid,
        name: fallbackProfile.name,
        email: fallbackProfile.email,
        avatarUrl: fallbackProfile.avatarUrl,
        createdAt: serverTimestamp(),
      });

      return fallbackProfile;
    }

    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * Register a new user with email and password, then create Firestore user document
 */
export const registerWithEmail = async (
  name: string,
  email: string,
  pass: string
): Promise<UserProfile> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  // Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  const fbUser: FirebaseUser = userCredential.user;

  // Update display name on auth profile
  try {
    await updateProfile(fbUser, { displayName: cleanName });
  } catch (err) {
    console.warn('Failed to update displayName on Firebase Auth profile:', err);
  }

  // Create document in Firestore collection `users`
  const userProfile: UserProfile = {
    id: fbUser.uid,
    name: cleanName,
    email: cleanEmail,
    avatarUrl: null,
  };

  const userDocRef = doc(db, USERS_COLLECTION, fbUser.uid);
  await setDoc(userDocRef, {
    id: fbUser.uid,
    name: cleanName,
    email: cleanEmail,
    avatarUrl: null,
    createdAt: serverTimestamp(),
  });

  return userProfile;
};

/**
 * Login with email and password
 */
export const loginWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
  const cleanEmail = email.trim().toLowerCase();
  const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
  const fbUser = userCredential.user;

  let profile = await getUserProfile(fbUser.uid);
  if (!profile) {
    profile = {
      id: fbUser.uid,
      name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
      email: fbUser.email || cleanEmail,
      avatarUrl: null,
    };
  }

  return profile;
};

/**
 * Logout current user
 */
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};
