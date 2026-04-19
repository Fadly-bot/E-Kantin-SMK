import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Store, Package, DollarSign, TrendingUp, Plus, Download, Image as ImageIcon, Loader2, Edit2, X, Wallet, Tag, CreditCard, Landmark as Bank, Smartphone, QrCode } from 'lucide-react';
import * as XLSX from 'xlsx';
import { User, Product, Transaction, View, Expense, SellerPaymentMethod } from '../types';

interface SellerDashboardProps {
  user: User;
  view?: View;
  selectedProductId?: number | null;
  onClearSelection?: () => void;
}

export default function SellerDashboard({ user, view = 'dashboard', selectedProductId, onClearSelection }: SellerDashboardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<SellerPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<SellerPaymentMethod | null>(null);
  
  // Form States
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', category: 'Makanan', image_url: '' });
  const [newExpense, setNewExpense] = useState({ itemName: '', amount: '', category: 'Beban', paymentMethod: 'Tunai' });
  const [newPaymentMethod, setNewPaymentMethod] = useState({ providerName: '', accountName: '', accountNumber: '', type: 'bank' as const, qrUrl: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [productsRes, reportsRes, paymentRes] = await Promise.all([
        fetch('/api/seller/products', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/seller/reports', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/seller/payment-methods', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const productsData = await productsRes.json();
      const reportsData = await reportsRes.json();
      const paymentData = await paymentRes.json();
      
      setProducts(Array.isArray(productsData) ? productsData : []);
      if (reportsData && reportsData.sales) {
        setSales(reportsData.sales);
        setExpenses(reportsData.expenses || []);
      }
      setPaymentMethods(Array.isArray(paymentData) ? paymentData : []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Enable real-time updates by polling every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedProductId && products.length > 0) {
      const product = products.find(p => p.id === selectedProductId);
      if (product) {
        openEditModal(product);
        onClearSelection?.();
      }
    }
  }, [selectedProductId, products, onClearSelection]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = editingProduct ? `/api/seller/products/${editingProduct.id}` : '/api/seller/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...newProduct, price: parseFloat(newProduct.price) })
      });
      
      if (res.ok) {
        setShowAddModal(false);
        setEditingProduct(null);
        setNewProduct({ name: '', description: '', price: '', category: 'Makanan', image_url: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Product save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/seller/expenses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...newExpense, amount: parseFloat(newExpense.amount) })
      });
      
      if (res.ok) {
        setShowExpenseModal(false);
        setNewExpense({ itemName: '', amount: '', category: 'Beban', paymentMethod: 'Tunai' });
        fetchData();
      }
    } catch (error) {
      console.error('Expense save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/seller/payment-methods', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...newPaymentMethod, id: editingPaymentMethod?.id })
      });
      
      if (res.ok) {
        setShowPaymentModal(false);
        setEditingPaymentMethod(null);
        setNewPaymentMethod({ providerName: '', accountName: '', accountNumber: '', type: 'bank', qrUrl: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Payment method save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePaymentMethod = async (id: number) => {
    if (!confirm('Hapus metode pembayaran ini?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/seller/payment-methods/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Delete payment method error:', error);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category,
      image_url: product.image_url || ''
    });
    setShowAddModal(true);
  };

  const exportToExcel = () => {
    // Prepare data matching the screenshot format
    const salesRows = sales.map(s => ({
      'ID_Transaksi': `TX${s.id.toString().padStart(3, '0')}`,
      'Tanggal': new Date(s.created_at).toISOString().split('T')[0],
      'Kategori': s.category || 'Makanan',
      'Item': s.product_name,
      'Harga_Satuan': s.price,
      'Kuantitas': s.quantity || 1,
      'Total_Masuk': s.price * (s.quantity || 1),
      'Total_Keluar': '',
      'Metode_Bayar': s.payment_method || 'Tunai',
      'Status': s.status || 'Selesai'
    }));

    const expenseRows = expenses.map(e => ({
      'ID_Transaksi': `EXP${e.id.toString().padStart(3, '0')}`,
      'Tanggal': new Date(e.created_at).toISOString().split('T')[0],
      'Kategori': e.category,
      'Item': e.item_name,
      'Harga_Satuan': '',
      'Kuantitas': '',
      'Total_Masuk': '',
      'Total_Keluar': e.amount,
      'Metode_Bayar': e.payment_method,
      'Status': 'Lunas'
    }));

    const totalIncome = sales.reduce((sum, s) => sum + (s.price * (s.quantity || 1)), 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalIncome - totalExpense;

    const data = [
      ...salesRows,
      ...expenseRows,
      {}, // Spacer
      { 'Item': 'Total Pendapatan', 'Harga_Satuan': totalIncome },
      { 'Item': 'Total Pengeluaran', 'Harga_Satuan': totalExpense },
      { 'Item': 'Laba/Rugi Bersih', 'Harga_Satuan': netProfit }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Transaksi');
    
    // Auto-size columns
    const colWidths = [
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, 
      { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, 
      { wch: 20 }, { wch: 15 }
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `Laporan_Transaksi_${user.full_name}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) return <div className="animate-pulse space-y-8">
    <div className="h-32 bg-slate-200 rounded-3xl"></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 h-96 bg-slate-200 rounded-3xl"></div>
      <div className="h-96 bg-slate-200 rounded-3xl"></div>
    </div>
  </div>;

  const totalRevenue = sales.reduce((sum, r) => sum + (r.price * (r.quantity || 1)), 0);
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const profitLoss = totalRevenue - totalExpenseAmount;

  return (
    <div className="space-y-8 pb-20">
      {/* Stats Overview - Only show on dashboard */}
      {view === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-fresh-green/10 rounded-2xl flex items-center justify-center mb-4">
              <DollarSign className="text-fresh-green w-5 h-5" />
            </div>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1">Pendapatan</p>
            <h3 className="text-xl font-extrabold text-deep-blue">Rp {totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <Wallet className="text-red-500 w-5 h-5" />
            </div>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1">Pengeluaran</p>
            <h3 className="text-xl font-extrabold text-red-500">Rp {totalExpenseAmount.toLocaleString()}</h3>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <TrendingUp className="text-blue-600 w-5 h-5" />
            </div>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1">Laba/Rugi</p>
            <h3 className={`text-xl font-extrabold ${profitLoss >= 0 ? 'text-fresh-green' : 'text-red-500'}`}>
              Rp {profitLoss.toLocaleString()}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-deep-blue/5 rounded-2xl flex items-center justify-center mb-4">
              <Package className="text-deep-blue w-5 h-5" />
            </div>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1">Pesanan</p>
            <h3 className="text-xl font-extrabold text-deep-blue">{sales.length}</h3>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 ${view === 'dashboard' ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8`}>
        {/* Products List */}
        <div className={`${view === 'dashboard' ? 'lg:col-span-2' : ''} space-y-8`}>
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                  <Store className="text-deep-blue w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-deep-blue">Manajemen Produk</h3>
              </div>
              <button 
                onClick={() => {
                  setEditingProduct(null);
                  setNewProduct({ name: '', description: '', price: '', category: 'Makanan', image_url: '' });
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 px-6 py-2 bg-fresh-green text-white rounded-xl font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-fresh-green/20"
              >
                <Plus className="w-5 h-5" /> Tambah
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {(products || []).map((product) => (
                <div key={product.id} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-fresh-green transition-all">
                  <div className="w-20 h-20 bg-slate-200 rounded-xl flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-slate-400 w-8 h-8" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-deep-blue">{product.name}</p>
                    <p className="text-xs text-slate-500 mb-2">{product.category}</p>
                    <p className="text-fresh-green font-bold">Rp {product.price.toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => openEditModal(product)}
                    className="p-2 text-slate-400 hover:text-fresh-green transition-colors"
                    title="Edit Produk"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Expenses Management */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                  <Wallet className="text-red-500 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-deep-blue">Biaya & Pengeluaran</h3>
              </div>
              <button 
                onClick={() => setShowExpenseModal(true)}
                className="flex items-center gap-2 px-6 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                <Plus className="w-5 h-5" /> Tambah Biaya
              </button>
            </div>
            <div className="p-8">
              <div className="space-y-4">
                {(expenses || []).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 bg-red-50/30 rounded-2xl border border-red-100 border-dashed">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Tag className="text-red-500 w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-deep-blue">{expense.item_name}</p>
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">{expense.category} • {expense.payment_method}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-500">-Rp {expense.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400">{new Date(expense.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {(expenses || []).length === 0 && (
                  <p className="text-center py-8 text-slate-400 font-medium">Belum ada catatan pengeluaran.</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Methods Management */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <CreditCard className="text-blue-600 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-deep-blue">Metode Pembayaran (Bank/E-Wallet)</h3>
              </div>
              <button 
                onClick={() => {
                  setEditingPaymentMethod(null);
                  setNewPaymentMethod({ providerName: '', accountName: '', accountNumber: '', type: 'bank', qrUrl: '' });
                  setShowPaymentModal(true);
                }}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-5 h-5" /> Tambah Akun
              </button>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(paymentMethods || []).map((method) => (
                  <div key={method.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 group relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-100">
                          {method.type === 'bank' ? <Bank className="text-blue-600 w-6 h-6" /> : <Smartphone className="text-fresh-green w-6 h-6" />}
                        </div>
                        <div>
                          <p className="font-bold text-deep-blue">{method.provider_name}</p>
                          <p className="text-xs text-slate-500">{method.account_name}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingPaymentMethod(method);
                            setNewPaymentMethod({
                              providerName: method.provider_name,
                              accountName: method.account_name,
                              accountNumber: method.account_number,
                              type: method.type,
                              qrUrl: method.qr_url || ''
                            });
                            setShowPaymentModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeletePaymentMethod(method.id)} className="p-2 text-slate-400 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <p className="font-mono font-bold text-deep-blue">{method.account_number}</p>
                      {method.qr_url && <QrCode className="text-slate-400 w-5 h-5" />}
                    </div>
                  </div>
                ))}
              </div>
              {(paymentMethods || []).length === 0 && (
                <p className="text-center py-8 text-slate-400 font-medium">Belum ada metode pembayaran yang ditambahkan.</p>
              )}
            </div>
          </div>
        </div>

        {/* Reports & Exports */}
        {view === 'dashboard' && (
          <div className="space-y-8">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden sticky top-8">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-deep-blue">Riwayat Penjualan</h3>
                <button 
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all"
                  title="Ekspor ke Excel"
                >
                  <Download className="w-4 h-4" /> Excel
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[1000px] overflow-y-auto">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">Pesanan Terbaru</p>
                {(sales || []).map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-bold text-deep-blue text-sm">{sale.product_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-fresh-green font-bold uppercase tracking-widest bg-fresh-green/10 px-2 py-0.5 rounded">x{sale.quantity || 1}</span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{sale.customer_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-fresh-green font-bold text-sm">Rp {(sale.price * (sale.quantity || 1)).toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400">{new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
                {(sales || []).length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-slate-400 font-medium">Belum ada transaksi</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-deep-blue/40 backdrop-blur-sm shadow-2xl" onClick={() => setShowAddModal(false)}></div>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-2xl"
          >
             <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-extrabold text-deep-blue">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-fresh-green transition-colors"><X className="w-8 h-8" /></button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nama Produk</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-deep-blue focus:ring-2 focus:ring-fresh-green outline-none"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Kategori</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-deep-blue focus:ring-2 focus:ring-fresh-green outline-none"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Camilan">Camilan</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Harga (Rp)</label>
                  <input 
                    required
                    type="number" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-deep-blue focus:ring-2 focus:ring-fresh-green outline-none"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  />
                </div>
              </div>
              {/* Product Image Upload UI kept from original but wrapped */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Upload Foto Produk</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                    {newProduct.image_url ? (
                      <img src={newProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-slate-300 w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      className="text-xs block w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-fresh-green/10 file:text-fresh-green hover:file:bg-fresh-green/20"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setNewProduct({...newProduct, image_url: reader.result as string});
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Deskripsi Produk</label>
                <textarea 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-deep-blue focus:ring-2 focus:ring-fresh-green outline-none"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="Masukkan deskripsi produk..."
                />
              </div>
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full py-4 bg-deep-blue text-white rounded-2xl font-bold hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : editingProduct ? 'Simpan Perubahan' : 'Simpan Produk'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-deep-blue/40 backdrop-blur-sm shadow-2xl" onClick={() => setShowExpenseModal(false)}></div>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-extrabold text-deep-blue">Tambah Pengeluaran</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-8 h-8" /></button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nama Item/Beban</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-deep-blue focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="Contoh: Gas LPG 3kg"
                  value={newExpense.itemName}
                  onChange={(e) => setNewExpense({...newExpense, itemName: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Kategori</label>
                  <input 
                    required
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-deep-blue focus:ring-2 focus:ring-red-500 outline-none"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                    placeholder="Beban / Bahan"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Jumlah (Rp)</label>
                  <input 
                    required
                    type="number" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-deep-blue focus:ring-2 focus:ring-red-500 outline-none"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Metode Pembayaran</label>
                <select 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-deep-blue focus:ring-2 focus:ring-red-500 outline-none"
                  value={newExpense.paymentMethod}
                  onChange={(e) => setNewExpense({...newExpense, paymentMethod: e.target.value})}
                >
                  <option value="Tunai">Tunai</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Kas Bon">Kas Bon</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={isSaving || !newExpense.itemName || !newExpense.amount}
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Pengeluaran'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-deep-blue/40 backdrop-blur-sm shadow-2xl" onClick={() => setShowPaymentModal(false)}></div>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-extrabold text-deep-blue">
                {editingPaymentMethod ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-blue-600 transition-colors"><X className="w-8 h-8" /></button>
            </div>
            <form onSubmit={handleSavePaymentMethod} className="space-y-6">
              <div className="flex gap-4 p-1 bg-slate-100 rounded-2xl">
                <button 
                  type="button"
                  onClick={() => setNewPaymentMethod({...newPaymentMethod, type: 'bank'})}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${newPaymentMethod.type === 'bank' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Bank
                </button>
                <button 
                  type="button"
                  onClick={() => setNewPaymentMethod({...newPaymentMethod, type: 'e-wallet'})}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${newPaymentMethod.type === 'e-wallet' ? 'bg-white text-fresh-green shadow-sm' : 'text-slate-500'}`}
                >
                  E-Wallet
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nama Provider</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-deep-blue focus:ring-2 focus:ring-blue-600 outline-none"
                    placeholder="BCA, DANA, OVO..."
                    value={newPaymentMethod.providerName}
                    onChange={(e) => setNewPaymentMethod({...newPaymentMethod, providerName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">No. Rekening/HP</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-deep-blue focus:ring-2 focus:ring-blue-600 outline-none"
                    value={newPaymentMethod.accountNumber}
                    onChange={(e) => setNewPaymentMethod({...newPaymentMethod, accountNumber: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Atas Nama (Pemilik)</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-deep-blue focus:ring-2 focus:ring-blue-600 outline-none"
                  value={newPaymentMethod.accountName}
                  onChange={(e) => setNewPaymentMethod({...newPaymentMethod, accountName: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Upload QRIS (Opsional)</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                    {newPaymentMethod.qrUrl ? (
                      <img src={newPaymentMethod.qrUrl} alt="QR Preview" className="w-full h-full object-cover" />
                    ) : (
                      <QrCode className="text-slate-300 w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      className="text-xs block w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setNewPaymentMethod({...newPaymentMethod, qrUrl: reader.result as string});
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSaving || !newPaymentMethod.providerName || !newPaymentMethod.accountNumber}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : editingPaymentMethod ? 'Simpan Perubahan' : 'Tambah Metode Pembayaran'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
