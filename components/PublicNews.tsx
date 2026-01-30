
import React, { useState, useEffect } from 'react';
import { dataStore } from '../services/dataStore';
import { NewsPost, MediaStory } from '../types';
import StoryUpload from './StoryUpload';

interface PublicNewsProps {
  isAdmin?: boolean;
}

const PublicNews: React.FC<PublicNewsProps> = ({ isAdmin = false }) => {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [stories, setStories] = useState<MediaStory[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    setPosts(dataStore.getNews());
    setStories(dataStore.getMediaStories());
  }, []);

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

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between px-2">
        <h2 className="sports-font text-2xl font-black text-white">Latest Feed</h2>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => setShowUpload(true)}
            className="w-10 h-10 rounded-full bg-[#D6FF32]/10 hover:bg-[#D6FF32]/20 flex items-center justify-center border border-[#D6FF32]/20 hover:border-[#D6FF32]/40 transition-all"
            title="Upload story"
          >
            <i className="fa-solid fa-plus text-[#D6FF32]"></i>
          </button>
          <div className="w-10 h-10 rounded-full bg-[#D6FF32]/10 flex items-center justify-center border border-[#D6FF32]/20">
             <i className="fa-solid fa-rss text-[#D6FF32]"></i>
          </div>
        </div>
      </div>

      {/* Stories Strip */}
      {stories.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-4 px-2 scrollbar-hide">
          {stories.map((story) => (
            <div
              key={story.id}
              className="flex-shrink-0 w-20 h-28 rounded-2xl overflow-hidden cursor-pointer group relative hover:ring-2 hover:ring-[#D6FF32] transition-all"
            >
              {story.type === 'image' ? (
                <img src={story.mediaUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              ) : (
                <>
                  <video src={story.mediaUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <i className="fa-solid fa-play text-white text-sm"></i>
                  </div>
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <StoryUpload
          isAdmin={isAdmin}
          onUpload={handleUploadStories}
          onClose={() => setShowUpload(false)}
        />
      )}

      <div className="space-y-8">
        {posts.length === 0 ? (
          <div className="text-center py-32">
            <div className="w-20 h-20 bg-gradient-to-br from-[#D6FF32]/10 to-[#280D62]/20 rounded-full flex items-center justify-center mb-6 mx-auto border border-[#D6FF32]/20 shadow-xl">
              <i className="fa-solid fa-image text-2xl text-[#D6FF32]"></i>
            </div>
            <h3 className="sports-font text-xl font-bold text-white/60 mb-2">No Posts Yet</h3>
            <p className="text-white/40 text-sm">Check back soon for the latest updates!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="glass-card rounded-3xl overflow-hidden border border-[#D6FF32]/10 shadow-2xl hover:shadow-[#D6FF32]/5 transition-all duration-500 hover:-translate-y-1 group">
              {/* Premium Card Header */}
              <div className="bg-gradient-to-r from-[#280D62]/80 to-[#280D62]/60 backdrop-blur-xl p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#D6FF32] to-[#b8e01f] rounded-xl flex items-center justify-center shadow-lg shadow-[#D6FF32]/30">
                    <i className="fa-solid fa-trophy text-[#280D62] font-black"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="sports-font text-sm font-black text-[#D6FF32] tracking-wider uppercase">ASL OFFICIAL</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-1.5 h-1.5 bg-[#D6FF32] rounded-full animate-pulse"></div>
                      <p className="text-white/60 text-xs font-medium">{formatTimeAgo(post.createdAt)}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                    <i className="fa-solid fa-ellipsis text-white/40 text-sm"></i>
                  </div>
                </div>
              </div>

              {/* Premium Image Container */}
              <div className="relative overflow-hidden">
                <img 
                  src={post.image} 
                  alt="" 
                  className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  onDoubleClick={() => handleLike(post.id)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                
                {/* Floating Like Indicator */}
                {likedPosts.has(post.id) && (
                  <div className="absolute top-4 right-4">
                    <div className="w-10 h-10 bg-red-500/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
                      <i className="fa-solid fa-heart text-white text-sm"></i>
                    </div>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="p-6 space-y-3">
                {/* Like and Time Row */}
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-2 text-white/80 hover:text-white transition-colors duration-300 transform active:scale-95"
                  >
                    <i className={`${likedPosts.has(post.id) ? 'fa-solid text-red-500' : 'fa-regular'} fa-heart text-xl`}></i>
                    <span className="font-bold text-sm">{post.likes.toLocaleString()} likes</span>
                  </button>
                  
                  <p className="text-white/50 text-xs font-medium">{formatTimeAgo(post.createdAt)}</p>
                </div>
                
                {/* Description */}
                <p className="text-white font-medium text-[15px] leading-relaxed">{post.caption}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PublicNews;
