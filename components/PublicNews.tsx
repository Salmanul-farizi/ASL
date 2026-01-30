
import React, { useState, useEffect, useRef } from 'react';
import { dataStore } from '../services/dataStore';
import { NewsPost, MediaStory } from '../types';
import StoryUpload from './StoryUpload';
import { getDeviceId, isContentOwner } from '../constants/mediaLimits';

interface PublicNewsProps {
  isAdmin?: boolean;
}

const PublicNews: React.FC<PublicNewsProps> = ({ isAdmin = false }) => {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [stories, setStories] = useState<MediaStory[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showStoryUpload, setShowStoryUpload] = useState(false);
  const [showPostUpload, setShowPostUpload] = useState(false);
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [showTagPopup, setShowTagPopup] = useState<string | null>(null);  // Post ID of visible tag popup
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const STORY_DURATION = 5000; // 5 seconds for images

  useEffect(() => {
    setPosts(dataStore.getNews());
    setStories(dataStore.getMediaStories());
  }, []);

  // Story auto-advance logic
  useEffect(() => {
    if (viewingStoryIndex === null) return;

    const currentStory = stories[viewingStoryIndex];
    if (!currentStory) {
      setViewingStoryIndex(null);
      return;
    }

    // Clear any existing timer
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }

    setStoryProgress(0);

    if (currentStory.type === 'image') {
      // For images, use timer
      const startTime = Date.now();
      progressTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / STORY_DURATION) * 100, 100);
        setStoryProgress(progress);

        if (progress >= 100) {
          goToNextStory();
        }
      }, 50);
    }

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, [viewingStoryIndex, stories]);

  const goToNextStory = () => {
    if (viewingStoryIndex === null) return;

    if (viewingStoryIndex < stories.length - 1) {
      setViewingStoryIndex(viewingStoryIndex + 1);
    } else {
      // No more stories, close
      setViewingStoryIndex(null);
    }
  };

  const goToPrevStory = () => {
    if (viewingStoryIndex === null) return;

    if (viewingStoryIndex > 0) {
      setViewingStoryIndex(viewingStoryIndex - 1);
    }
  };

  const handleVideoEnded = () => {
    goToNextStory();
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setStoryProgress(progress);
    }
  };

  const openStory = (index: number) => {
    setViewingStoryIndex(index);
  };

  const closeStory = () => {
    setViewingStoryIndex(null);
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }
  };

  const handleLike = (postId: string) => {
    const allPosts = dataStore.getNews();
    const isLiked = likedPosts.has(postId);

    const updated = allPosts.map(p =>
      p.id === postId
        ? { ...p, likes: isLiked ? p.likes - 1 : p.likes + 1 }
        : p
    );
    dataStore.saveNews(updated);
    setPosts(updated);

    const newLiked = new Set(likedPosts);
    if (isLiked) {
      newLiked.delete(postId);
    } else {
      newLiked.add(postId);
    }
    setLikedPosts(newLiked);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  const handleUploadStories = (uploadedStories: MediaStory[]) => {
    for (const story of uploadedStories) {
      dataStore.addMediaStory(story);
    }
    setStories(dataStore.getMediaStories());
  };

  const handleUploadPost = (uploadedStories: MediaStory[]) => {
    // Convert story to permanent post
    const news = dataStore.getNews();
    for (const story of uploadedStories) {
      const newPost: NewsPost = {
        id: `post_${Date.now()}_${Math.random()}`,
        image: story.mediaUrl,
        caption: story.caption || '',
        createdAt: new Date().toISOString(),
        likes: 0,
        creatorId: story.creatorId || getDeviceId(),  // Track who created this post
        uploaderName: story.uploaderName,  // Optional uploader name for tagging
      };
      news.unshift(newPost);
    }
    dataStore.saveNews(news);
    setPosts(dataStore.getNews());
  };

  const handleDeleteStory = (storyId: string) => {
    if (!confirm('Delete this story?')) return;
    const allStories = dataStore.getMediaStories();
    const updated = allStories.filter(s => s.id !== storyId);
    dataStore.saveMediaStories(updated);
    setStories(updated);

    // Move to next story or close if none left
    if (viewingStoryIndex !== null) {
      if (updated.length === 0) {
        setViewingStoryIndex(null);
      } else if (viewingStoryIndex >= updated.length) {
        setViewingStoryIndex(updated.length - 1);
      }
    }
  };

  const handleDeletePost = (postId: string) => {
    if (!confirm('Delete this post?')) return;
    const allPosts = dataStore.getNews();
    const updated = allPosts.filter(p => p.id !== postId);
    dataStore.saveNews(updated);
    setPosts(updated);
  };

  const currentStory = viewingStoryIndex !== null ? stories[viewingStoryIndex] : null;

  return (
    <div className="space-y-6 pb-10">
      {/* Stories Section - Circle Style */}
      <div className="px-2">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {/* Add Story Button */}
          <div
            onClick={() => setShowStoryUpload(true)}
            className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D6FF32]/20 to-[#D6FF32]/5 border-2 border-dashed border-[#D6FF32]/50 flex items-center justify-center hover:border-[#D6FF32] transition-all">
              <i className="fa-solid fa-plus text-[#D6FF32] text-lg"></i>
            </div>
            <span className="text-[10px] text-white/60 font-medium">Add Story</span>
          </div>

          {/* Stories */}
          {stories.map((story, index) => (
            <div
              key={story.id}
              onClick={() => openStory(index)}
              className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-[#D6FF32] to-[#b8e01f]">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#280D62]">
                  {story.type === 'image' ? (
                    <img src={story.mediaUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  ) : (
                    <video src={story.mediaUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" muted />
                  )}
                </div>
              </div>
              <span className="text-[10px] text-white/60 font-medium truncate w-16 text-center">
                {story.uploader === 'admin' ? 'ASL' : 'User'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Instagram-style Story Viewer Modal */}
      {currentStory && (
        <div className="fixed inset-0 bg-black z-50">
          {/* Progress bars for all stories */}
          <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
            {stories.map((_, idx) => (
              <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-100"
                  style={{
                    width: idx < viewingStoryIndex! ? '100%' :
                      idx === viewingStoryIndex ? `${storyProgress}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-6 left-4 right-4 z-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D6FF32] to-[#b8e01f] flex items-center justify-center">
                <i className="fa-solid fa-user text-[#280D62] text-xs"></i>
              </div>
              <span className="text-white text-sm font-medium">
                {currentStory.uploader === 'admin' ? 'ASL Official' : 'User'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {(isAdmin || isContentOwner(currentStory.creatorId)) && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteStory(currentStory.id); }}
                  className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-red-400"
                >
                  <i className="fa-solid fa-trash text-sm"></i>
                </button>
              )}
              <button
                onClick={closeStory}
                className="w-8 h-8 flex items-center justify-center text-white"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
          </div>

          {/* Touch areas for prev/next */}
          <div className="absolute inset-0 flex z-10">
            <div className="w-1/3 h-full" onClick={goToPrevStory} />
            <div className="w-1/3 h-full" />
            <div className="w-1/3 h-full" onClick={goToNextStory} />
          </div>

          {/* Media content - full screen */}
          <div className="absolute inset-0 flex items-center justify-center">
            {currentStory.type === 'image' ? (
              <img
                src={currentStory.mediaUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                src={currentStory.mediaUrl}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted={false}
                onEnded={handleVideoEnded}
                onTimeUpdate={handleVideoTimeUpdate}
                style={{
                  objectFit: 'cover',
                  // Hide all video controls
                  pointerEvents: 'none'
                }}
              />
            )}
          </div>

          {/* Caption */}
          {currentStory.caption && (
            <div className="absolute bottom-8 left-4 right-4 z-20">
              <p className="text-white text-base font-medium text-center">
                {currentStory.caption}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Story Upload Modal */}
      {showStoryUpload && (
        <StoryUpload
          isAdmin={isAdmin}
          onUpload={handleUploadStories}
          onClose={() => setShowStoryUpload(false)}
          mode="story"
        />
      )}

      {/* Post Upload Modal */}
      {showPostUpload && (
        <StoryUpload
          isAdmin={isAdmin}
          onUpload={handleUploadPost}
          onClose={() => setShowPostUpload(false)}
          mode="post"
        />
      )}

      {/* Posts Feed */}
      <div className="space-y-6 px-2">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#D6FF32]/10 to-[#280D62]/20 rounded-full flex items-center justify-center border border-[#D6FF32]/20">
              <i className="fa-solid fa-image text-xl text-[#D6FF32]"></i>
            </div>
            <h3 className="sports-font text-lg font-bold text-white/60 mb-2">No Posts Yet</h3>
            <p className="text-white/40 text-sm">Be the first to share a moment!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="glass-card rounded-2xl overflow-hidden border border-white/5">
              {/* Post Header */}
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#D6FF32] to-[#b8e01f] rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-user text-[#280D62] text-sm"></i>
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">ASL</p>
                  <p className="text-white/40 text-xs">{formatTimeAgo(post.createdAt)}</p>
                </div>
                {(isAdmin || isContentOwner(post.creatorId)) && (
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-white/40 hover:text-red-400 transition-all"
                  >
                    <i className="fa-solid fa-trash text-xs"></i>
                  </button>
                )}
              </div>

              {/* Post Image */}
              <div className="relative">
                <img
                  src={post.image}
                  alt=""
                  className="w-full aspect-square object-cover"
                  onDoubleClick={() => handleLike(post.id)}
                />
                {/* Tag icon - shows uploader name */}
                {post.uploaderName && (
                  <div className="absolute bottom-3 left-3">
                    <button
                      onClick={() => setShowTagPopup(showTagPopup === post.id ? null : post.id)}
                      className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all"
                    >
                      <i className="fa-solid fa-user-tag text-xs"></i>
                    </button>
                    {/* Tooltip popup */}
                    {showTagPopup === post.id && (
                      <div
                        className="absolute bottom-12 left-0 bg-black/90 backdrop-blur-md rounded-xl px-4 py-2 shadow-xl border border-white/10 animate-in fade-in zoom-in duration-200"
                        onClick={() => setShowTagPopup(null)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-[#D6FF32] to-[#b8e01f] rounded-full flex items-center justify-center">
                            <i className="fa-solid fa-user text-[#280D62] text-[8px]"></i>
                          </div>
                          <span className="text-white text-sm font-medium whitespace-nowrap">{post.uploaderName}</span>
                        </div>
                        {/* Arrow pointer */}
                        <div className="absolute -bottom-1.5 left-3 w-3 h-3 bg-black/90 rotate-45 border-r border-b border-white/10"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Post Actions */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-2 text-white/80 hover:text-white transition-colors active:scale-95"
                  >
                    <i className={`${likedPosts.has(post.id) ? 'fa-solid text-red-500' : 'fa-regular'} fa-heart text-2xl`}></i>
                  </button>
                  <span className="text-white font-bold text-sm">{post.likes.toLocaleString()}</span>
                </div>

                {post.caption && (
                  <p className="text-white/90 text-sm">
                    {post.caption}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button - Create Post */}
      <button
        onClick={() => setShowPostUpload(true)}
        className="fixed bottom-32 right-4 w-14 h-14 bg-gradient-to-br from-[#D6FF32] to-[#b8e01f] rounded-full flex items-center justify-center shadow-lg shadow-[#D6FF32]/30 hover:scale-110 active:scale-95 transition-transform z-40"
      >
        <i className="fa-solid fa-plus text-[#280D62] text-xl"></i>
      </button>
    </div>
  );
};

export default PublicNews;
