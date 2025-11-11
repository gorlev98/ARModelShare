import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import type { UploadProgress } from '@/types';

export const uploadService = {
  // Upload model file to Firebase Storage
  async uploadModel(
    file: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ url: string; path: string }> {
    // Create unique path with user ID and timestamp
    const timestamp = Date.now();
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `models/${userId}/${timestamp}_${fileName}`;
    
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (onProgress) {
            const progress: UploadProgress = {
              percent: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              bytesUploaded: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
            };
            onProgress(progress);
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url, path });
        }
      );
    });
  },

  // Validate file before upload
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedExtensions = ['.glb', '.gltf'];
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!allowedExtensions.includes(extension)) {
      return { valid: false, error: 'Only .glb and .gltf files are supported' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 100MB' };
    }

    return { valid: true };
  },
};
