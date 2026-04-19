/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from '@vercel/analytics/react';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
// Pastikan BrowserRouter di-import jika kamu memakainya, tapi di sini kita pakai state 'view'
// Jika kamu tidak pakai library react-router-dom, abaikan komentar ini.

import LandingPage from './components/LandingPage';
import JoinPage from './components/JoinPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import SellerDashboard from './components/SellerDashboard';
import TransactionHistory from './components/TransactionHistory';
import MenuList from './components/MenuList';
import Layout from './components/Layout';
import { User, UserRole, View } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [view, setView] = useState<View>('landing');
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      if (token) {
        try {
          const response = await fetch('/api/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setView('dashboard');
          } else {
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (error) {
          console.error('Session restoration error:', error);
        }
      }
      setIsLoading(false);
    };
    restoreSession();
  }, [token]);

  const handleLoginSuccess = (userData: User, userToken: string) => {
    localStorage.setItem('token', userToken);
    setToken(userToken);
    setUser(userData);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setView('landing');
  };

  // Tampilan saat Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-fresh-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Memuat Sistem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LandingPage onStart={() => setView('join')} />
          </motion.div>
        )}

        {view === 'join' && (
          <motion.div key="join" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
            <JoinPage 
              onSelectRole={(role) => {
                setSelectedRole(role);
                setView('login');
              }} 
              onRegisterRole={(role) => {
                setSelectedRole(role);
                setView('register');
              }}
              onBack={() => setView('landing')}
            />
          </motion.div>
        )}

        {view === 'login' && (
          <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <LoginPage 
              role={selectedRole}
              onSuccess={handleLoginSuccess}
              onBack={() => setView('join')}
              onRegister={() => setView('register')}
            />
          </motion.div>
        )}

        {view === 'register' && (
          <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <RegisterPage 
              role={selectedRole}
              onSuccess={handleLoginSuccess}
              onBack={() => setView('login')}
            />
          </motion.div>
        )}

        {(view === 'dashboard' || view === 'history' || view === 'menu-list' || view === 'manage-menu') && user && (
          <Layout 
            user={user}
            currentView={view} 
            setView={setView} 
            onLogout={handleLogout}
            onSelectId={setSelectedId}
          >
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
            >
              {(view === 'dashboard' && (user.role === 'student' || user.role === 'staff')) && <StudentDashboard user={user} />}
              {view === 'dashboard' && user.role === 'teacher' && <TeacherDashboard user={user} />}
              {view === 'dashboard' && user.role === 'seller' && <SellerDashboard user={user} view={view} selectedProductId={selectedId} onClearSelection={() => setSelectedId(null)} />}
              {view === 'manage-menu' && user.role === 'seller' && <SellerDashboard user={user} view={view} selectedProductId={selectedId} onClearSelection={() => setSelectedId(null)} />}
              {view === 'history' && <TransactionHistory user={user} />}
              {view === 'menu-list' && <MenuList user={user} selectedProductId={selectedId} onClearSelection={() => setSelectedId(null)} />}
            </motion.div>
          </Layout>
        )}
      </AnimatePresence>

      {/* Analytics diletakkan satu kali di sini agar memantau seluruh aplikasi */}
      <Analytics />
      <SpeedInsights />
    </div>
  );
}