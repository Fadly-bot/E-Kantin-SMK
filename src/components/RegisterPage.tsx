import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, ArrowLeft, Loader2, Mail, GraduationCap, Eye, EyeOff } from 'lucide-react';
import * as Select from '@radix-ui/react-select';
import { UserRole, User as UserType } from '../types';

interface RegisterPageProps {
  role: UserRole;
  onSuccess: (user: UserType, token: string) => void;
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

    // Class Name Validation for Students
    if (role !== 'seller' && subRole === 'student') {
      const classPattern = /^(10|11|12)\s+(RPL|TKJ|TEI|TPTU)(\s+[1-3])?$/i;
      if (!classPattern.test(className.trim())) {
        setError('Format kelas tidak sesuai. Contoh: "10 RPL", "11 TKJ 2", "12 TEI", "10 TPTU 1"');
        return;
      }
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password, 
          fullName, 
          role: role === 'seller' ? 'seller' : subRole,
          className: subRole === 'student' ? className : null
        })
      });

      const data = await response.json();
      if (response.ok) {
        onSuccess(data.user, data.token);
      } else {
        setError(data.message || 'Registrasi gagal.');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi.');
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
          <h2 className="text-3xl font-extrabold text-deep-blue mb-2">Buat Akun Baru</h2>
          <p className="text-slate-500">Lengkapi data diri Anda untuk bergabung.</p>
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
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-fresh-green/20 focus:border-fresh-green outline-none transition-all"
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
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-fresh-green/20 focus:border-fresh-green outline-none transition-all"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {role !== 'seller' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Pilih Peran</label>
              <Select.Root value={subRole} onValueChange={setSubRole}>
                <Select.Trigger className="w-full flex items-center justify-between pl-4 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-fresh-green/20 focus:border-fresh-green outline-none transition-all">
                  <Select.Value />
                  <Select.Icon />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50">
                    <Select.Viewport>
                      <Select.Item value="student" className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer outline-none flex items-center gap-2">
                        <Select.ItemText>Siswa</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="teacher" className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer outline-none flex items-center gap-2">
                        <Select.ItemText>Guru</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="staff" className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer outline-none flex items-center gap-2">
                        <Select.ItemText>Staf</Select.ItemText>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
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
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-fresh-green/20 focus:border-fresh-green outline-none transition-all"
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
                className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 border rounded-2xl focus:ring-2 focus:ring-fresh-green/20 outline-none transition-all ${password && !isPasswordValid ? 'border-red-200' : 'border-slate-200 focus:border-fresh-green'}`}
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
            
            {password.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${passwordRules.hasUpper ? 'text-fresh-green' : 'text-slate-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordRules.hasUpper ? 'bg-fresh-green' : 'bg-slate-300'}`} />
                  Huruf Besar
                </div>
                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${passwordRules.hasLower ? 'text-fresh-green' : 'text-slate-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordRules.hasLower ? 'bg-fresh-green' : 'bg-slate-300'}`} />
                  Huruf Kecil
                </div>
                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${passwordRules.hasNumber ? 'text-fresh-green' : 'text-slate-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordRules.hasNumber ? 'bg-fresh-green' : 'bg-slate-300'}`} />
                  Angka
                </div>
                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${passwordRules.hasSymbol ? 'text-fresh-green' : 'text-slate-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordRules.hasSymbol ? 'bg-fresh-green' : 'bg-slate-300'}`} />
                  Simbol (._+)
                </div>
                <div className={`col-span-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${passwordRules.isValidLength ? 'text-fresh-green' : 'text-red-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordRules.isValidLength ? 'bg-fresh-green' : 'bg-red-400'}`} />
                  Harus 15 Karakter ({password.length}/15)
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-fresh-green text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-500 transition-all shadow-lg shadow-fresh-green/10 flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Daftar Sekarang'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
