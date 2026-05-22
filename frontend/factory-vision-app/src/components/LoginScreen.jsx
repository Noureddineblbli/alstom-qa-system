import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Shield, User, Lock, AlertCircle, Factory } from 'lucide-react';
import axios from '../api/api';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(
        '/api/auth/login', {
        email,
        password
      });

      let data = {};

      try {
        data = await response.data;
      } catch {
        data = {};
      }

      if (!response.data) {
        throw new Error(data.detail || 'Login failed');
      }

      // Save token if needed
      localStorage.setItem('token', data.access_token);

      // create user
      const user = {
        email: email.trim(),
        role: data.role,
        name: data.nom,
        id: data.user_id
      };

      // Pass user to parent component
      onLogin(user);

      

    } catch (err) {
      setError(err.message || 'An error occurred during login');
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-600/20">
            <Factory className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Industrial Authentication</h2>
          <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-mono">Vision Inspection System v2.0</p>
        </div>

        <div className="bg-[#16191E] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl" />
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div>
              <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest block mb-2 font-bold px-1">Email Address</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input 
                  required
                  type="email" 
                  placeholder="name@factory.com"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest block mb-2 font-bold px-1">Access Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input 
                  required
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In to System
                </>
              )}
            </button>
            
            <div className="flex items-center justify-center gap-2 text-[10px] text-white/20 uppercase font-mono tracking-tighter">
              <Shield className="w-3 h-3" />
              Secure Encrypted Session
            </div>
          </form>
        </div>
        
        <p className="text-center mt-8 text-white/20 text-xs">
          Forgot credentials? Contact system supervisor.
        </p>
      </motion.div>
    </div>
  );
}
