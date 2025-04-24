import imageCompression from 'browser-image-compression';

interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker?: boolean;
  preserveExif?: boolean;
}

/**
 * Compresses an image file using browser-image-compression
 * @param file The image file to compress
 * @param options Compression options
 * @returns Promise<File> A compressed image file
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions
): Promise<File> => {
  const defaultOptions = {
    useWebWorker: true,
    preserveExif: true,
  };

  try {
    return await imageCompression(file, {
      ...defaultOptions,
      ...options,
    });
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
}; 