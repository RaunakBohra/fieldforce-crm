/**
 * Compress image to target size (default 200KB)
 * @param dataUrl - Base64 data URL of the image
 * @param maxSizeKB - Maximum size in KB (default 200)
 * @returns Compressed image as base64 data URL
 */
export async function compressImage(
  dataUrl: string,
  maxSizeKB: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Calculate new dimensions (max 1920x1080 for quality/size balance)
      let { width, height } = img;
      const maxDimension = 1920;

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

      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Try different quality levels to hit target size
      let quality = 0.9;
      let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

      // Calculate size (base64 to KB: (length * 3/4) / 1024)
      const getSize = (base64: string) => {
        const base64Length = base64.split(',')[1].length;
        return (base64Length * 3/4) / 1024; // Size in KB
      };

      // Binary search for optimal quality
      let minQuality = 0.1;
      let maxQuality = 0.9;
      let iterations = 0;
      const maxIterations = 10;

      while (getSize(compressedDataUrl) > maxSizeKB && iterations < maxIterations) {
        maxQuality = quality;
        quality = (minQuality + maxQuality) / 2;
        compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        if (getSize(compressedDataUrl) < maxSizeKB) {
          minQuality = quality;
        }

        iterations++;
      }

      // If still too large, reduce dimensions
      if (getSize(compressedDataUrl) > maxSizeKB) {
        canvas.width = width * 0.8;
        canvas.height = height * 0.8;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      }

      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = dataUrl;
  });
}

/**
 * Convert base64 data URL to File object
 * @param dataUrl - Base64 data URL
 * @param filename - Desired filename
 * @returns File object
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

/**
 * Get image size in KB from data URL
 * @param dataUrl - Base64 data URL
 * @returns Size in KB
 */
export function getImageSizeKB(dataUrl: string): number {
  const base64Length = dataUrl.split(',')[1].length;
  return (base64Length * 3/4) / 1024;
}
