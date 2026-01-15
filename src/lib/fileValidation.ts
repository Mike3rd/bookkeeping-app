export const validateFile = (file: File, maxSizeMB = 5) => {
  const maxSize = maxSizeMB * 1024 * 1024;

  // Allowed types
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "File type not supported. Please upload JPG, PNG, or PDF files.",
    };
  }

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${maxSizeMB}MB.`,
    };
  }

  return { valid: true, error: null };
};

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
