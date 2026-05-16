import React, { useState } from 'react';
// Import Vercel Analytics untuk performa SEO
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';

export default function App() {
  // State manajemen halaman bawaan proyek E-Kantin kamu
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'register'>('landing');
  const [selectedRole, setSelectedRole] = useState<'student' | 'seller'>('student');
  const [userSession, setUserSession] = useState<any>(null);

  const handleLoginSuccess = (user: any, token: string) => {
    setUserSession({ user, token });
    // Jika login sukses, arahkan ke dashboard utama nantinya
    alert(`Selamat datang kembali, ${user.full_name || user.username}!`);
  };

  const handleRegisterSuccess = (user: any, token: string) => {
    setUserSession({ user, token });
    alert('Pendaftaran akun berhasil! Data Anda sudah tersimpan di Supabase.');
    setCurrentPage('login');
  };

  return (
    <>
      {/* 1. HALAMAN UTAMA / LANDING SEBELUM MASUK */}
      {currentPage === 'landing' && (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <main className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl p-12 border border-slate-100">
            <header className="mb-8">
              <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full tracking-wide uppercase">
                Project E-Kantin SMK
              </span>
              <h1 className="text-4xl font-extrabold text-slate-800 mt-4 mb-3">
                Pesan Makanan & Minuman Tanpa Antre
              </h1>
              <p className="text-slate-500 max-w-md mx-auto text-sm">
                Aplikasi layanan kantin digital sekolah modern untuk kemudahan transaksi siswa dan pengelolaan toko penjual.
              </p>
            </header>

            {/* Kotak Pilihan Peran Masuk */}
            <section className="grid grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => setSelectedRole('student')}
                className={`p-5 rounded-2xl border-2 text-left transition-all ${
                  selectedRole === 'student'
                    ? 'border-emerald-500 bg-emerald-50/30'
                    : 'border-slate-100 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <div className={`w-3 h-3 rounded-full mb-3 ${selectedRole === 'student' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <h2 className="font-bold text-slate-800 text-base">Saya Siswa / Guru</h2>
                <p className="text-xs text-slate-400 mt-1">Belanja menu favorit dari kelas</p>
              </button>

              <button
                onClick={() => setSelectedRole('seller')}
                className={`p-5 rounded-2xl border-2 text-left transition-all ${
                  selectedRole === 'seller'
                    ? 'border-emerald-500 bg-emerald-50/30'
                    : 'border-slate-100 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <div className={`w-3 h-3 rounded-full mb-3 ${selectedRole === 'seller' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <h2 className="font-bold text-slate-800 text-base">Saya Penjual Kantin</h2>
                <p className="text-xs text-slate-400 mt-1">Kelola menu toko & pantau omset</p>
              </button>
            </section>

            <div className="space-y-3">
              <button
                onClick={() => setCurrentPage('login')}
                className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold text-base hover:bg-slate-700 transition-all shadow-md"
              >
                Masuk ke Aplikasi
              </button>
              
              <button
                onClick={() => setCurrentPage('register')}
                className="w-full bg-slate-50 text-emerald-700 py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-50/50 border border-emerald-100 transition-all"
              >
                Belum punya akun? Daftar Sekarang
              </button>
            </div>
          </main>
        </div>
      )}

      {/* 2. COMPONENT HALAMAN LOGIN */}
      {currentPage === 'login' && (
        <LoginPage
          role={selectedRole}
          onSuccess={handleLoginSuccess}
          onBack={() => setCurrentPage('landing')}
          onRegister={() => setCurrentPage('register')}
        />
      )}

      {/* 3. COMPONENT HALAMAN DAFTAR / REGISTRASI */}
      {currentPage === 'register' && (
        <RegisterPage
          role={selectedRole}
          onSuccess={handleRegisterSuccess}
          onBack={() => setCurrentPage('landing')}
        />
      )}

      {/* SUNTIKAN TRACKING SEO VERCEL (Diproses Otomatis di Latar Belakang) */}
      <Analytics />
      <SpeedInsights />
    </>
  );
}
