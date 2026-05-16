import React, { useState } from 'react';
// Menggunakan CDN ESM agar modul animasi dan ikon aman dimuat langsung di browser Android/Acode
import { motion } from 'https://esm.sh/framer-motion@11.11.0';
import { User, Lock, ArrowLeft, Loader2, Mail, GraduationCap, Eye, EyeOff } from 'https://esm.sh/lucide-react@0.446.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';

// Inisialisasi Supabase Client dari Environment Variable Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface RegisterPageProps {
  role: string;
  onSuccess: (user: any, token: string) => void;
  onBack: () => void;
}

export default function RegisterPage({ role, onSuccess, onBack }: RegisterPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [subRole, setSubRole] = useState('student');
  const [className, setClassName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordRules = {
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[._+]/.test(password),
    isValidLength: password.length === 15
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      setError('Password harus memenuhi semua kriteria: Huruf Besar, Kecil, Angka, Simbol (._+), dan tepat 15 Karakter.');
      return;
    }

    if (role !== 'seller' && subRole === 'student') {
      const classPattern = /^(10|11|12)\s+(RPL|TKJ|TEI|TPTU)(\s+[1-3])?$/i;
      if (!classPattern.test(className.trim())) {
        setError('Format kelas tidak sesuai. Contoh: "10 RPL", "11 TKJ 2", "12 TEI"');
        return;
      }
    }

    setIsLoading(true);
    setError('');

    try {
      // PROSES DIRECT INSERT KE DATABASE SUPABASE
      // Mengirimkan data sesuai penamaan kolom yang valid
      const { data, error: sbError } = await supabase
        .from('users')
        .insert([
          { 
            username: username.trim(), 
            password: password, 
            full_name: fullName.trim(), 
            role: role === 'seller' ? 'seller' : subRole,
            class_name: subRole === 'student' && role !== 'seller' ? className.trim() : null
          }
        ])
        .select()
        .single();

      if (sbError) {
        // Deteksi jika username duplikat/sudah ada di database
        if (sbError.code === '23505') {
          setError('Username sudah terdaftar. Silakan gunakan username lain.');
        } else {
          setError('Gagal mendaftar: ' + sbError.message);
        }
      } else {
        // Sukses! Kembalikan data user baru ke state utama aplikasi
        onSuccess(data, 'dummy-session-token');
      }
    } catch (err: any) {
      setError('Terjadi kesalahan sistem atau masalah jaringan.');
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
        className="max-w-lg w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-10 border border-slate-100"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-emerald-900 mb-2">Buat Akun Baru</h2>
          <p className="text-slate-500">Lengkapi data diri Anda untuk bergabung ke E-Kantin.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                required
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                placeholder="Nama Lengkap"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Username</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                required
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {role !== 'seller' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Pilih Peran</label>
              <select 
                value={subRole} 
                onChange={(e) => setSubRole(e.target.value)}
                className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none"
              >
                <option value="student">Siswa</option>
                <option value="teacher">Guru</option>
                <option value="staff">Staf</option>
              </select>
            </div>
          )}

          {subRole === 'student' && role !== 'seller' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Kelas</label>
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Contoh: 10 RPL 1, 11 TKJ, 12 TEI"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                maxLength={15}
                className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 border rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all ${password && !isPasswordValid ? 'border-red-200' : 'border-slate-200 focus:border-emerald-500'}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {password.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${passwordRules.hasUpper ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordRules.hasUpper ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  Huruf Besar
                </div>
                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${passwordRules.hasLower ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordRules.hasLower ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  Huruf Kecil
                </div>
                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${passwordRules.hasNumber ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordRules.hasNumber ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  Angka
                </div>
                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${passwordRules.hasSymbol ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordRules.hasSymbol ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  Simbol (._+)
                </div>
                <div className={`col-span-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${passwordRules.isValidLength ? 'text-emerald-600' : 'text-red-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordRules.isValidLength ? 'bg-emerald-500' : 'bg-red-400'}`} />
                  Harus 15 Karakter ({password.length}/15)
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Daftar Sekarang'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
