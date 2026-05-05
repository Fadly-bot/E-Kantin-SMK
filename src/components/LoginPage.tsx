import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { UserRole, User as UserType } from '../types';
// --- TAMBAHKAN IMPORT SUPABASE DARI CDN ---
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// --- INISIALISASI SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface LoginPageProps {
  role: UserRole;
  onSuccess: (user: UserType, token: string) => void;
  onBack: () => void;
  onRegister: () => void;
}

export default function LoginPage({ role, onSuccess, onBack, onRegister }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // --- LOGIKA BARU: CEK DATA KE SUPABASE ---
      const { data, error: loginError } = await supabase
        .from('users') // Memastikan nama tabel adalah 'users'
        .select('*')
        .eq('username', username)
        .eq('password', password) // Pastikan kolom di Supabase tulisannya 'password'
        .single();

      if (loginError || !data) {
        setError('Username atau password salah.');
      } else {
        // Berhasil Login!
        // Kirim data user yang didapat dari Supabase ke fungsi onSuccess
        onSuccess(data as UserType, 'dummy-session-token');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi ke server cloud.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.button 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-deep-blue font-medium transition-colors"
      >
        <ArrowLeft className="w-5 h-5" /> Kembali
      </motion.button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-10 border border-slate-100"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-fresh-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-fresh-green w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-deep-blue mb-2">Selamat Datang</h2>
          <p className="text-slate-500">Masuk sebagai <span className="text-fresh-green font-bold capitalize">{role === 'student' ? 'Siswa' : 'Penjual'}</span></p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-fresh-green/20 focus:border-fresh-green outline-none transition-all"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-fresh-green/20 focus:border-fresh-green outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-fresh-green transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-deep-blue text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg shadow-deep-blue/10 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Masuk Sekarang'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-500 mb-4">Belum punya akun di E-Kantin?</p>
          <button 
            onClick={onRegister} 
            className="w-full py-3 bg-slate-50 text-fresh-green font-bold rounded-xl border border-dashed border-fresh-green/30 hover:bg-fresh-green/5 transition-all"
          >
            Daftar Sekarang
          </button>
        </div>
      </motion.div>
    </div>
  );
}
