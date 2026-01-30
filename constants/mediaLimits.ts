// Media upload limits configuration
export const MEDIA_LIMITS = {
  // GLOBAL limits for public users (lifetime total)
  PUBLIC_MAX_IMAGES_TOTAL: 5,           // 5 images total
  PUBLIC_MAX_VIDEOS_TOTAL: 2,           // 2 videos total

  // File Sizes (in bytes)
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,     // 10MB (increased for iPhone photos)
  MAX_VIDEO_SIZE: 50 * 1024 * 1024,     // 50MB

  // Video Duration (in seconds)
  MAX_VIDEO_DURATION: 30,

  // Storage Management
  MAX_ACTIVE_STORIES: 50,               // Max total active stories
  STORY_EXPIRY_HOURS: 24,               // Stories expire after 24h
  MAX_TOTAL_STORAGE: 500 * 1024 * 1024, // 500MB total storage
} as const;

// Storage key for tracking user uploads (legacy - kept for backwards compatibility)
export const USER_UPLOAD_KEY = 'asl_user_uploads';

// Dynamically count actual public uploads from stored data
export const getActualUploadCount = (): { images: number; videos: number } => {
  let images = 0;
  let videos = 0;

  try {
    // Count from stories
    const storiesData = localStorage.getItem('asl_media_stories');
    if (storiesData) {
      const stories = JSON.parse(storiesData);
      stories.forEach((story: any) => {
        if (story.uploader === 'public') {
          if (story.type === 'image') images++;
          else if (story.type === 'video') videos++;
        }
      });
    }

    // Count from posts (news) - posts from public users
    const newsData = localStorage.getItem('asl_news');
    if (newsData) {
      const posts = JSON.parse(newsData);
      // Posts are treated as images (they have an image property)
      posts.forEach((post: any) => {
        // Check if it's not an admin post (admin posts typically have specific markers)
        // For now, count all posts as public images since posts are created from the public upload flow
        if (post.image && post.image.startsWith('data:')) {
          images++;
        }
      });
    }
  } catch (e) {
    console.error('Error counting uploads:', e);
  }

  return { images, videos };
};

// Get user's upload count - now uses dynamic counting
export const getUserUploadCount = (): { images: number; videos: number } => {
  return getActualUploadCount();
};

// Save user's upload count to localStorage (legacy - now a no-op since we count dynamically)
export const saveUserUploadCount = (images: number, videos: number) => {
  // No-op: we now count dynamically from actual stored data
  // Keeping this function for backwards compatibility
};

// Check if user can upload more
export const canUserUpload = (type: 'image' | 'video'): boolean => {
  const counts = getActualUploadCount();
  if (type === 'image') {
    return counts.images < MEDIA_LIMITS.PUBLIC_MAX_IMAGES_TOTAL;
  }
  return counts.videos < MEDIA_LIMITS.PUBLIC_MAX_VIDEOS_TOTAL;
};

// Get remaining uploads
export const getRemainingUploads = (): { images: number; videos: number } => {
  const counts = getActualUploadCount();
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

// Device ID for tracking content ownership
const DEVICE_ID_KEY = 'asl_device_id';

// Generate a unique device ID
const generateDeviceId = (): string => {
  return 'device_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
};

// Get or create the device ID for this browser/device
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

// Check if the current device owns a piece of content
export const isContentOwner = (creatorId?: string): boolean => {
  if (!creatorId) return false; // Old content without creatorId - no one can delete
  return creatorId === getDeviceId();
};
