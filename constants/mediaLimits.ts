// Media upload limits configuration
export const MEDIA_LIMITS = {
  // GLOBAL limits for public users (lifetime total)
  PUBLIC_MAX_IMAGES_TOTAL: 5,           // 5 images total
  PUBLIC_MAX_VIDEOS_TOTAL: 2,           // 2 videos total
  
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

// Storage key for tracking user uploads
export const USER_UPLOAD_KEY = 'asl_user_uploads';

// Get user's upload count from localStorage
export const getUserUploadCount = (): { images: number; videos: number } => {
  const data = localStorage.getItem(USER_UPLOAD_KEY);
  if (!data) return { images: 0, videos: 0 };
  return JSON.parse(data);
};

// Save user's upload count to localStorage
export const saveUserUploadCount = (images: number, videos: number) => {
  localStorage.setItem(USER_UPLOAD_KEY, JSON.stringify({ images, videos }));
};

// Check if user can upload more
export const canUserUpload = (type: 'image' | 'video'): boolean => {
  const counts = getUserUploadCount();
  if (type === 'image') {
    return counts.images < MEDIA_LIMITS.PUBLIC_MAX_IMAGES_TOTAL;
  }
  return counts.videos < MEDIA_LIMITS.PUBLIC_MAX_VIDEOS_TOTAL;
};

// Get remaining uploads
export const getRemainingUploads = (): { images: number; videos: number } => {
  const counts = getUserUploadCount();
  return {
    images: Math.max(0, MEDIA_LIMITS.PUBLIC_MAX_IMAGES_TOTAL - counts.images),
    videos: Math.max(0, MEDIA_LIMITS.PUBLIC_MAX_VIDEOS_TOTAL - counts.videos)
  };
};

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
