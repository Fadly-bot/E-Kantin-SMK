import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { History, Search, Filter, Download as DownloadIcon, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { User, Transaction } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TransactionHistoryProps {
  user: User;
}

export default function TransactionHistory({ user }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/student/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setTransactions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // deep-blue color
    doc.text('E-Kantin - Riwayat Transaksi', 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Nama Pengguna: ${user.full_name}`, 14, 30);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 37);
    
    // Table
    const tableColumn = ["No", "Transaksi", "Vendor", "Tanggal", "Status", "Jumlah"];
    const tableRows = transactions.map((tx, index) => [
      index + 1,
      tx.product_name,
      tx.vendor,
      new Date(tx.created_at).toLocaleDateString('id-ID'),
      tx.status,
      `Rp ${tx.price.toLocaleString()}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5 }
    });

    doc.save(`Riwayat_Transaksi_${user.full_name.replace(/\s+/g, '_')}.pdf`);
  };

  if (isLoading) return <div className="animate-pulse space-y-8">
    <div className="h-20 bg-slate-200 rounded-2xl"></div>
    <div className="h-96 bg-slate-200 rounded-[2rem]"></div>
  </div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-deep-blue">Riwayat Transaksi</h2>
          <p className="text-slate-500">Pantau seluruh aktivitas pengeluaran dan pemasukan Anda.</p>
        </div>
        <button 
          onClick={exportToPDF}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
        >
          <DownloadIcon className="w-5 h-5" /> Ekspor PDF
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari transaksi..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-fresh-green/20 focus:border-fresh-green outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Transaksi</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Vendor</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Tanggal</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(transactions || []).map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                        <ArrowUpRight className="text-red-500 w-5 h-5" />
                      </div>
                      <span className="font-bold text-deep-blue">{tx.product_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-slate-500 font-medium">{tx.vendor}</td>
                  <td className="px-8 py-5 text-slate-500 font-medium">{new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${tx.status === 'Success' ? 'bg-fresh-green/10 text-fresh-green' : 'bg-red-100 text-red-600'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-bold text-deep-blue">
                    - Rp {tx.price.toLocaleString()}
                  </td>
                </tr>
              ))}
              {(!transactions || transactions.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <History className="text-slate-300 w-8 h-8" />
                      </div>
                      <p className="text-slate-400 font-medium">Belum ada riwayat transaksi</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
