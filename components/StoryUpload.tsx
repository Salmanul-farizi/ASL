import React, { useState, useRef } from 'react';
import { MEDIA_LIMITS, formatFileSize, validateVideoDuration, getVideoDuration } from '../constants/mediaLimits';
import { MediaStory } from '../types';

interface StoryUploadProps {
  isAdmin: boolean;
  onUpload: (stories: MediaStory[]) => void;
  onClose: () => void;
}

const StoryUpload: React.FC<StoryUploadProps> = ({ isAdmin, onUpload, onClose }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; type: 'image' | 'video'; duration?: number }[]>([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getMaxFiles = () => {
    if (isAdmin) return { images: Infinity, videos: Infinity };
    return { images: MEDIA_LIMITS.MAX_IMAGES_PER_UPLOAD, videos: MEDIA_LIMITS.MAX_VIDEOS_PER_UPLOAD };
  };

  const getMaxSize = (type: 'image' | 'video') => {
    if (isAdmin) return Infinity;
    return type === 'image' ? MEDIA_LIMITS.MAX_IMAGE_SIZE : MEDIA_LIMITS.MAX_VIDEO_SIZE;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setError('');
    
    const limits = getMaxFiles();
    let imageCount = files.filter(f => f.type.startsWith('image')).length;
    let videoCount = files.filter(f => f.type.startsWith('video')).length;

    const newFiles: File[] = [];
    const newPreviews: { url: string; type: 'image' | 'video'; duration?: number }[] = [];

    for (const file of selectedFiles) {
      if (file.type.startsWith('image')) {
        // Image validation
        if (imageCount >= limits.images) {
          setError(`Max ${limits.images} images allowed`);
          continue;
        }
        if (file.size > getMaxSize('image')) {
          setError(`Image too large. Max ${formatFileSize(getMaxSize('image'))}`);
          continue;
        }
        imageCount++;
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push({ url: reader.result as string, type: 'image' });
          if (newPreviews.length === newFiles.length) setPreviews(prev => [...prev, ...newPreviews]);
        };
        reader.readAsDataURL(file);
        newFiles.push(file);
      } else if (file.type.startsWith('video')) {
        // Video validation
        if (videoCount >= limits.videos) {
          setError(`Max ${limits.videos} videos allowed`);
          continue;
        }
        if (file.size > getMaxSize('video')) {
          setError(`Video too large. Max ${formatFileSize(getMaxSize('video'))}`);
          continue;
        }
        const isValid = await validateVideoDuration(file);
        if (!isValid) {
          setError('Video exceeds 30 second limit');
          continue;
        }
        videoCount++;
        const duration = await getVideoDuration(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push({ url: reader.result as string, type: 'video', duration });
          if (newPreviews.length === newFiles.length) setPreviews(prev => [...prev, ...newPreviews]);
        };
        reader.readAsDataURL(file);
        newFiles.push(file);
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Select at least one image or video');
      return;
    }

    setUploading(true);
    const stories: MediaStory[] = [];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + MEDIA_LIMITS.STORY_EXPIRY_HOURS * 60 * 60 * 1000);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const preview = previews[i];
      const id = `story_${Date.now()}_${i}`;

      const story: MediaStory = {
        id,
        type: preview.type,
        mediaUrl: preview.url,
        duration: preview.duration,
        caption: caption || undefined,
        uploader: isAdmin ? 'admin' : 'public',
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      stories.push(story);
    }

    onUpload(stories);
    setFiles([]);
    setPreviews([]);
    setCaption('');
    setUploading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="sports-font text-2xl font-black text-white">Upload Story</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white text-2xl">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-[#D6FF32]/30 rounded-2xl p-8 text-center cursor-pointer hover:border-[#D6FF32]/60 transition-all"
          onClick={() => fileInputRef.current?.click()}>
          <i className="fa-solid fa-cloud-arrow-up text-4xl text-[#D6FF32]/40 mb-3"></i>
          <p className="text-white font-bold mb-1">Click to upload or drag files</p>
          <p className="text-white/50 text-sm">
            {isAdmin ? 'Unlimited files' : `Max ${MEDIA_LIMITS.MAX_IMAGES_PER_UPLOAD} images, ${MEDIA_LIMITS.MAX_VIDEOS_PER_UPLOAD} videos`}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation flex-shrink-0"></i>
            {error}
          </div>
        )}

        {/* Previews */}
        {previews.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-white/80 text-sm font-bold">Selected Files ({previews.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {previews.map((preview, idx) => (
                <div key={idx} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-slate-800">
                    {preview.type === 'image' ? (
                      <img src={preview.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <video src={preview.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <i className="fa-solid fa-play text-white text-2xl"></i>
                        </div>
                        {preview.duration && (
                          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-2 py-1 rounded">
                            {Math.floor(preview.duration)}s
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Caption */}
        <div>
          <label className="block text-sm font-bold text-white/80 mb-2">Caption (Optional)</label>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Add a caption to your story..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D6FF32]/50 resize-none"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-800/50 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="flex-1 bg-gradient-to-r from-[#D6FF32] to-[#b8e01f] text-[#280D62] font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-[#D6FF32]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {uploading ? (
              <>
                <i className="fa-solid fa-spinner animate-spin mr-2"></i>
                Uploading...
              </>
            ) : (
              <>
                <i className="fa-solid fa-arrow-up mr-2"></i>
                Upload ({files.length})
              </>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="text-xs text-white/40 space-y-1 border-t border-white/10 pt-4">
          <p>• Images: Max 2MB each</p>
          <p>• Videos: Max 10MB, 30 seconds</p>
          <p>• Stories expire after 24 hours</p>
        </div>
      </div>
    </div>
  );
};

export default StoryUpload;
