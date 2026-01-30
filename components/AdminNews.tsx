
import React, { useState, useEffect } from 'react';
import { dataStore } from '../services/dataStore';
import { NewsPost } from '../types';

const AdminNews: React.FC = () => {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
  const [formData, setFormData] = useState({ image: '', caption: '' });

  useEffect(() => {
    setPosts(dataStore.getNews());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allPosts = dataStore.getNews();
    
    if (editingPost) {
      const updated = allPosts.map(p => 
        p.id === editingPost.id 
          ? { ...p, image: formData.image, caption: formData.caption }
          : p
      );
      dataStore.saveNews(updated);
      setPosts(updated);
    } else {
      const newPost: NewsPost = {
        id: `n${Date.now()}`,
        image: formData.image,
        caption: formData.caption,
        createdAt: new Date().toISOString(),
        likes: 0
      };
      const updated = [newPost, ...allPosts];
      dataStore.saveNews(updated);
      setPosts(updated);
    }
    
    setFormData({ image: '', caption: '' });
    setShowForm(false);
    setEditingPost(null);
  };

  const handleEdit = (post: NewsPost) => {
    setEditingPost(post);
    setFormData({ image: post.image, caption: post.caption });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this post?')) {
      const updated = posts.filter(p => p.id !== id);
      dataStore.saveNews(updated);
      setPosts(updated);
    }
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

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between px-2">
        <h2 className="sports-font text-2xl font-black text-white">Manage Posts</h2>
        <button 
          onClick={() => { setShowForm(true); setEditingPost(null); setFormData({ image: '', caption: '' }); }}
          className="w-12 h-12 rounded-2xl bg-[#D6FF32] text-[#280D62] flex items-center justify-center shadow-[0_0_20px_rgba(214,255,50,0.4)] hover:scale-110 transition-transform"
        >
          <i className="fa-solid fa-plus text-xl"></i>
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-8 rounded-[2.5rem] border border-[#D6FF32]/30 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="sports-font text-lg font-black text-[#D6FF32]">
              {editingPost ? 'Edit Post' : 'New Post'}
            </h3>
            <button 
              onClick={() => { setShowForm(false); setEditingPost(null); }}
              className="w-8 h-8 rounded-full bg-white/5 text-white/40 flex items-center justify-center hover:bg-white/10"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Post Image</label>
              
              {/* Image Preview / Upload Area */}
              <div className="relative group">
                <div className={`w-full h-48 rounded-2xl border-2 border-dashed ${formData.image ? 'border-[#D6FF32]/50' : 'border-white/20'} overflow-hidden flex items-center justify-center bg-white/5`}>
                  {formData.image ? (
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-white/30">
                      <i className="fa-solid fa-image text-4xl mb-2"></i>
                      <p className="text-xs">Click to upload or paste URL below</p>
                    </div>
                  )}
                </div>
                <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                  <div className="text-center text-white">
                    <i className="fa-solid fa-camera text-2xl mb-1"></i>
                    <p className="text-xs font-bold">Upload Image</p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setFormData({...formData, image: reader.result as string});
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                {formData.image && (
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, image: ''})}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                )}
              </div>
              
              {/* URL fallback */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-white/30 text-xs">or paste URL:</span>
                <input
                  type="text"
                  value={formData.image.startsWith('data:') ? '' : formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/20 focus:border-[#D6FF32]/50 focus:outline-none transition-colors"
                />
              </div>
            </div>
            
            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Caption</label>
              <textarea
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                placeholder="Write your caption... use emojis and hashtags!"
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:border-[#D6FF32]/50 focus:outline-none transition-colors resize-none"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-[#D6FF32] text-[#280D62] py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#e8ff66] transition-colors shadow-[0_0_20px_rgba(214,255,50,0.3)]"
            >
              {editingPost ? 'Update Post' : 'Publish Post'}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="glass-card rounded-[2.5rem] p-12 text-center border border-white/5">
            <i className="fa-solid fa-image text-4xl text-white/10 mb-4"></i>
            <p className="text-white/30 text-sm font-medium">No posts yet. Create your first post!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-[#D6FF32]/20 transition-all">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D6FF32] flex items-center justify-center">
                    <i className="fa-solid fa-ranking-star text-[#280D62]"></i>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">ASL Official</p>
                    <p className="text-white/40 text-[10px]">{formatTimeAgo(post.createdAt)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(post)}
                    className="w-8 h-8 rounded-full bg-white/5 text-white/40 flex items-center justify-center hover:bg-[#D6FF32]/20 hover:text-[#D6FF32] transition-all"
                  >
                    <i className="fa-solid fa-pen text-xs"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="w-8 h-8 rounded-full bg-white/5 text-white/40 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all"
                  >
                    <i className="fa-solid fa-trash text-xs"></i>
                  </button>
                </div>
              </div>
              
              {/* Post Image */}
              <div className="aspect-square relative">
                <img src={post.image} alt="" className="w-full h-full object-cover" />
              </div>
              
              {/* Post Actions & Caption */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-4">
                  <button className="text-white/60 hover:text-red-400 transition-colors">
                    <i className="fa-solid fa-heart text-xl"></i>
                  </button>
                  <button className="text-white/60 hover:text-white transition-colors">
                    <i className="fa-solid fa-comment text-xl"></i>
                  </button>
                  <button className="text-white/60 hover:text-white transition-colors">
                    <i className="fa-solid fa-paper-plane text-xl"></i>
                  </button>
                </div>
                <p className="text-white/60 text-xs font-bold">{post.likes} likes</p>
                <p className="text-white text-sm leading-relaxed">
                  <span className="font-bold text-white">asl_official</span>{' '}
                  {post.caption}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminNews;
