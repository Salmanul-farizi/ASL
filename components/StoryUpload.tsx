import React, { useState, useRef, useEffect } from 'react';
import { 
  MEDIA_LIMITS, 
  formatFileSize, 
  validateVideoDuration, 
  getVideoDuration,
  getUserUploadCount,
  saveUserUploadCount,
  getRemainingUploads
} from '../constants/mediaLimits';
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
  const [remaining, setRemaining] = useState(getRemainingUploads());
  
  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraError, setCameraError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setRemaining(getRemainingUploads());
  }, [files]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const getCurrentCounts = () => {
    const imageCount = files.filter(f => f.type.startsWith('image')).length;
    const videoCount = files.filter(f => f.type.startsWith('video')).length;
    return { imageCount, videoCount };
  };

  const canAddMore = (type: 'image' | 'video') => {
    if (isAdmin) return true;
    const { imageCount, videoCount } = getCurrentCounts();
    const userCounts = getUserUploadCount();
    
    if (type === 'image') {
      return (userCounts.images + imageCount) < MEDIA_LIMITS.PUBLIC_MAX_IMAGES_TOTAL;
    }
    return (userCounts.videos + videoCount) < MEDIA_LIMITS.PUBLIC_MAX_VIDEOS_TOTAL;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []) as File[];
    setError('');
    
    for (const file of selectedFiles) {
      if (file.type.startsWith('image')) {
        if (!canAddMore('image')) {
          setError(`You've reached your image limit (${MEDIA_LIMITS.PUBLIC_MAX_IMAGES_TOTAL} total)`);
          continue;
        }
        if (file.size > MEDIA_LIMITS.MAX_IMAGE_SIZE) {
          setError(`Image too large. Max ${formatFileSize(MEDIA_LIMITS.MAX_IMAGE_SIZE)}`);
          continue;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => [...prev, { url: reader.result as string, type: 'image' }]);
        };
        reader.readAsDataURL(file);
        setFiles(prev => [...prev, file]);
      } else if (file.type.startsWith('video')) {
        if (!canAddMore('video')) {
          setError(`You've reached your video limit (${MEDIA_LIMITS.PUBLIC_MAX_VIDEOS_TOTAL} total)`);
          continue;
        }
        if (file.size > MEDIA_LIMITS.MAX_VIDEO_SIZE) {
          setError(`Video too large. Max ${formatFileSize(MEDIA_LIMITS.MAX_VIDEO_SIZE)}`);
          continue;
        }
        const isValid = await validateVideoDuration(file);
        if (!isValid) {
          setError(`Video exceeds ${MEDIA_LIMITS.MAX_VIDEO_DURATION} second limit`);
          continue;
        }
        const duration = await getVideoDuration(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => [...prev, { url: reader.result as string, type: 'video', duration }]);
        };
        reader.readAsDataURL(file);
        setFiles(prev => [...prev, file]);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Camera functions
  const startCamera = async (mode: 'photo' | 'video') => {
    try {
      setCameraError('');
      
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera not supported on this device/browser. Try uploading from gallery instead.');
        return;
      }

      // Try with basic constraints first (iOS friendly)
      let constraints: MediaStreamConstraints = {
        video: true,
        audio: mode === 'video'
      };

      // Try to get camera with basic constraints first
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (basicErr) {
        // If basic fails, try with more specific constraints
        constraints = {
          video: { facingMode: { ideal: 'environment' } },
          audio: mode === 'video'
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setCameraMode(mode);
      setShowCamera(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      
      // More specific error messages
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please go to Settings > Safari > Camera and allow access.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera is in use by another app. Please close other apps using the camera.');
      } else if (err.name === 'OverconstrainedError') {
        setCameraError('Camera constraints not supported. Please try again.');
      } else if (err.name === 'SecurityError') {
        setCameraError('Camera requires HTTPS. Please use a secure connection.');
      } else {
        setCameraError(`Camera error: ${err.message || 'Unknown error'}. Try uploading from gallery.`);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setShowCamera(false);
    setIsRecording(false);
    setRecordingTime(0);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canAddMore('image')) {
      if (!canAddMore('image')) setError(`You've reached your image limit`);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setFiles(prev => [...prev, file]);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => [...prev, { url: reader.result as string, type: 'image' }]);
        };
        reader.readAsDataURL(blob);
      }
    }, 'image/jpeg', 0.9);

    stopCamera();
  };

  const startRecording = () => {
    if (!streamRef.current || !canAddMore('video')) {
      if (!canAddMore('video')) setError(`You've reached your video limit`);
      return;
    }

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `video_${Date.now()}.webm`, { type: 'video/webm' });
      
      setFiles(prev => [...prev, file]);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, { url: reader.result as string, type: 'video', duration: recordingTime }]);
      };
      reader.readAsDataURL(blob);

      stopCamera();
    };

    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= MEDIA_LIMITS.MAX_VIDEO_DURATION - 1) {
          // Auto-stop at 30 seconds
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
          }
          return prev + 1;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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

    const { imageCount, videoCount } = getCurrentCounts();

    for (let i = 0; i < files.length; i++) {
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

    // Update global upload count for public users
    if (!isAdmin) {
      const currentCounts = getUserUploadCount();
      saveUserUploadCount(
        currentCounts.images + imageCount,
        currentCounts.videos + videoCount
      );
    }

    onUpload(stories);
    setFiles([]);
    setPreviews([]);
    setCaption('');
    setUploading(false);
    onClose();
  };

  const userCounts = getUserUploadCount();
  const { imageCount, videoCount } = getCurrentCounts();
  const totalImagesAfter = userCounts.images + imageCount;
  const totalVideosAfter = userCounts.videos + videoCount;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      {/* Camera View */}
      {showCamera ? (
        <div className="bg-black rounded-3xl w-full max-w-lg overflow-hidden">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-[3/4] object-cover"
            />
            
            {/* Recording timer */}
            {isRecording && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2">
                <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                <span className="font-bold">{recordingTime}s / {MEDIA_LIMITS.MAX_VIDEO_DURATION}s</span>
              </div>
            )}

            {/* Camera controls */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6">
              <button
                onClick={stopCamera}
                className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
              
              {cameraMode === 'photo' ? (
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-[#D6FF32]"
                >
                  <i className="fa-solid fa-camera text-2xl text-[#280D62]"></i>
                </button>
              ) : (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${
                    isRecording ? 'bg-red-600 border-red-400' : 'bg-white border-[#D6FF32]'
                  }`}
                >
                  {isRecording ? (
                    <i className="fa-solid fa-stop text-2xl text-white"></i>
                  ) : (
                    <i className="fa-solid fa-video text-2xl text-[#280D62]"></i>
                  )}
                </button>
              )}
              
              <button
                onClick={() => setCameraMode(cameraMode === 'photo' ? 'video' : 'photo')}
                className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white"
                disabled={isRecording}
              >
                <i className={`fa-solid ${cameraMode === 'photo' ? 'fa-video' : 'fa-camera'} text-lg`}></i>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Upload Modal */
        <div className="glass-card rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="sports-font text-2xl font-black text-white">Upload Story</h2>
            <button onClick={onClose} className="text-white/50 hover:text-white text-2xl">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Global Limits Info (for public users) */}
          {!isAdmin && (
            <div className="bg-[#D6FF32]/10 border border-[#D6FF32]/30 rounded-xl p-4">
              <p className="text-[#D6FF32] text-sm font-bold mb-2">Your Upload Quota</p>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-white/60">Images: </span>
                  <span className={`font-bold ${totalImagesAfter >= MEDIA_LIMITS.PUBLIC_MAX_IMAGES_TOTAL ? 'text-red-400' : 'text-white'}`}>
                    {totalImagesAfter}/{MEDIA_LIMITS.PUBLIC_MAX_IMAGES_TOTAL}
                  </span>
                </div>
                <div>
                  <span className="text-white/60">Videos: </span>
                  <span className={`font-bold ${totalVideosAfter >= MEDIA_LIMITS.PUBLIC_MAX_VIDEOS_TOTAL ? 'text-red-400' : 'text-white'}`}>
                    {totalVideosAfter}/{MEDIA_LIMITS.PUBLIC_MAX_VIDEOS_TOTAL}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Camera & Upload Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Native camera capture for iOS - more reliable */}
            <label
              className={`flex items-center justify-center gap-2 bg-[#D6FF32]/10 hover:bg-[#D6FF32]/20 border border-[#D6FF32]/30 rounded-xl py-4 text-[#D6FF32] font-bold transition-all cursor-pointer ${!canAddMore('image') ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <i className="fa-solid fa-camera"></i>
              Take Photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                disabled={!canAddMore('image')}
                className="hidden"
              />
            </label>
            <label
              className={`flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl py-4 text-red-400 font-bold transition-all cursor-pointer ${!canAddMore('video') ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <i className="fa-solid fa-video"></i>
              Record Video
              <input
                type="file"
                accept="video/*"
                capture="environment"
                onChange={handleFileSelect}
                disabled={!canAddMore('video')}
                className="hidden"
              />
            </label>
          </div>

          {/* Upload Area */}
          <div 
            className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer hover:border-[#D6FF32]/40 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <i className="fa-solid fa-cloud-arrow-up text-4xl text-white/30 mb-3"></i>
            <p className="text-white font-bold mb-1">Or upload from gallery</p>
            <p className="text-white/50 text-sm">
              {isAdmin ? 'Unlimited uploads' : `${remaining.images} images, ${remaining.videos} videos remaining`}
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
          {(error || cameraError) && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation flex-shrink-0"></i>
              {error || cameraError}
            </div>
          )}

          {/* Previews */}
          {previews.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-white/80 text-sm font-bold">Selected ({previews.length})</h3>
              <div className="grid grid-cols-3 gap-3">
                {previews.map((preview, idx) => (
                  <div key={idx} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-slate-800">
                      {preview.type === 'image' ? (
                        <img src={preview.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <video src={preview.url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <i className="fa-solid fa-play text-white text-xl"></i>
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
              placeholder="Add a caption..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D6FF32]/50 resize-none"
              rows={2}
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
            <p>• Videos: Max 10MB, {MEDIA_LIMITS.MAX_VIDEO_DURATION} seconds</p>
            <p>• Stories expire after 24 hours</p>
            {!isAdmin && <p>• Public limit: {MEDIA_LIMITS.PUBLIC_MAX_IMAGES_TOTAL} images, {MEDIA_LIMITS.PUBLIC_MAX_VIDEOS_TOTAL} videos total</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryUpload;
