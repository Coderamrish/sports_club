import imageCompression from 'browser-image-compression';

/**
 * Compress an image file before upload
 * Maintains 70-80% quality, resizes to max 1024px width
 *
 * @param {File} file - The image file to compress
 * @param {Function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<{file: File, wasCompressed: boolean, originalSize: number, compressedSize: number}>}
 */
export const compressImage = async (file, onProgress = null) => {
  const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  if (!IMAGE_TYPES.includes(file.type)) {
    return { file, wasCompressed: false, originalSize: file.size, compressedSize: file.size };
  }

  const originalSize = file.size;
  const MAX_SIZE_MB = 1; // 1 MB target

  // Only compress if over 500KB
  if (originalSize <= 500 * 1024) {
    return { file, wasCompressed: false, originalSize, compressedSize: originalSize };
  }

  const options = {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
    initialQuality: 0.8, // 80% quality
    onProgress,
  };

  try {
    const compressedFile = await imageCompression(file, options);

    // Preserve original filename
    const compressedWithName = new File([compressedFile], file.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });

    return {
      file: compressedWithName,
      wasCompressed: true,
      originalSize,
      compressedSize: compressedWithName.size,
      savings: Math.round((1 - compressedWithName.size / originalSize) * 100),
    };
  } catch (error) {
    console.warn('Image compression failed, using original:', error);
    return { file, wasCompressed: false, originalSize, compressedSize: originalSize };
  }
};

/**
 * Format file size to human-readable string
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Validate file before upload
 */
export const validateFile = (file, type = 'image') => {
  const rules = {
    image: {
      types: ['image/jpeg', 'image/jpg', 'image/png'],
      maxSize: 1 * 1024 * 1024,
      label: 'Image',
      hint: 'JPG or PNG, max 1 MB',
    },
    document: {
      types: ['application/pdf'],
      maxSize: 2 * 1024 * 1024,
      label: 'Document',
      hint: 'PDF only, max 2 MB',
    },
    any: {
      types: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
      maxSize: 2 * 1024 * 1024,
      label: 'File',
      hint: 'JPG, PNG, or PDF — max 2 MB',
    },
  };

  const rule = rules[type] || rules.any;

  if (!rule.types.includes(file.type)) {
    return { valid: false, error: `Invalid file type. Allowed: ${rule.hint}` };
  }

  if (file.size > rule.maxSize) {
    return { valid: false, error: `File too large. ${rule.hint}` };
  }

  return { valid: true };
};
