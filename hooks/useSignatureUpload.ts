/**
 * Custom hook for handling signature uploads to Cloudinary
 */

import { useState, useCallback } from 'react';
import { CloudinaryService, CloudinaryUploadResult } from '@/lib/cloudinaryService';

interface UseSignatureUploadOptions {
  cloudName: string;
  uploadPreset: string;
  folder?: string;
  onUploadSuccess?: (result: CloudinaryUploadResult) => void;
  onUploadError?: (error: string) => void;
}

interface UseSignatureUploadReturn {
  uploadSignature: (dataUrl: string, customPublicId?: string) => Promise<CloudinaryUploadResult>;
  isUploading: boolean;
  uploadProgress: number;
  lastUploadResult: CloudinaryUploadResult | null;
  error: string | null;
  clearError: () => void;
}

export const useSignatureUpload = (options: UseSignatureUploadOptions): UseSignatureUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastUploadResult, setLastUploadResult] = useState<CloudinaryUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Cloudinary service
  const cloudinaryService = new CloudinaryService({
    cloudName: options.cloudName,
    uploadPreset: options.uploadPreset,
  });

  const uploadSignature = useCallback(async (
    dataUrl: string,
    customPublicId?: string
  ): Promise<CloudinaryUploadResult> => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Validate configuration
      const configValidation = cloudinaryService.validateConfig();
      if (!configValidation.isValid) {
        throw new Error(configValidation.error);
      }

      // Simulate upload progress (since we can't track actual progress with fetch)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Generate public ID if not provided
      const publicId = customPublicId || `signature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Upload to Cloudinary
      const result = await cloudinaryService.uploadSignature(dataUrl, {
        folder: options.folder || 'signatures',
        publicId,
        tags: ['signature', 'user-generated']
      });

      // Clear progress interval
      clearInterval(progressInterval);
      setUploadProgress(100);

      setLastUploadResult(result);

      if (result.success) {
        options.onUploadSuccess?.(result);
      } else {
        setError(result.error || 'Upload failed');
        options.onUploadError?.(result.error || 'Upload failed');
      }

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown upload error';
      setError(errorMessage);
      options.onUploadError?.(errorMessage);

      const failureResult: CloudinaryUploadResult = {
        success: false,
        error: errorMessage
      };

      setLastUploadResult(failureResult);
      return failureResult;

    } finally {
      setIsUploading(false);
      // Reset progress after a delay
      setTimeout(() => setUploadProgress(0), 2000);
    }
  }, [cloudinaryService, options]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    uploadSignature,
    isUploading,
    uploadProgress,
    lastUploadResult,
    error,
    clearError
  };
};

export default useSignatureUpload;