# ASL Backend Integration Guide

> **For Backend Developers**
> This document outlines the temporary frontend-only implementations that should be replaced with proper backend solutions.

---

## Table of Contents

1. [Current Architecture](#current-architecture)
2. [Data Storage](#data-storage)
3. [User Identification & Ownership](#user-identification--ownership)
4. [Image Compression](#image-compression)
5. [Upload Limits](#upload-limits)
6. [Media Management](#media-management)
7. [API Endpoints Needed](#api-endpoints-needed)
8. [Migration Strategy](#migration-strategy)

---

## Current Architecture

The app currently uses **localStorage** for all data persistence. This is a temporary solution with several limitations:

| Storage Key | Purpose | Size Risk |
|-------------|---------|-----------|
| `asl_tournaments` | Tournament data | Low |
| `asl_teams` | Team information | Low |
| `asl_players` | Player data with photos | Medium |
| `asl_matches` | Match schedules & scores | Low |
| `asl_goals` | Goal records | Low |
| `asl_news` | Posts (with base64 images) | **HIGH** |
| `asl_media_stories` | Stories (with base64 images/videos) | **HIGH** |
| `asl_device_id` | Unique device identifier | Low |

**Total localStorage limit**: ~5-10MB (browser dependent)

---

## Data Storage

### Current Implementation
All data is stored as JSON strings in localStorage via `services/dataStore.ts`.

### What Backend Should Provide
- RESTful API or GraphQL endpoints
- Database storage (PostgreSQL/MongoDB recommended)
- File storage service (AWS S3, Cloudinary, or company server)
- Real-time updates (WebSocket for live matches)

---

## User Identification & Ownership

### Current Implementation (Frontend-Only)
Located in: `constants/mediaLimits.ts`

```typescript
// Device ID is generated once and stored in localStorage
const DEVICE_ID_KEY = 'asl_device_id';

export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = 'device_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

export const isContentOwner = (creatorId?: string): boolean => {
  if (!creatorId) return false;
  return creatorId === getDeviceId();
};
```

### Data Structure
Posts and Stories have these ownership fields:
```typescript
interface NewsPost {
  id: string;
  image: string;           // Base64 or URL
  caption: string;
  createdAt: string;
  likes: number;
  creatorId?: string;      // Device ID of creator
  uploaderName?: string;   // Optional display name
}

interface MediaStory {
  id: string;
  type: 'image' | 'video';
  mediaUrl: string;        // Base64 or URL
  uploader: string;        // 'admin' or 'public'
  creatorId?: string;      // Device ID of creator
  uploaderName?: string;   // Optional display name
  expiresAt: string;       // 24h expiry for stories
  // ... other fields
}
```

### Security Issues
⚠️ **CRITICAL**: Current ownership system is CLIENT-SIDE ONLY
- Users can modify localStorage to impersonate others
- Device ID can be copied/shared
- No authentication or authorization

### Backend Should Implement
1. **User Authentication**
   - Login/Signup (email, phone, or OAuth)
   - JWT or session-based auth
   - Admin vs Public user roles

2. **Content Authorization**
   - Store `userId` with each post/story in database
   - Verify ownership on delete requests server-side
   - Admin override capability

3. **API Example**
   ```
   DELETE /api/posts/:id
   Headers: Authorization: Bearer <token>
   
   Server checks: request.user.id === post.creatorId || request.user.isAdmin
   ```

---

## Image Compression

### Current Implementation
Located in: `components/StoryUpload.tsx`

```typescript
const compressImage = (dataUrl: string, maxWidth: number, quality: number): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
};

// Usage: compress to 800px width, 70% quality
mediaUrl = await compressImage(preview.url, 800, 0.7);
```

### Why This Exists
- localStorage has ~5-10MB limit
- Base64 images are 33% larger than binary
- Multiple posts quickly fill storage

### Backend Should Implement
1. **Server-side image processing**
   - Accept multipart/form-data uploads
   - Use Sharp, ImageMagick, or similar for compression
   - Generate thumbnails for listings
   - Store original + compressed versions

2. **CDN Integration**
   - Store images on CDN (Cloudinary, AWS S3, etc.)
   - Return URLs instead of base64
   - Lazy loading support

3. **Upload Flow**
   ```
   Frontend                    Backend
   ─────────                   ─────────
   Select image    ────────►   Receive file
                               ↓
                               Validate (size, type)
                               ↓
                               Compress/resize
                               ↓
                               Upload to CDN
                               ↓
   Receive URL     ◄────────   Return { url, thumbnailUrl }
   ```

---

## Upload Limits

### Current Implementation
Located in: `constants/mediaLimits.ts`

```typescript
export const MEDIA_LIMITS = {
  PUBLIC_MAX_IMAGES_TOTAL: 5,    // 5 images total per user
  PUBLIC_MAX_VIDEOS_TOTAL: 2,    // 2 videos total per user
  MAX_FILE_SIZE: 5 * 1024 * 1024,         // 5MB per file
  MAX_VIDEO_DURATION: 30,                  // 30 seconds
  STORY_EXPIRY_HOURS: 24,                  // 24h story lifetime
} as const;

// Dynamic counting from localStorage
export const getActualUploadCount = (): { images: number; videos: number } => {
  let images = 0;
  let videos = 0;
  
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
  
  // Count from posts
  const newsData = localStorage.getItem('asl_news');
  if (newsData) {
    const posts = JSON.parse(newsData);
    posts.forEach((post: any) => {
      if (post.image && post.image.startsWith('data:')) {
        images++;
      }
    });
  }
  
  return { images, videos };
};
```

### Backend Should Implement
1. **Per-user upload quotas in database**
   ```sql
   CREATE TABLE user_quotas (
     user_id UUID PRIMARY KEY,
     images_used INT DEFAULT 0,
     videos_used INT DEFAULT 0,
     storage_used_bytes BIGINT DEFAULT 0,
     max_images INT DEFAULT 5,
     max_videos INT DEFAULT 2,
     max_storage_bytes BIGINT DEFAULT 52428800  -- 50MB
   );
   ```

2. **Quota enforcement on upload**
   - Check quota BEFORE accepting upload
   - Update quota AFTER successful upload
   - Decrement quota on delete

3. **Admin exemption**
   - Admins have unlimited or higher quotas
   - Configurable limits per user role

---

## Media Management

### Stories (24h Expiry)

**Current Implementation:**
- `expiresAt` field set to `now + 24 hours`
- Frontend filters expired stories on load
- No automatic cleanup

**Backend Should Implement:**
- Cron job to delete expired stories
- Clean up associated media files
- Archive important stories if needed

### Posts

**Current Implementation:**
- Permanent posts stored in `asl_news`
- Likes stored as count only (no user tracking)
- No unlike capability (one like per session)

**Backend Should Implement:**
- Like/unlike with user tracking
- Post analytics (views, engagement)
- Content moderation queue
- Report functionality

---

## API Endpoints Needed

### Authentication
```
POST   /api/auth/register     - User registration
POST   /api/auth/login        - User login
POST   /api/auth/logout       - User logout
GET    /api/auth/me           - Get current user
```

### Media
```
POST   /api/upload            - Upload image/video (multipart)
DELETE /api/upload/:id        - Delete uploaded file
```

### Posts
```
GET    /api/posts             - List posts (paginated)
POST   /api/posts             - Create post
GET    /api/posts/:id         - Get single post
DELETE /api/posts/:id         - Delete post (auth required)
POST   /api/posts/:id/like    - Like post
DELETE /api/posts/:id/like    - Unlike post
```

### Stories
```
GET    /api/stories           - List active stories
POST   /api/stories           - Create story
DELETE /api/stories/:id       - Delete story (auth required)
```

### Admin
```
GET    /api/admin/posts       - All posts (including flagged)
DELETE /api/admin/posts/:id   - Admin delete any post
GET    /api/admin/users       - User management
```

---

## Migration Strategy

### Phase 1: Backend Setup
1. Set up database schema
2. Create API endpoints
3. Set up file storage (S3/company server)
4. Implement authentication

### Phase 2: Hybrid Mode
1. Keep localStorage as fallback
2. Add API calls alongside localStorage
3. Sync data to server when online
4. Migrate existing data

### Phase 3: Full Backend
1. Remove localStorage dependency for media
2. Keep localStorage only for:
   - User preferences
   - Draft content
   - Offline queue
3. All data from API

### Data Migration Script (Example)
```javascript
// Run once per user to migrate localStorage data to server
async function migrateUserData() {
  const posts = JSON.parse(localStorage.getItem('asl_news') || '[]');
  const stories = JSON.parse(localStorage.getItem('asl_media_stories') || '[]');
  const deviceId = localStorage.getItem('asl_device_id');
  
  for (const post of posts) {
    if (post.creatorId === deviceId) {
      // This user's content - upload to server
      await api.post('/migrate/post', {
        ...post,
        image: post.image // Backend handles base64 to file conversion
      });
    }
  }
  
  // Clear migrated data
  // localStorage.removeItem('asl_news');
}
```

---

## Files to Modify for Backend Integration

| File | Changes Needed |
|------|----------------|
| `services/dataStore.ts` | Replace localStorage with API calls |
| `constants/mediaLimits.ts` | Remove device ID, add auth token handling |
| `components/StoryUpload.tsx` | Upload to server instead of localStorage |
| `components/PublicNews.tsx` | Fetch from API, handle auth for delete |
| `types.ts` | Add user-related types |

---

## Environment Variables Needed

```env
# API Configuration
VITE_API_URL=https://api.asl.aufait.com
VITE_UPLOAD_URL=https://upload.asl.aufait.com

# Optional: Feature Flags
VITE_USE_LOCAL_STORAGE=false
VITE_ENABLE_OFFLINE_MODE=true
```

---

## Contact

For questions about this guide or the current implementation:
- **Frontend Team**: [Your contact]
- **Last Updated**: January 31, 2026

---

*This document should be updated as backend integration progresses.*
