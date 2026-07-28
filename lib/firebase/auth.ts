import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User,
} from "firebase/auth";
import { auth } from "./config";

import { setDocument } from "./firestore";
import { Timestamp } from "firebase/firestore";

export const registerUser = async (
  email: string,
  password: string,
  displayName: string
) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });

  // Save profile to Firestore immediately to prevent "Customer" placeholder
  await setDocument("users", credential.user.uid, {
    uid: credential.user.uid,
    email: credential.user.email || email,
    displayName: displayName,
    photoURL: null,
    emailVerified: credential.user.emailVerified,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  await sendEmailVerification(credential.user);
  return credential.user;
};

export const loginUser = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

export const changePassword = async (
  user: User,
  currentPassword: string,
  newPassword: string
) => {
  const credential = EmailAuthProvider.credential(user.email!, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};

export const resendVerificationEmail = async (user: User) => {
  await sendEmailVerification(user);
};
