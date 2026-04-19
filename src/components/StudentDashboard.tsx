import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, Clock, Calendar, Bell, TrendingUp, BookOpen, Target, Plus, X, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { User, Habit, Task } from '../types';

interface StudentDashboardProps {
  user: User;
}

export default function StudentDashboard({ user }: StudentDashboardProps) {
  const [data, setData] = useState<{ habits: Habit[], tasks: Task[], reminders: any[], timeData: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [showAllHabits, setShowAllHabits] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/student/productivity', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await res.json();
        if (json && !json.message) {
          setData(json);
        } else {
          setData({ habits: [], tasks: [], reminders: [], timeData: [] });
        }
      } else {
        console.warn('Productivity fetch returned non-JSON:', await res.text());
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll for updates every 10 seconds to ensure tasks appear "instantly"
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    setIsAddingHabit(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/student/habits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title: newHabitTitle })
      });
      if (res.ok) {
        setShowAddHabit(false);
        setNewHabitTitle('');
        fetchData();
      }
    } catch (error) {
      console.error('Add habit error:', error);
    } finally {
      setIsAddingHabit(false);
    }
  };

  const toggleHabit = async (habitId: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/student/habits/${habitId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_completed: !currentStatus })
      });
      
      if (res.ok) {
        // Refetch to update time management chart as well
        fetchData();
      }
    } catch (error) {
      console.error('Toggle habit error:', error);
    }
  };

  const toggleTask = async (taskId: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/student/productivity/${taskId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_completed: !currentStatus })
      });
      
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Toggle task error:', error);
    }
  };

  if (isLoading) return <div className="animate-pulse space-y-8">
    <div className="h-32 bg-slate-200 rounded-3xl"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="h-64 bg-slate-200 rounded-3xl"></div>
      <div className="h-64 bg-slate-200 rounded-3xl"></div>
    </div>
  </div>;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-deep-blue rounded-3xl sm:rounded-[2.5rem] p-6 lg:p-12 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 text-center sm:text-left">Halo, {user.full_name}! 👋</h2>
          <p className="text-slate-400 text-sm sm:text-lg text-center sm:text-left">Siap untuk hari yang produktif?</p>
          
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-md px-4 sm:px-6 py-3 rounded-2xl border border-white/10 text-center sm:text-left">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Saldo</p>
              <p className="text-lg sm:text-2xl font-bold text-fresh-green whitespace-nowrap">Rp {user.balance.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 sm:px-6 py-3 rounded-2xl border border-white/10 text-center sm:text-left">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Tugas</p>
              <p className="text-lg sm:text-2xl font-bold">{data?.tasks?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-fresh-green/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Habits Tracker */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <div className="bg-white rounded-3xl sm:rounded-[2rem] p-5 sm:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-fresh-green/10 rounded-xl flex items-center justify-center">
                  <Target className="text-fresh-green w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-deep-blue">Habits Tracker</h3>
              </div>
              <div className="flex items-center gap-3">
                {showAllHabits && (
                  <button 
                    onClick={() => setShowAddHabit(true)}
                    className="w-8 h-8 bg-fresh-green text-white rounded-lg flex items-center justify-center hover:bg-emerald-500 transition-all shadow-md"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={() => setShowAllHabits(!showAllHabits)}
                  className="text-fresh-green font-bold text-sm hover:underline"
                >
                  {showAllHabits ? 'Sembunyikan' : 'Lihat Semua'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(showAllHabits ? data?.habits : data?.habits?.slice(0, 4))?.map((habit) => (
                <div 
                  key={habit.id} 
                  onClick={() => toggleHabit(habit.id, habit.is_completed)}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-fresh-green transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-slate-300 group-hover:text-fresh-green transition-colors">
                      {habit.is_completed ? <CheckCircle2 className="w-6 h-6 text-fresh-green" /> : <Circle className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className={`font-bold ${habit.is_completed ? 'text-slate-400 line-through' : 'text-deep-blue'}`}>{habit.title}</p>
                      <p className="text-xs text-slate-500 font-medium">{habit.streak_count} hari berturut-turut</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
                    🔥 {habit.streak_count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time Management Chart */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-emerald-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-deep-blue">Time Management</h3>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.timeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="hours" radius={[6, 6, 0, 0]} barSize={32}>
                    {(data?.timeData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.hours > 7 ? '#10B981' : '#E2E8F0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-fresh-green rounded-full"></div> Produktif</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-200 rounded-full"></div> Standar</div>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          {/* School Work */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <BookOpen className="text-purple-600 w-6 h-6" />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <h3 className="text-xl font-bold text-deep-blue">Pekerjaan Sekolah</h3>
                <button 
                  onClick={fetchData} 
                  className="p-2 hover:bg-slate-50 rounded-lg transition-all text-slate-400 hover:text-deep-blue"
                  title="Refresh Tugas"
                >
                  <TrendingUp className="w-4 h-4 rotate-90" />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {data?.tasks?.map((task) => (
                <div 
                  key={task.id} 
                  onClick={() => toggleTask(task.id, task.is_completed)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${task.is_completed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 hover:border-purple-300 shadow-sm'}`}
                >
                  <div className="mt-1">
                    {task.is_completed ? <CheckCircle2 className="w-5 h-5 text-purple-600" /> : <Circle className="w-5 h-5 text-slate-300" />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold transition-all ${task.is_completed ? 'text-slate-400 line-through' : 'text-deep-blue'}`}>{task.title}</p>
                    {!task.is_completed && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Calendar className="w-3 h-3" /> {task.due_date}
                      </div>
                      {task.type === 'schoolwork' || true && <span className="px-2 py-1 bg-purple-100 text-purple-600 text-[10px] font-bold rounded-lg">TUGAS</span>}
                    </div>
                  </div>
                </div>
              ))}
              {(!data?.tasks || data.tasks.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-slate-400 font-medium">Belum ada tugas.</p>
                </div>
              )}
            </div>
          </div>

          {/* Reminders */}
          <div className="bg-gradient-to-br from-fresh-green to-emerald-600 rounded-[2rem] p-8 text-white shadow-lg shadow-fresh-green/20">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6" />
              <h3 className="text-xl font-bold">Reminders</h3>
            </div>
            <div className="space-y-4">
              {(data?.reminders || []).map((reminder: any, index: number) => (
                <div key={reminder.id || index} className="flex items-start gap-3 border-b border-white/10 pb-3 last:border-0 last:pb-0">
                  <div className="mt-1 w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-bold leading-tight">{reminder.title}</p>
                    {reminder.description && <p className="text-[10px] text-white/70 mt-1">{reminder.description}</p>}
                  </div>
                </div>
              ))}
              {(!data?.reminders || data.reminders.length === 0) && (
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 bg-white rounded-full"></div>
                  <p className="text-sm font-medium">Belum ada pengingat hari ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Habit Modal */}
      {showAddHabit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-deep-blue/40 backdrop-blur-sm shadow-2xl" onClick={() => setShowAddHabit(false)}></div>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-extrabold text-deep-blue">Tambah Habit Baru</h3>
              <button onClick={() => setShowAddHabit(false)} className="text-slate-400 hover:text-deep-blue"><X className="w-8 h-8" /></button>
            </div>
            <form onSubmit={handleAddHabit} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Judul Habit</label>
                <input 
                  required
                  type="text" 
                  autoFocus
                  placeholder="Contoh: Baca Buku 15 Menit"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-deep-blue focus:ring-2 focus:ring-fresh-green outline-none"
                  value={newHabitTitle}
                  onChange={(e) => setNewHabitTitle(e.target.value)}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddHabit(false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all">Batal</button>
                <button type="submit" disabled={isAddingHabit} className="flex-1 py-4 bg-deep-blue text-white rounded-2xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2">
                  {isAddingHabit ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Habit'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
