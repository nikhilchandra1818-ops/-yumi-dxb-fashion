import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
  runTransaction,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";

export {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
  runTransaction,
  Timestamp,
  db,
};
export type { QueryConstraint, DocumentData, QueryDocumentSnapshot };

// ─── Generic Helpers ──────────────────────────────────────────────────────────

export const getDocument = async <T>(
  collectionName: string,
  docId: string
): Promise<(T & { id: string }) | null> => {
  const ref = doc(db, collectionName, docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { ...(snap.data() as T), id: snap.id };
};

export const getCollection = async <T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<(T & { id: string })[]> => {
  const ref = collection(db, collectionName);
  const q = query(ref, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
};

export const createDocument = async (
  collectionName: string,
  data: DocumentData
) => {
  const ref = collection(db, collectionName);
  return addDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
};

export const setDocument = async (
  collectionName: string,
  docId: string,
  data: DocumentData,
  merge = true
) => {
  const ref = doc(db, collectionName, docId);
  return setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge });
};

export const updateDocument = async (
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
) => {
  const ref = doc(db, collectionName, docId);
  return updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  const ref = doc(db, collectionName, docId);
  return deleteDoc(ref);
};

export const subscribeToDocument = <T>(
  collectionName: string,
  docId: string,
  callback: (data: (T & { id: string }) | null) => void
) => {
  const ref = doc(db, collectionName, docId);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      callback(null);
    } else {
      callback({ ...(snap.data() as T), id: snap.id });
    }
  });
};

export const subscribeToCollection = <T>(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: (T & { id: string })[]) => void
) => {
  const ref = collection(db, collectionName);
  const q = query(ref, ...constraints);
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
    callback(data);
  });
};
