import React from 'react';
import { motion } from 'motion/react';
import { Store, UserCircle, ArrowLeft } from 'lucide-react';
import { UserRole } from '../types';

interface JoinPageProps {
  onSelectRole: (role: UserRole) => void;
  onRegisterRole: (role: UserRole) => void;
  onBack: () => void;
}

export default function JoinPage({ onSelectRole, onRegisterRole, onBack }: JoinPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <motion.button 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-deep-blue font-medium transition-colors"
      >
        <ArrowLeft className="w-5 h-5" /> Kembali
      </motion.button>

      <div className="max-w-4xl w-full text-center">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-extrabold text-deep-blue mb-4"
        >
          Join as a client or seller
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-slate-500 mb-12 text-lg"
        >
          Pilih peran Anda untuk melanjutkan akses ke sistem E-Kantin SMK.
        </motion.p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Seller Card */}
          <motion.button
            whileHover={{ scale: 1.02, translateY: -5 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => onSelectRole('seller')}
            className="group relative p-10 bg-white rounded-[2rem] border-2 border-slate-100 transition-all text-left shadow-sm hover:shadow-2xl hover:shadow-fresh-green/5 hover:border-fresh-green"
          >
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-fresh-green/10 transition-colors">
              <Store className="w-8 h-8 text-slate-400 group-hover:text-fresh-green transition-colors" />
            </div>
            <h3 className="text-2xl font-bold text-deep-blue mb-2">I'm a seller</h3>
            <p className="text-slate-500">Vendor kantin yang ingin mengelola menu, pesanan, dan laporan keuangan.</p>
            <div className="mt-8 flex items-center gap-2 text-fresh-green font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              Masuk Sekarang <ArrowLeft className="w-4 h-4 rotate-180" />
            </div>
          </motion.button>

          {/* Client Card */}
          <motion.button
            whileHover={{ scale: 1.02, translateY: -5 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => onSelectRole('student')} // Default to student, sub-role selected in register
            className="group relative p-10 bg-white rounded-[2rem] border-2 border-slate-100 transition-all text-left shadow-sm hover:shadow-2xl hover:shadow-fresh-green/5 hover:border-fresh-green"
          >
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-fresh-green/10 transition-colors">
              <UserCircle className="w-8 h-8 text-slate-400 group-hover:text-fresh-green transition-colors" />
            </div>
            <h3 className="text-2xl font-bold text-deep-blue mb-2">I'm a client</h3>
            <p className="text-slate-500">Siswa, Guru, atau Staf Sekolah yang ingin memesan makanan dan memantau aktivitas.</p>
            <div className="mt-8 flex items-center gap-2 text-fresh-green font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              Masuk Sekarang <ArrowLeft className="w-4 h-4 rotate-180" />
            </div>
          </motion.button>
        </div>

        {/* Registration Space */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 p-8 bg-fresh-green/5 border-2 border-dashed border-fresh-green/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="text-left">
            <h4 className="text-xl font-extrabold text-deep-blue mb-1">Belum punya akun?</h4>
            <p className="text-slate-500 text-sm">Daftar sekarang untuk mulai menggunakan layanan E-Kantin SMK.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => onRegisterRole('student')}
              className="px-8 py-3 bg-fresh-green text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-fresh-green/20"
            >
              Daftar Client
            </button>
            <button 
              onClick={() => onRegisterRole('seller')}
              className="px-8 py-3 bg-deep-blue text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-deep-blue/20"
            >
              Daftar Seller
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
