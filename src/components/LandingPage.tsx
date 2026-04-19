import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowRight, Utensils, Clock, ShieldCheck, X } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/products/search?q=${query}`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-deep-blue font-sans">
      {/* Background Blobs - Deep Blue Palette */}
      <div className="absolute top-0 -left-10 w-96 h-96 bg-fresh-green rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute top-0 -right-10 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-20 left-40 w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

      <nav className="relative z-10 flex items-center justify-between px-6 py-6 lg:px-12">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-fresh-green rounded-xl flex items-center justify-center">
            <Utensils className="text-white w-6 h-6" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">E-Kantin SMK</span>
        </div>
        <button 
          onClick={onStart}
          className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full font-medium transition-all backdrop-blur-md border border-white/10"
        >
          Mulai
        </button>
      </nav>

      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-32 text-center max-w-5xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight"
        >
          Pesan Makanan Kantin <br />
          <span className="text-fresh-green">Lebih Mudah</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-slate-400/80 text-lg lg:text-xl mb-12 max-w-2xl"
        >
          Sistem kantin digital modern untuk lingkungan SMK. Pesan, bayar, dan pantau riwayat transaksi dalam satu aplikasi.
        </motion.p>

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSearch}
          className="relative w-full max-w-2xl mb-16"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-fresh-green to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-slate-950/80 backdrop-blur-xl rounded-2xl p-2 border border-white/5">
              <Search className="ml-4 text-slate-500 w-6 h-6" />
              <input 
                type="text" 
                placeholder="Cari makanan favoritmu..." 
                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-white px-4 py-3 text-lg placeholder:text-slate-600/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit"
                className="bg-fresh-green hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-fresh-green/20 flex items-center gap-2"
              >
                {isSearching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Search className="w-5 h-5" />}
                Cari
              </button>
            </div>
          </div>

          <AnimatePresence>
            {searchQuery.trim() && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full left-0 right-0 mt-4 bg-blue-black/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 text-left shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] z-20 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-white font-black text-xl tracking-tight">Hasil Pencarian</h3>
                  <button onClick={() => setSearchQuery('')} className="text-fresh-green/50 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                  {isSearching && searchResults.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-10 h-10 border-4 border-fresh-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Mencari menu...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((p) => (
                      <motion.div 
                        key={p.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={onStart}
                        className="group flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-transparent hover:border-fresh-green/30 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-900 rounded-xl overflow-hidden flex-shrink-0">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600">
                                <Utensils className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-bold group-hover:text-fresh-green transition-colors">{p.name}</p>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{p.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-fresh-green font-black text-lg">Rp {p.price.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tersedia</p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Menu tidak ditemukan</p>
                      <p className="text-slate-600 text-sm mt-1 mb-8 italic">"{searchQuery}"</p>
                      <button onClick={() => setSearchQuery('')} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all border border-white/10">
                        Reset Pencarian
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {[
            { icon: Utensils, title: "Menu Beragam", desc: "Berbagai pilihan makanan sehat dan bergizi." },
            { icon: Clock, title: "Hemat Waktu", desc: "Pesan duluan, ambil kemudian tanpa antre." },
            { icon: ShieldCheck, title: "Transaksi Aman", desc: "Pembayaran digital yang transparan dan aman." },
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl text-left hover:bg-white/10 transition-all group"
            >
              <div className="w-12 h-12 bg-fresh-green/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="text-fresh-green w-5 h-5" />
              </div>
              <h3 className="text-white font-bold text-xl mb-3">{feature.title}</h3>
              <p className="text-slate-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.button 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={onStart}
          className="mt-20 flex items-center gap-2 text-white font-bold text-lg group"
        >
          Mulai Sekarang 
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </main>
    </div>
  );
}
