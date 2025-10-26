/**
 * Signature Processing Service
 * Handles signature processing, background transparency, and validation
 */

export interface SignatureProcessorResult {
  success: boolean;
  processedSignature?: string;
  error?: string;
}

export interface SignatureValidationResult {
  isValid: boolean;
  error?: string;
}

export class SignatureProcessor {
  /**
   * Process signature from canvas element to make background transparent
   * @param canvasElement - The canvas element containing the signature
   * @returns Promise with processed signature data URL or error
   */
  static async processSignature(canvasElement: HTMLCanvasElement): Promise<SignatureProcessorResult> {
    try {
      if (!canvasElement) {
        return {
          success: false,
          error: 'Canvas element is required'
        };
      }

      // Get canvas context
      const context = canvasElement.getContext('2d');
      if (!context) {
        return {
          success: false,
          error: 'Unable to get canvas context'
        };
      }

      // Create temporary canvas for processing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasElement.width;
      tempCanvas.height = canvasElement.height;
      
      const tempContext = tempCanvas.getContext('2d');
      if (!tempContext) {
        return {
          success: false,
          error: 'Unable to create temporary canvas context'
        };
      }

      // Copy original canvas to temporary canvas
      tempContext.drawImage(canvasElement, 0, 0);

      // Get image data for pixel manipulation
      const imageData = tempContext.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Make background transparent
      const processedImageData = this.makeBackgroundTransparent(imageData);
      
      // Put processed image data back to temporary canvas
      tempContext.putImageData(processedImageData, 0, 0);

      // Convert to data URL
      const processedSignature = tempCanvas.toDataURL('image/png');

      return {
        success: true,
        processedSignature
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown processing error'
      };
    }
  }

  /**
   * Make white background pixels transparent while preserving signature strokes
   * @param imageData - ImageData from canvas
   * @returns Modified ImageData with transparent background
   */
  static makeBackgroundTransparent(imageData: ImageData): ImageData {
    const data = imageData.data;
    const threshold = 240; // Threshold for considering a pixel as "white"

    // Iterate through each pixel (4 values per pixel: R, G, B, A)
    for (let i = 0; i < data.length; i += 4) {
      const red = data[i];
      const green = data[i + 1];
      const blue = data[i + 2];
      
      // Check if pixel is close to white
      if (red >= threshold && green >= threshold && blue >= threshold) {
        // Make pixel transparent
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      } else {
        // Preserve non-white pixels (signature strokes)
        // Ensure they are fully opaque
        data[i + 3] = 255;
      }
    }

    return imageData;
  }

  /**
   * Validate signature data
   * @param signatureData - Base64 data URL or URL string
   * @returns Validation result with success status and error message if invalid
   */
  static validateSignature(signatureData: string): SignatureValidationResult {
    try {
      // Check if signature data exists
      if (!signatureData || signatureData.trim() === '') {
        return {
          isValid: false,
          error: 'Signature data is empty'
        };
      }

      // Check if it's a valid data URL or URL
      if (signatureData.startsWith('data:image/')) {
        // Validate data URL format
        const dataUrlPattern = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
        if (!dataUrlPattern.test(signatureData)) {
          return {
            isValid: false,
            error: 'Invalid data URL format'
          };
        }

        // Check if base64 data exists after the header
        const base64Data = signatureData.split(',')[1];
        if (!base64Data || base64Data.length === 0) {
          return {
            isValid: false,
            error: 'No base64 data found in signature'
          };
        }

        // Validate base64 format
        try {
          atob(base64Data);
        } catch {
          return {
            isValid: false,
            error: 'Invalid base64 encoding'
          };
        }
      } else if (signatureData.startsWith('http')) {
        // Validate URL format
        try {
          new URL(signatureData);
        } catch {
          return {
            isValid: false,
            error: 'Invalid URL format'
          };
        }
      } else {
        return {
          isValid: false,
          error: 'Signature must be a data URL or valid URL'
        };
      }

      return {
        isValid: true
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }

  /**
   * Check if signature has meaningful content (not just empty canvas)
   * @param canvasElement - The canvas element to check
   * @returns True if canvas has meaningful signature content
   */
  static hasSignatureContent(canvasElement: HTMLCanvasElement): boolean {
    try {
      const context = canvasElement.getContext('2d');
      if (!context) return false;

      const imageData = context.getImageData(0, 0, canvasElement.width, canvasElement.height);
      const data = imageData.data;
      const threshold = 240;

      // Count non-white pixels
      let nonWhitePixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        
        if (red < threshold || green < threshold || blue < threshold) {
          nonWhitePixels++;
        }
      }

      // Consider signature valid if it has at least 10 non-white pixels
      // This helps filter out accidental dots or very minimal marks
      return nonWhitePixels >= 10;
    } catch {
      return false;
    }
  }

  /**
   * Get signature dimensions from data URL
   * @param dataUrl - Base64 data URL of the signature
   * @returns Promise with width and height, or null if unable to determine
   */
  static async getSignatureDimensions(dataUrl: string): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => {
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight
          });
        };
        img.onerror = () => {
          resolve(null);
        };
        img.src = dataUrl;
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Resize signature to fit within specified dimensions while maintaining aspect ratio
   * @param dataUrl - Original signature data URL
   * @param maxWidth - Maximum width
   * @param maxHeight - Maximum height
   * @returns Promise with resized signature data URL
   */
  static async resizeSignature(
    dataUrl: string, 
    maxWidth: number, 
    maxHeight: number
  ): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) {
            resolve(null);
            return;
          }

          // Calculate new dimensions maintaining aspect ratio
          const aspectRatio = img.width / img.height;
          let newWidth = maxWidth;
          let newHeight = maxHeight;

          if (aspectRatio > 1) {
            // Landscape
            newHeight = maxWidth / aspectRatio;
            if (newHeight > maxHeight) {
              newHeight = maxHeight;
              newWidth = maxHeight * aspectRatio;
            }
          } else {
            // Portrait or square
            newWidth = maxHeight * aspectRatio;
            if (newWidth > maxWidth) {
              newWidth = maxWidth;
              newHeight = maxWidth / aspectRatio;
            }
          }

          canvas.width = newWidth;
          canvas.height = newHeight;

          // Draw resized image
          context.drawImage(img, 0, 0, newWidth, newHeight);
          
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
          resolve(null);
        };
        img.src = dataUrl;
      } catch {
        resolve(null);
      }
    });
  }
}

export default SignatureProcessor;