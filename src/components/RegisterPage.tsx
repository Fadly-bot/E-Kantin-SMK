import React, { useState } from 'react';
import { motion } from 'https://esm.sh/framer-motion@11.11.0';
import { User, Lock, ArrowLeft, Loader2, Mail, GraduationCap, Eye, EyeOff } from 'https://esm.sh/lucide-react@0.446.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';

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
      setError('Password harus memenuhi semua kriteria pendaftaran.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error: sbError } = await supabase
        .from('users')
        .insert([
          { 
            username: username.trim().toLowerCase(), 
            password: password, 
            full_name: fullName.trim(), 
            role: role === 'seller' ? 'seller' : subRole,
            class_name: subRole === 'student' && role !== 'seller' ? className.trim() : null
          }
        ])
        .select()
        .single();

      if (sbError) {
        if (sbError.code === '23505') {
          setError('Username sudah dipakai.');
        } else {
          setError('Gagal: ' + sbError.message);
        }
      } else {
        onSuccess(data, 'session-token-valid');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi database.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <button onClick={onBack} className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 font-medium">
        <ArrowLeft className="w-5 h-5" /> Kembali
      </button>

      <div className="max-w-lg w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Buat Akun Baru</h2>
          <p className="text-slate-500">Lengkapi data untuk proyek E-Kantin SMK.</p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Nama Lengkap</label>
            <input type="text" required className="w-full px-4 py-3.5 bg-slate-50 border rounded-2xl outline-none" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
            <input type="text" required className="w-full px-4 py-3.5 bg-slate-50 border rounded-2xl outline-none" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>

          {role !== 'seller' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Peran</label>
              <select value={subRole} onChange={(e) => setSubRole(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border rounded-2xl outline-none">
                <option value="student">Siswa</option>
                <option value="teacher">Guru</option>
              </select>
            </div>
          )}

          {subRole === 'student' && role !== 'seller' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Kelas</label>
              <input type="text" required placeholder="Contoh: 10 RPL 1" className="w-full px-4 py-3.5 bg-slate-50 border rounded-2xl outline-none" value={className} onChange={(e) => setClassName(e.target.value)} />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Password (Tepat 15 Karakter)</label>
            <input type="password" required maxLength={15} className="w-full px-4 py-3.5 bg-slate-50 border rounded-2xl outline-none" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg mt-4 flex items-center justify-center gap-2">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Daftar Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
}
