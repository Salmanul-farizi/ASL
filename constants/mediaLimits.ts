// Media upload limits configuration
export const MEDIA_LIMITS = {
  // Per Upload Session
  MAX_IMAGES_PER_UPLOAD: 5,
  MAX_VIDEOS_PER_UPLOAD: 2,
  
  // File Sizes (in bytes)
  MAX_IMAGE_SIZE: 2 * 1024 * 1024,      // 2MB
  MAX_VIDEO_SIZE: 10 * 1024 * 1024,     // 10MB
  
  // Video Duration (in seconds)
  MAX_VIDEO_DURATION: 30,
  
  // Storage Management
  MAX_ACTIVE_STORIES: 50,               // Max total active stories
  STORY_EXPIRY_HOURS: 24,               // Stories expire after 24h
  MAX_TOTAL_STORAGE: 100 * 1024 * 1024, // 100MB total storage
} as const;

// Helper to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Helper to validate video duration
export const validateVideoDuration = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration <= MEDIA_LIMITS.MAX_VIDEO_DURATION);
    };
    video.onerror = () => resolve(false);
    video.src = URL.createObjectURL(file);
  });
};

// Helper to get video duration
export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });
};
