import { supabase } from '@/lib/supabase';
import type { UploadProgress } from '@/types';

export const uploadService = {
  // Upload model file to Supabase Storage
  async uploadModel(
    file: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ url: string; path: string }> {
    // Create unique path with user ID and timestamp
    // Path format: userId/timestamp_filename.glb (bucket name not included in path)
    const timestamp = Date.now();
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${userId}/${timestamp}_${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('models')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('models')
      .getPublicUrl(path);

    // Simulate progress for now (Supabase doesn't provide upload progress out of the box)
    if (onProgress) {
      onProgress({
        percent: 100,
        bytesUploaded: file.size,
        totalBytes: file.size,
      });
    }

    return { url: publicUrl, path };
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
