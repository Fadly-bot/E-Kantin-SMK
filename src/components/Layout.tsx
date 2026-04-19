import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  History, 
  LogOut, 
  Bell, 
  User as UserIcon,
  Search,
  Menu as MenuIcon,
  X,
  UtensilsCrossed,
  Check
} from 'lucide-react';
import { User, View, Notification, Product } from '../types';

interface LayoutProps {
  user: User;
  currentView: View;
  setView: (view: View) => void;
  onLogout: () => void;
  onSelectId?: (id: number) => void;
  children: React.ReactNode;
}

export default function Layout({ user, currentView, setView, onLogout, onSelectId, children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ products: Product[], students: any[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        console.log('Server health:', data);
      } catch (err) {
        console.error('Server is unreachable:', err);
      }
    };
    checkHealth();

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found, skipping notification fetch');
          return;
        }

        const res = await fetch('/api/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`Notifications fetch failed (${res.status}):`, errorText);
          return;
        }

        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setNotifications(Array.isArray(data) ? data : []);
        } else {
          console.warn('Notifications fetch returned non-JSON:', await res.text());
        }
      } catch (error) {
        console.error('Fetch notifications error (possible network or CORS issue):', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        const performSearch = async () => {
          setIsSearching(true);
          try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // Check if response is actually JSON before parsing
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const data = await res.json();
              if (!data.message) {
                setSearchResults(data);
              }
            } else {
              const text = await res.text();
              console.warn('Search returned non-JSON response:', text);
            }
          } catch (error) {
            console.error('Search error:', error);
          } finally {
            setIsSearching(false);
          }
        };
        performSearch();
      } else {
        setSearchResults(null);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Clear all notifications error:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'Riwayat', icon: History },
  ];

  if (['student', 'teacher', 'staff'].includes(user.role as string)) {
    navItems.splice(2, 0, { id: 'menu-list', label: 'Daftar Menu', icon: UtensilsCrossed });
  }

  if (user.role === 'seller') {
    navItems.splice(1, 0, { id: 'manage-menu', label: 'Kelola Menu', icon: UtensilsCrossed });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-100 p-8 fixed h-full shadow-2xl shadow-slate-200/50">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-fresh-green rounded-xl flex items-center justify-center shadow-lg shadow-fresh-green/20">
            <span className="text-white font-black text-xl">E</span>
          </div>
          <span className="text-deep-blue font-extrabold text-xl tracking-tight">E-Kantin SMK</span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                currentView === item.id 
                  ? 'bg-deep-blue text-white shadow-xl shadow-deep-blue/10' 
                  : 'text-slate-400 hover:text-deep-blue hover:bg-slate-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-100">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-slate-500 hover:text-deep-blue"
          >
            <MenuIcon className="w-6 h-6" />
          </button>

          <div className="relative hidden md:block">
            <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-900 w-96 transform transition-all focus-within:w-[32rem] focus-within:shadow-xl">
              <Search className="w-4 h-4 text-slate-900" />
              <input 
                type="text" 
                placeholder="Cari menu atau siswa..." 
                className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 font-bold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Search Results Dropdown */}
            {searchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 max-h-[32rem] overflow-y-auto z-50">
                {searchResults.products.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Menu Kantin</p>
                    <div className="space-y-1">
                      {searchResults.products.map(p => (
                        <button 
                          key={p.id} 
                          onClick={() => {
                            if (user.role === 'student' || user.role === 'teacher' || user.role === 'staff' || user.role === 'admin') {
                              setView('menu-list');
                              onSelectId?.(p.id);
                            } else if (user.role === 'seller') {
                              setView('manage-menu');
                              onSelectId?.(p.id);
                            }
                            setSearchQuery('');
                          }}
                          className="w-full text-left p-2 rounded-xl hover:bg-slate-50 flex items-center justify-between group"
                        >
                          <span className="font-bold text-deep-blue group-hover:text-fresh-green">{p.name}</span>
                          <span className="text-xs text-slate-400">{p.category}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {searchResults.students.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Siswa</p>
                    <div className="space-y-1">
                      {searchResults.students.map(s => (
                        <button 
                          key={s.id} 
                          onClick={() => {
                            setView('dashboard');
                            setSearchQuery('');
                          }}
                          className="w-full text-left p-2 rounded-xl hover:bg-slate-50 flex items-center justify-between group"
                        >
                          <span className="font-bold text-deep-blue group-hover:text-fresh-green">{s.full_name}</span>
                          <span className="text-xs text-slate-400">{s.class_name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {((searchResults.products.length === 0 || (currentView !== 'menu-list' && currentView !== 'dashboard')) && 
                  (searchResults.students.length === 0 || (user.role !== 'teacher' && user.role !== 'admin' && currentView !== 'dashboard'))) && (
                  <div className="py-8 text-center">
                    <p className="text-slate-400 font-medium">Tidak ada hasil ditemukan untuk konteks ini</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-400 hover:text-deep-blue transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-fresh-green text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-white ring-1 ring-fresh-green">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                  >
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="font-bold text-deep-blue">Notifications</h4>
                      <button 
                        onClick={clearAllNotifications}
                        className="text-xs font-bold text-fresh-green hover:text-emerald-600 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto px-2 py-2">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => !n.is_read && markAsRead(n.id)}
                            className={`p-4 rounded-2xl mb-1 cursor-pointer transition-all ${n.is_read ? 'bg-white hover:bg-slate-50' : 'bg-fresh-green/5 border-l-4 border-fresh-green'}`}
                          >
                            <p className="text-sm font-bold text-deep-blue mb-1">{n.title}</p>
                            <p className="text-xs text-slate-600 line-clamp-2 mb-2">{n.message}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(n.created_at).toLocaleTimeString()}</p>
                              {!n.is_read && <div className="w-2 h-2 bg-fresh-green rounded-full"></div>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center">
                          <p className="text-slate-400 font-medium">No new notifications</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="h-10 w-px bg-slate-100 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-deep-blue leading-none">{user.full_name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{user.role}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                <UserIcon className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-8 lg:p-10">
          {children}
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-deep-blue/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <motion.aside 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            className="absolute top-0 left-0 bottom-0 w-72 bg-white p-8 flex flex-col"
          >
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-fresh-green rounded-lg flex items-center justify-center">
                  <span className="text-white font-black">E</span>
                </div>
                <span className="text-deep-blue font-extrabold text-lg">E-Kantin</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)}><MenuIcon className="w-6 h-6 text-slate-400" /></button>
            </div>

            <nav className="flex-1 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id as View);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                    currentView === item.id 
                      ? 'bg-deep-blue text-white shadow-lg shadow-deep-blue/10' 
                      : 'text-slate-400 hover:text-deep-blue'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>

            <button 
              onClick={onLogout}
              className="mt-auto flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-red-500 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              Keluar
            </button>
          </motion.aside>
        </div>
      )}
    </div>
  );
}
