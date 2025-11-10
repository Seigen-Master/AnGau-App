import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export const uploadImage = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};

export const uploadFile = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};

export const deleteFileFromStorage = async (url: string): Promise<void> => {
  const fileRef = ref(storage, url);
  await deleteObject(fileRef);
};