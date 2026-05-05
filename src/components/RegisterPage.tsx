import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, ArrowLeft, Loader2, Mail, GraduationCap, Eye, EyeOff } from 'lucide-react';
import * as Select from '@radix-ui/react-select';
import { UserRole, User as UserType } from '../types';
// --- TAMBAHKAN IMPORT INI ---
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';


// --- INISIALISASI SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
      // --- LOGIKA BARU: SIMPAN KE SUPABASE ---
      const { data, error: sbError } = await supabase
        .from('users') // Memakai tabel 'users' yang kita buat tadi
        .insert([
          { 
            username, 
            password, // Catatan: Sebaiknya di-hash untuk produksi
            full_name: fullName, 
            role: role === 'seller' ? 'seller' : subRole,
            class_name: subRole === 'student' ? className : null
          }
        ])
        .select()
        .single();

      if (sbError) {
        if (sbError.code === '23505') {
          setError('Username sudah digunakan.');
        } else {
          setError(sbError.message);
        }
      } else {
        // Berhasil! (Token sementara dibuat dummy karena ini client-side)
        onSuccess(data as UserType, 'dummy-token-for-now');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi ke Database Cloud.');
    } finally {
      setIsLoading(false);
    }
  };

  // ... sisa kode return kamu tetap sama ...
  return (
    // Copy-paste bagian return dari kode asli kamu di sini
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      {/* (Sama seperti kode asli kamu) */}
    </div>
  );
}
