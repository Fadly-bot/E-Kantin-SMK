import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShoppingBag, Store, UtensilsCrossed, Star, Clock, X, ChevronRight, Check, CreditCard, Wallet, Banknote, Loader2, QrCode, Smartphone, ExternalLink, Camera, Upload, Image as ImageIcon, AlertCircle, Landmark as Bank } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Product, User, SellerPaymentMethod } from '../types';

interface MenuListProps {
  user: User;
  selectedProductId?: number | null;
  onClearSelection?: () => void;
}

export default function MenuList({ user, selectedProductId, onClearSelection }: MenuListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sellerPaymentMethods, setSellerPaymentMethods] = useState<SellerPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [shippingMethod, setShippingMethod] = useState('Pickup');
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Pickup');
  const [selectedSellerMethod, setSelectedSellerMethod] = useState<SellerPaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrisProof, setQrisProof] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/search?q=', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setProducts(data.products || []);
        setSellerPaymentMethods(data.paymentMethods || []);
      } else {
        console.warn('MenuList fetch returned non-JSON:', await res.text());
      }
    } catch (error) {
      console.error('Fetch products error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(fetchProducts, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedProductId && products.length > 0) {
      const product = products.find(p => p.id === selectedProductId);
      if (product) {
        setSelectedProduct(product);
        setQuantity(1);
        setShippingMethod('Pickup');
        onClearSelection?.();
      }
    }
  }, [selectedProductId, products, onClearSelection]);

  const handlePurchase = async () => {
    if (!selectedProduct) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity,
          paymentMethod: selectedSellerMethod ? selectedSellerMethod.provider_name : paymentMethod,
          shippingMethod
        })
      });
      
      if (res.ok) {
        setShowCheckout(false);
        setSelectedProduct(null);
        alert('Pesanan berhasil dibuat!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrisProof(reader.result as string);
        setVerificationError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const categories = ['Semua', 'Makanan', 'Minuman', 'Camilan'];
  const filteredProducts = products.filter(p => 
    (category === 'Semua' || p.category === category) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const currentSellerMethods = selectedProduct 
    ? sellerPaymentMethods.filter(m => m.seller_id === selectedProduct.seller_id)
    : [];

  const basePaymentMethods = [
    { id: 'Pickup', name: 'Bayar di Kasir', icon: Store, desc: 'Bayar tunai saat ambil pesanan' },
    { id: 'QRIS', name: 'QRIS (Pusat)', icon: QrCode, desc: 'Scan QRIS Sekolah / Pusat' },
    { id: 'Transfer', name: 'Transfer Bank', icon: CreditCard, desc: 'Transfer ke Rekening Pusat' },
    { id: 'E-Wallet', name: 'E-Wallet', icon: Smartphone, desc: 'Top-up / Bayar via E-Wallet' }
  ];

  const displayPaymentMethods = [
    ...basePaymentMethods,
    ...currentSellerMethods.map(m => ({
      id: `seller_${m.id}`,
      name: m.provider_name,
      icon: m.type === 'bank' ? Bank : Smartphone,
      desc: m.account_name,
      original: m
    }))
  ];

  if (isLoading) return (
    <div className="p-8 animate-pulse grid grid-cols-1 md:grid-cols-3 gap-8">
      {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-slate-200 rounded-3xl"></div>)}
    </div>
  );

  return (
    <div className="space-y-12 pb-24">
      {/* Header section with categories and search */}
      <div className="relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex overflow-x-auto pb-2 md:pb-0 gap-3 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap shadow-sm ${
                  category === cat 
                    ? 'bg-fresh-green text-white shadow-lg shadow-emerald-200 scale-105' 
                    : 'bg-white text-slate-400 hover:text-deep-blue border border-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-fresh-green transition-colors" />
            <input 
              type="text"
              placeholder="Cari makanan favoritmu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-80 pl-14 pr-8 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm focus:ring-2 focus:ring-fresh-green outline-none font-bold text-deep-blue placeholder:text-slate-300"
            />
          </div>
        </div>
      </div>

      {/* Product list */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
        {(filteredProducts || []).map((product) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={product.id} 
            onClick={() => {
              setSelectedProduct(product);
              setQuantity(1);
              setShippingMethod('Pickup');
            }}
            className="group bg-white rounded-3xl sm:rounded-[2.5rem] p-3 sm:p-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all hover:-translate-y-1 cursor-pointer flex flex-row sm:flex-col gap-4 sm:gap-6"
          >
            <div className="relative w-28 h-28 sm:w-full sm:aspect-video bg-slate-100 rounded-2xl sm:rounded-[2rem] overflow-hidden flex-shrink-0">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UtensilsCrossed className="w-8 sm:w-12 h-8 sm:h-12 text-slate-300" />
                </div>
              )}
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white/90 backdrop-blur-md px-2 sm:px-4 py-1 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-1 sm:gap-2 shadow-xl border border-white/50">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 fill-amber-400" />
                <span className="text-[10px] sm:text-xs font-black text-deep-blue">4.8</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <span className="text-[10px] sm:text-xs font-bold text-fresh-green uppercase tracking-widest block mb-1">{product.category}</span>
                <h4 className="text-sm sm:text-xl font-black text-deep-blue line-clamp-1 mb-1 sm:mb-2">{product.name}</h4>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-400 font-bold">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>10-15 Min</span>
                </div>
              </div>
              <div className="mt-2 sm:mt-6 flex items-center justify-between">
                <span className="text-sm sm:text-2xl font-black text-fresh-green">Rp {product.price.toLocaleString()}</span>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-fresh-green/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-fresh-green group-hover:bg-fresh-green group-hover:text-white transition-all shadow-lg shadow-emerald-50 sm:shadow-emerald-100">
                  <ShoppingBag className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Product detail modal */}
      <AnimatePresence>
        {selectedProduct && !showCheckout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-deep-blue/40 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row"
            >
              <div className="w-full lg:w-1/2 bg-slate-100 relative">
                {selectedProduct.image_url ? (
                  <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full min-h-[300px] flex items-center justify-center text-slate-300">
                    <UtensilsCrossed className="w-24 h-24" />
                  </div>
                )}
                <button onClick={() => setSelectedProduct(null)} className="absolute top-8 left-8 p-3 bg-white/90 backdrop-blur-md rounded-2xl text-deep-blue scale-110 shadow-xl border border-white hover:bg-white transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 p-8 sm:p-14 space-y-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-fresh-green/10 text-fresh-green px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">{selectedProduct.category}</span>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                    </div>
                  </div>
                  <h3 className="text-4xl sm:text-5xl font-black text-deep-blue tracking-tighter">{selectedProduct.name}</h3>
                  <p className="text-slate-400 leading-relaxed font-bold">{selectedProduct.description || 'Nikmati kelezatan menu favorit di kantin sekolah dengan bahan berkualitas dan higienis.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Harga</p>
                    <span className="text-3xl font-black text-fresh-green">Rp {selectedProduct.price.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rating</p>
                    <span className="text-3xl font-black text-deep-blue">4.8 <span className="text-sm text-slate-400 font-bold">(120+)</span></span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-[2rem] border border-slate-100 font-bold">
                    <div className="flex-1 flex flex-col pl-6">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest">Kuantitas</span>
                      <span className="text-deep-blue text-lg">Menu Terpilih</span>
                    </div>
                    <div className="flex items-center p-2 bg-white rounded-3xl shadow-sm border border-slate-100">
                      <button 
                        onClick={() => quantity > 1 && setQuantity(prev => prev - 1)}
                        className="w-12 h-12 flex items-center justify-center font-black text-slate-400 hover:text-fresh-green transition-colors disabled:opacity-30"
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-xl font-black text-deep-blue">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(prev => prev + 1)}
                        className="w-12 h-12 flex items-center justify-center font-black text-slate-400 hover:text-fresh-green transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-50 text-slate-500 font-medium">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pengiriman</span>
                      <div className="flex gap-2">
                        {['Antar', 'Ambil'].map((opt) => (
                          <button 
                            key={opt}
                            onClick={() => setShippingMethod(opt === 'Ambil' ? 'Pickup' : 'Delivery')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              (opt === 'Ambil' ? shippingMethod === 'Pickup' : shippingMethod === 'Delivery')
                                ? 'bg-fresh-green text-white shadow-md'
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {opt === 'Ambil' ? 'Ambil di Tempat' : 'Antar ke Kelas'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className="flex-1 py-5 rounded-2xl border-2 border-deep-blue font-bold text-deep-blue hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                    <ShoppingBag className="w-5 h-5" /> Masukkan Keranjang
                  </button>
                  <button onClick={() => setShowCheckout(true)} className="flex-1 py-5 rounded-2xl bg-fresh-green text-white font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200">
                    Beli Sekarang
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && selectedProduct && (
          <div className="fixed inset-0 z-[110] overflow-y-auto py-10 px-4 md:px-8 no-scrollbar">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-deep-blue/40 backdrop-blur-sm" onClick={() => setShowCheckout(false)} />
            <div className="min-h-full flex items-center justify-center">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-3xl bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 lg:p-14 shadow-2xl space-y-8 sm:space-y-10"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl sm:text-2xl font-black text-deep-blue">Metode Pembayaran</h3>
                  <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-deep-blue"><X className="w-6 h-6 sm:w-8 sm:h-8" /></button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {displayPaymentMethods.map((method) => (
                    <button 
                      key={method.id}
                      onClick={() => {
                        setPaymentMethod(method.id);
                        if ('original' in method) {
                          setSelectedSellerMethod(method.original as SellerPaymentMethod);
                        } else {
                          setSelectedSellerMethod(null);
                        }
                      }}
                      className={`p-4 sm:p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 sm:gap-3 relative ${
                        paymentMethod === method.id 
                          ? 'border-fresh-green bg-emerald-50/10' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${paymentMethod === method.id ? 'bg-fresh-green text-white' : 'bg-slate-50 text-slate-400'}`}>
                        <method.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="text-center">
                        <p className={`font-bold text-[10px] sm:text-sm ${paymentMethod === method.id ? 'text-fresh-green' : 'text-slate-500'}`}>{method.name}</p>
                        <p className="text-[8px] sm:text-[10px] text-slate-400 line-clamp-1">{method.desc}</p>
                      </div>
                      {paymentMethod === method.id && <div className="absolute top-2 right-2"><Check className="w-4 h-4 text-fresh-green" /></div>}
                    </button>
                  ))}
                </div>

                {selectedSellerMethod && (
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-6">
                    <div className="flex flex-col items-center justify-center space-y-6">
                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
                          <img 
                            src={selectedSellerMethod.qr_url || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${selectedSellerMethod.account_number}`} 
                            alt="Payment QR Code" 
                            className="w-64 h-64 object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-black text-deep-blue uppercase tracking-widest">{selectedSellerMethod.provider_name}</p>
                          <p className="text-sm text-slate-500 font-bold uppercase tracking-tight mt-1">{selectedSellerMethod.account_name}</p>
                          <div className="flex items-center justify-center gap-2 mt-2">
                             <p className="text-xs font-mono font-bold text-slate-400">{selectedSellerMethod.account_number}</p>
                             <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(selectedSellerMethod.account_number);
                                  alert('Nomor rekening/ID disalin!');
                                }}
                                className="p-1 px-2 bg-slate-100 text-slate-500 rounded text-[9px] font-bold hover:bg-slate-200 transition-colors"
                              >
                                Salin
                              </button>
                          </div>
                          <p className="text-[10px] text-fresh-green font-bold uppercase tracking-widest mt-4">Scan QR untuk membayar</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200">
                      <div className="text-center mb-4">
                        <p className="font-bold text-deep-blue">Upload Bukti Transfer/Bayar</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-4">Mohon sertakan bukti transaksi yang sah</p>
                      </div>
                      
                      <div className="relative">
                        {isVerifying ? (
                          <div className="w-full h-40 border-2 border-emerald-100 bg-emerald-50/30 rounded-2xl flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 text-fresh-green animate-spin" />
                            <p className="text-sm font-bold text-fresh-green animate-pulse">Memverifikasi Bukti...</p>
                          </div>
                        ) : qrisProof ? (
                          <div className="relative rounded-2xl overflow-hidden border-2 border-fresh-green group">
                            <img src={qrisProof} alt="Bukti Pembayaran" className="w-full h-40 object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                              <button onClick={() => setQrisProof(null)} className="p-2 bg-white rounded-full text-red-500 hover:scale-110 transition-transform">
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full min-h-[10rem] border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-white hover:border-fresh-green transition-all group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                              <div className="p-3 bg-slate-50 rounded-full group-hover:bg-emerald-50 transition-colors mb-3">
                                <Camera className="w-6 h-6 text-slate-400 group-hover:text-fresh-green" />
                              </div>
                              <p className="text-sm font-bold text-slate-500 group-hover:text-deep-blue text-center">Klik untuk upload foto bukti bayar</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                          </label>
                        )}
                      </div>

                      {verificationError && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-red-600 font-bold leading-tight">{verificationError}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* QRIS Pusat Section */}
                {paymentMethod === 'QRIS' && (
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-6">
                    <div className="text-center space-y-2">
                      <p className="font-bold text-deep-blue">1. Scan & Isi Form</p>
                      <p className="text-xs text-slate-500">Scan QRIS di bawah dan isi Google Form</p>
                    </div>
                    
                    <div className="flex justify-center flex-col items-center gap-4">
                      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 inline-block">
                        <img 
                          src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://docs.google.com/forms/d/e/1FAIpQLSd9mrNSLy4dlnGA1nrDi6TiV-eJfjA5q318qMpx3IeCcWfo0g/viewform?usp=header" 
                          alt="QRIS Code" 
                          className="w-40 h-40 object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      
                      <a 
                        href="https://docs.google.com/forms/d/e/1FAIpQLSd9mrNSLy4dlnGA1nrDi6TiV-eJfjA5q318qMpx3IeCcWfo0g/viewform?usp=header" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-fresh-green font-bold text-xs hover:underline"
                      >
                        Buka Google Form <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="pt-6 border-t border-slate-200">
                      <div className="text-center mb-4">
                        <p className="font-bold text-deep-blue">2. Upload Bukti Pengisian</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-4">Upload screenshot konfirmasi form</p>
                      </div>
                      
                      <div className="relative">
                        {isVerifying ? (
                          <div className="w-full h-40 border-2 border-emerald-100 bg-emerald-50/30 rounded-2xl flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 text-fresh-green animate-spin" />
                            <p className="text-sm font-bold text-fresh-green animate-pulse">Memverifikasi Bukti...</p>
                          </div>
                        ) : qrisProof ? (
                          <div className="relative rounded-2xl overflow-hidden border-2 border-fresh-green group">
                            <img src={qrisProof} alt="Bukti QRIS" className="w-full h-40 object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                              <button onClick={() => setQrisProof(null)} className="p-2 bg-white rounded-full text-red-500 hover:scale-110 transition-transform">
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full min-h-[10rem] border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-white hover:border-fresh-green transition-all group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                              <div className="p-3 bg-slate-50 rounded-full group-hover:bg-emerald-50 transition-colors mb-3">
                                <Camera className="w-6 h-6 text-slate-400 group-hover:text-fresh-green" />
                              </div>
                              <p className="text-sm font-bold text-slate-500 group-hover:text-deep-blue text-center">Klik untuk upload foto bukti bayar</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Generic Transfer / E-Wallet Section */}
                {(paymentMethod === 'Transfer' || paymentMethod === 'E-Wallet') && (
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-6">
                    <div className="text-center space-y-2">
                        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                        <p className="font-bold text-deep-blue">Konfirmasi Manual</p>
                        <p className="text-xs text-slate-500">Silakan hubungi admin sekolah atau kunjungi kasir untuk detail akun transfer pusat.</p>
                    </div>

                    <div className="pt-6 border-t border-slate-200">
                      <div className="text-center mb-4">
                        <p className="font-bold text-deep-blue">Upload Bukti Transfer</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-4">Upload bukti transfer Anda di sini</p>
                      </div>
                      
                      <div className="relative">
                        {qrisProof ? (
                          <div className="relative rounded-2xl overflow-hidden border-2 border-fresh-green group">
                            <img src={qrisProof} alt="Bukti Transfer" className="w-full h-40 object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                              <button onClick={() => setQrisProof(null)} className="p-2 bg-white rounded-full text-red-500 hover:scale-110 transition-transform">
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full min-h-[10rem] border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-white hover:border-fresh-green transition-all group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                              <div className="p-3 bg-slate-50 rounded-full group-hover:bg-emerald-50 transition-colors mb-3">
                                <Camera className="w-6 h-6 text-slate-400 group-hover:text-fresh-green" />
                              </div>
                              <p className="text-sm font-bold text-slate-500 group-hover:text-deep-blue text-center">Klik untuk upload foto bukti bayar</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-6 md:pt-10 border-t border-slate-100">
                  <div className="flex justify-end gap-16 text-slate-500 font-medium text-sm">
                    <span>Subtotal Pesanan</span>
                    <span className="text-deep-blue font-bold">Rp {(selectedProduct.price * quantity).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-end gap-16 text-slate-500 font-medium text-sm">
                    <span>Subtotal Pengiriman</span>
                    <span className="text-deep-blue font-bold">Rp {shippingMethod === 'Pickup' ? '0' : '3.500'}</span>
                  </div>
                  <div className="flex justify-end gap-16 text-slate-500 font-medium text-sm">
                    <span>Biaya Layanan</span>
                    <span className="text-deep-blue font-bold">Rp 2.000</span>
                  </div>
                  <div className="flex justify-end items-end gap-8 pt-6">
                    <span className="text-slate-500 font-bold">Total Pembayaran</span>
                    <span className="text-4xl font-black text-red-500">Rp {(selectedProduct.price * quantity + (shippingMethod === 'Pickup' ? 0 : 3500) + 2000).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button 
                    onClick={handlePurchase}
                    disabled={isProcessing || isVerifying || (paymentMethod !== 'Pickup' && !qrisProof)}
                    className={`w-full md:w-64 py-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                      (isProcessing || isVerifying || (paymentMethod !== 'Pickup' && !qrisProof))
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-deep-blue text-white hover:bg-slate-800 shadow-lg'
                    }`}
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buat Pesanan'}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-slate-200" />
          </div>
          <h3 className="text-xl font-bold text-deep-blue mb-2">Menu tidak ditemukan</h3>
          <p className="text-slate-400">Coba kata kunci lain atau pilih kategori yang berbeda.</p>
        </div>
      )}
    </div>
  );
}
