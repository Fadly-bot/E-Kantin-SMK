import React, { useState } from 'react';
import { motion } from 'https://esm.sh/framer-motion@11.11.0';
import { User, Lock, ArrowLeft, Loader2, Eye, EyeOff } from 'https://esm.sh/lucide-react@0.446.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';
// Import Helmet untuk mengelola SEO secara dinamis
import { Helmet } from 'react-helmet-async';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface LoginPageProps {
  role: string;
  onSuccess: (user: any, token: string) => void;
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
      const { data, error: loginError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.trim().toLowerCase())
        .eq('password', password)
        .single();

      if (loginError || !data) {
        setError('Username atau password salah.');
      } else {
        onSuccess(data, 'session-token-valid');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      {/* BLOK SEO - Mengubah Title & Deskripsi Website Saat Halaman Ini Terbuka */}
      <Helmet>
        <title>Login E-Kantin SMK - Aplikasi Pemesanan Kantin Sekolah Modern</title>
        <meta name="description" content="Masuk ke aplikasi E-Kantin SMK untuk melakukan transaksi pemesanan makanan, manajemen stok kantin, dan kelola saldo digital siswa dengan cepat." />
        <meta name="keywords" content="login e-kantin, kantin digital, aplikasi sekolah, SMK koding, template umkm" />
        
        {/* Open Graph Meta Tags (Untuk pratinjau link di WhatsApp / Sosial Media) */}
        <meta property="og:title" content="Login E-Kantin SMK - Sistem Transaksi Sekolah Digital" />
        <meta property="og:description" content="Masuk sebagai Siswa atau Penjual. Kelola kebutuhan belanjamu tanpa antre." />
        <meta property="og:type" content="website" />
      </Helmet>

      <button onClick={onBack} className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-medium transition-colors">
        <ArrowLeft className="w-5 h-5" /> Kembali
      </button>

      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-emerald-600 w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Selamat Datang</h2>
          <p className="text-slate-500">Masuk sebagai <span className="text-emerald-600 font-bold capitalize">{role === 'student' ? 'Siswa' : 'Penjual'}</span></p>
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
              <input type="text" required className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 transition-all" placeholder="Masukkan username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input type={showPassword ? "text" : "password"} required className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 transition-all" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Masuk Sekarang'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-500 mb-4">Belum punya akun di E-Kantin?</p>
          <button onClick={onRegister} className="w-full py-3 bg-slate-50 text-emerald-600 font-bold rounded-xl border border-dashed border-emerald-300 hover:bg-emerald-50/50 transition-all">
            Daftar Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
