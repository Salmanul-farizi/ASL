
import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@asl.com' || (email === 'admin@arenax.com' && password === 'admin123')) {
      onLogin();
    } else {
      setError('Check credentials (admin@asl.com / admin123)');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 px-4">
      <div className="glass-card p-10 rounded-[2.5rem] shadow-2xl border border-[#D6FF32]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <i className="fa-solid fa-lock text-9xl text-[#D6FF32]"></i>
        </div>
        
        <div className="text-center mb-10 relative z-10">
          <div className="w-20 h-20 bg-[#D6FF32] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(214,255,50,0.3)]">
            <i className="fa-solid fa-shield-halved text-4xl text-[#280D62]"></i>
          </div>
          <h2 className="sports-font text-4xl font-black text-white italic">Control Center</h2>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-2">ASL 2026 Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-xs font-bold text-center uppercase tracking-widest">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-3 ml-2">Secure Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#3e2085]/40 border border-[#D6FF32]/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#D6FF32] focus:border-transparent outline-none transition-all text-white placeholder-white/20"
              placeholder="admin@asl.com"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-3 ml-2">Access Key</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#3e2085]/40 border border-[#D6FF32]/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#D6FF32] focus:border-transparent outline-none transition-all text-white placeholder-white/20"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-[#D6FF32] hover:bg-[#c4eb2e] text-[#280D62] sports-font font-black py-5 rounded-2xl shadow-xl transition-all active:scale-[0.97] uppercase tracking-wider text-xl"
          >
            Authorize Access
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
