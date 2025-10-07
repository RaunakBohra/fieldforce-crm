/**
 * Image Compression Utility
 * Compresses images to max 200KB and generates 300x300 thumbnails
 * Uses Canvas API for browser-side compression
 */

export interface CompressedImage {
  fullImage: Buffer;
  thumbnail: Buffer;
  fullSize: number; // Size in bytes
  thumbSize: number;
  format: string; // 'jpeg' or 'png'
}

/**
 * Compress image to target size and generate thumbnail
 * @param imageBuffer - Original image buffer
 * @param maxSizeKB - Maximum file size in KB (default: 200)
 * @param thumbnailSize - Thumbnail dimension in pixels (default: 300)
 * @returns Promise<CompressedImage> - Compressed full image + thumbnail
 */
export async function compressImage(
  imageBuffer: Buffer,
  maxSizeKB: number = 200,
  thumbnailSize: number = 300
): Promise<CompressedImage> {
  // This will be implemented server-side using sharp library
  // For now, return a placeholder
  // TODO: Install sharp library for image processing

  throw new Error('Image compression not yet implemented - requires sharp library');
}

/**
 * Browser-side image compression (for frontend)
 * This function generates a data URL that can be uploaded to backend
 * @param file - File object from input
 * @param maxSizeKB - Max size in KB
 * @returns Promise<{dataUrl: string, size: number}>
 */
export function compressImageInBrowser(
  file: File,
  maxSizeKB: number = 200
): Promise<{ dataUrl: string; size: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Calculate dimensions to maintain aspect ratio
        let width = img.width;
        let height = img.height;
        const maxDimension = 1920; // Max width/height

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels to hit target size
        let quality = 0.9;
        let dataUrl = '';
        let size = 0;

        const tryCompress = () => {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          // Calculate size from base64 (rough estimate)
          size = Math.round((dataUrl.length * 3) / 4 / 1024); // KB

          if (size > maxSizeKB && quality > 0.1) {
            quality -= 0.1;
            tryCompress();
          } else {
            resolve({
              dataUrl,
              size: size * 1024, // Convert to bytes
              width,
              height,
            });
          }
        };

        tryCompress();
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Generate thumbnail from image data URL
 * @param dataUrl - Base64 data URL
 * @param size - Thumbnail size (default: 300x300)
 * @returns Promise<string> - Thumbnail data URL
 */
export function generateThumbnail(dataUrl: string, size: number = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Calculate dimensions for square crop
      const sourceSize = Math.min(img.width, img.height);
      const sourceX = (img.width - sourceSize) / 2;
      const sourceY = (img.height - sourceSize) / 2;

      canvas.width = size;
      canvas.height = size;

      // Draw cropped and resized image
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        size,
        size
      );

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };

    img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
    img.src = dataUrl;
  });
}
