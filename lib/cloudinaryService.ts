/**
 * Cloudinary Service
 * Handles image uploads to Cloudinary
 */

export interface CloudinaryUploadResult {
    success: boolean;
    url?: string;
    publicId?: string;
    error?: string;
}

export interface CloudinaryConfig {
    cloudName: string;
    uploadPreset: string;
    apiKey?: string;
}

export class CloudinaryService {
    private config: CloudinaryConfig;

    constructor(config: CloudinaryConfig) {
        this.config = config;
    }

    /**
     * Upload signature image to Cloudinary
     * @param dataUrl - Base64 data URL of the signature
     * @param options - Additional upload options
     * @returns Promise with upload result
     */
    async uploadSignature(
        dataUrl: string,
        options: {
            folder?: string;
            publicId?: string;
            tags?: string[];
        } = {}
    ): Promise<CloudinaryUploadResult> {
        try {
            // Validate data URL
            if (!dataUrl || !dataUrl.startsWith('data:image/')) {
                return {
                    success: false,
                    error: 'Invalid image data URL'
                };
            }

            // Prepare form data
            const formData = new FormData();
            formData.append('file', dataUrl);
            formData.append('upload_preset', this.config.uploadPreset);

            // Add optional parameters
            if (options.folder) {
                formData.append('folder', options.folder);
            }

            if (options.publicId) {
                formData.append('public_id', options.publicId);
            }

            if (options.tags && options.tags.length > 0) {
                formData.append('tags', options.tags.join(','));
            }

            // Add signature-specific parameters
            formData.append('resource_type', 'image');
            formData.append('format', 'png');
            formData.append('quality', 'auto');

            // Upload to Cloudinary
            const uploadUrl = `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`;

            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: errorData.error?.message || `Upload failed with status ${response.status}`
                };
            }

            const result = await response.json();

            return {
                success: true,
                url: result.secure_url,
                publicId: result.public_id
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown upload error'
            };
        }
    }

    /**
     * Delete signature from Cloudinary
     * @param publicId - Public ID of the image to delete
     * @returns Promise with deletion result
     */
    async deleteSignature(publicId: string): Promise<{ success: boolean; error?: string }> {
        try {
            if (!this.config.apiKey) {
                return {
                    success: false,
                    error: 'API key required for deletion operations'
                };
            }

            // Note: Deletion requires server-side implementation with API secret
            // This is a placeholder for the client-side interface
            console.warn('Signature deletion should be implemented on the server side for security');

            return {
                success: false,
                error: 'Deletion must be implemented on server side'
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown deletion error'
            };
        }
    }

    /**
     * Generate optimized signature URL with transformations
     * @param publicId - Public ID of the uploaded signature
     * @param options - Transformation options
     * @returns Optimized URL
     */
    getOptimizedSignatureUrl(
        publicId: string,
        options: {
            width?: number;
            height?: number;
            quality?: string | number;
            format?: string;
            background?: string;
        } = {}
    ): string {
        const baseUrl = `https://res.cloudinary.com/${this.config.cloudName}/image/upload`;

        const transformations: string[] = [];

        if (options.width) {
            transformations.push(`w_${options.width}`);
        }

        if (options.height) {
            transformations.push(`h_${options.height}`);
        }

        if (options.quality) {
            transformations.push(`q_${options.quality}`);
        }

        if (options.format) {
            transformations.push(`f_${options.format}`);
        }

        if (options.background) {
            transformations.push(`b_${options.background}`);
        }

        // Add default optimizations for signatures
        transformations.push('c_fit'); // Fit within dimensions
        transformations.push('fl_preserve_transparency'); // Preserve transparency

        const transformationString = transformations.length > 0
            ? transformations.join(',') + '/'
            : '';

        return `${baseUrl}/${transformationString}${publicId}`;
    }

    /**
     * Validate Cloudinary configuration
     * @returns Validation result
     */
    validateConfig(): { isValid: boolean; error?: string } {
        if (!this.config.cloudName) {
            return {
                isValid: false,
                error: 'Cloud name is required'
            };
        }

        if (!this.config.uploadPreset) {
            return {
                isValid: false,
                error: 'Upload preset is required'
            };
        }

        return { isValid: true };
    }
}

// Default instance factory
export const createCloudinaryService = (config: CloudinaryConfig): CloudinaryService => {
    return new CloudinaryService(config);
};

export default CloudinaryService;