import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
} from "firebase/storage";
import { storage } from "./config";

export const uploadFile = (
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(progress));
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
};

export const deleteFile = async (path: string) => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};

export const deleteFileByUrl = async (url: string) => {
  const storageRef = ref(storage, url);
  await deleteObject(storageRef);
};

export const listFiles = async (path: string) => {
  const storageRef = ref(storage, path);
  const result = await listAll(storageRef);
  const files = await Promise.all(
    result.items.map(async (item) => {
      const url = await getDownloadURL(item);
      const metadata = await getMetadata(item);
      return {
        name: item.name,
        fullPath: item.fullPath,
        url,
        size: metadata.size,
        contentType: metadata.contentType,
        timeCreated: metadata.timeCreated,
      };
    })
  );
  return files;
};

export const getFileUrl = async (path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
};

// Generate a unique file path for uploads
export const generateStoragePath = (
  folder: string,
  fileName: string
): string => {
  const ext = fileName.split(".").pop();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${folder}/${timestamp}-${random}.${ext}`;
};
