import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, ClipboardCheck, Plus, Download, Search, Filter } from 'lucide-react';
import { User, Task } from '../types';
import { parseDocxToStudentList } from '../utils/docxParser';
import FileUpload from './FileUpload';

interface TeacherDashboardProps {
  user: User;
}

export default function TeacherDashboard({ user }: TeacherDashboardProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('12');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '', class_name: '12-RPL-1', file: null as File | null });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [studentsRes, tasksRes] = await Promise.all([
        fetch('/api/teacher/students', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/teacher/tasks', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const studentsData = await studentsRes.json();
      const tasksData = await tasksRes.json();
      
      setStudents(Array.isArray(studentsData.students) ? studentsData.students : []);
      setAttendance(Array.isArray(studentsData.attendance) ? studentsData.attendance : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const token = localStorage.getItem('token');
    
    // Gunakan FormData untuk mengirim file
    const formData = new FormData();
    formData.append('title', newTask.title);
    formData.append('description', newTask.description);
    formData.append('due_date', newTask.due_date);
    formData.append('class_name', newTask.class_name);
    
    // Jika ada file, masukkan ke dalam formData
    if (newTask.file) {
      formData.append('file', newTask.file);
    }

    const res = await fetch('/api/teacher/tasks', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`
        // Catatan: Jangan tambahkan 'Content-Type': 'application/json' di sini!
      },
      body: formData // Kirim objek formData
    });
    
    if (res.ok) {
      setShowTaskModal(false);
      // Reset form termasuk file
      setNewTask({ title: '', description: '', due_date: '', class_name: '12-RPL-1', file: null });
      fetchData();
    }
  } catch (error) {
    console.error('Create task error:', error);
  }
};

  const handleAttendance = async (studentId: number, status: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentId, status })
      });
      
      setAttendance(prev => {
        const existing = prev.findIndex(a => a.student_id === studentId);
        if (existing > -1) {
          const next = [...prev];
          next[existing] = { student_id: studentId, status };
          return next;
        }
        return [...prev, { student_id: studentId, status }];
      });
    } catch (error) {
      console.error('Attendance error:', error);
    }
  };

  if (isLoading) return <div className="animate-pulse space-y-8">
    <div className="h-32 bg-slate-200 rounded-3xl"></div>
    <div className="h-96 bg-slate-200 rounded-3xl"></div>
  </div>;

  const filteredStudents = (students || [])
    .filter(s => s.class && s.class.startsWith(selectedClass))
    .sort((a, b) => {
      // Sort by class number if available in class name (e.g., RPL-1, RPL-2)
      if (a.class === b.class) {
        return a.name.localeCompare(b.name);
      }
      return a.class.localeCompare(b.class);
    });

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const names = await parseDocxToStudentList(file);
        const fileName = file.name;
        
        // Try to detect class from file name
        const classMatch = fileName.match(/Kelas\s*(\d+)/i) || fileName.match(/(\d{2})[-_\s]/);
        let detectedClassNum = '12';
        let detectedClassPrefix = '12-RPL-1';
        
        if (classMatch) {
          detectedClassNum = classMatch[1].length > 2 ? classMatch[1].substring(classMatch[1].length - 2) : classMatch[1];
          detectedClassPrefix = `${detectedClassNum}-RPL-1`;
          setSelectedClass(detectedClassNum);
        }

        const newStudents = names.map((name, index) => ({
          id: Date.now() + index,
          name: name,
          class: detectedClassPrefix
        }));

        setStudents(prev => {
          // Replace or append? Usually teachers want to see the new list.
          // For now, let's append but filter out potential duplicates by name in the same class
          const existingNames = new Set(prev.map(s => `${s.name}-${s.class}`));
          const uniqueNewStudents = newStudents.filter(s => !existingNames.has(`${s.name}-${s.class}`));
          return [...prev, ...uniqueNewStudents];
        });

        alert(`Berhasil mengimpor ${names.length} siswa dari ${fileName}.`);
      } catch (error) {
        console.error('Import error:', error);
        alert('Gagal mengimpor file. Pastikan format file .docx benar.');
      } finally {
        // Reset input
        e.target.value = '';
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-deep-blue">Dashboard Absensi</h2>
          <p className="text-sm sm:text-base text-slate-500">Selamat datang kembali, {user.full_name}!</p>
        </div>
        <div className="grid grid-cols-2 sm:flex items-center gap-3">
          <label className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-white border border-slate-200 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
            <Download className="w-4 sm:w-5 h-4 sm:h-5" /> Import
            <input type="file" className="hidden" onChange={handleImportFile} accept=".doc,.docx,.pdf" />
          </label>
          <button 
            onClick={() => setShowTaskModal(true)}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-fresh-green text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm hover:bg-emerald-500 transition-all shadow-lg shadow-fresh-green/20"
          >
            <Plus className="w-4 sm:w-5 h-4 sm:h-5" /> Tugas
          </button>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-deep-blue/40 backdrop-blur-sm shadow-2xl" onClick={() => setShowTaskModal(false)}></div>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-2xl"
          >
            <h3 className="text-2xl font-extrabold text-deep-blue mb-8">Buat Tugas Baru</h3>
            <form onSubmit={handleCreateTask} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Judul Tugas</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-deep-blue focus:ring-2 focus:ring-fresh-green outline-none"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Kelas</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-deep-blue focus:ring-2 focus:ring-fresh-green outline-none"
                    value={newTask.class_name}
                    onChange={(e) => setNewTask({...newTask, class_name: e.target.value})}
                  >
                    <option value="12-RPL-1">12-RPL-1</option>
                    <option value="11-RPL-1">11-RPL-1</option>
                    <option value="10-RPL-1">10-RPL-1</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Tenggat Waktu</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-deep-blue focus:ring-2 focus:ring-fresh-green outline-none"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Deskripsi</label>
                <textarea 
                  rows={3}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-deep-blue focus:ring-2 focus:ring-fresh-green outline-none"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                ></textarea>
              </div>

              <div className="mt-4">
                <FileUpload onFileSelect={(file) => setNewTask({...newTask, file: file})} />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowTaskModal(false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-deep-blue text-white rounded-2xl font-bold hover:shadow-xl transition-all">Simpan Tugas</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl sm:rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 sm:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-fresh-green/10 rounded-xl flex items-center justify-center">
                <ClipboardCheck className="text-fresh-green w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-deep-blue">Absensi Siswa</h3>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
              {['10', '11', '12'].map((cls) => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${selectedClass === cls ? 'bg-white text-deep-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Kelas {cls}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-5 sm:px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Nama Siswa</th>
                  <th className="px-5 sm:px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Kelas</th>
                  <th className="px-5 sm:px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Status Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(filteredStudents || []).map((student) => {
                  const status = (attendance || []).find(a => a.student_id === student.id)?.status;
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 sm:px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-bold text-deep-blue whitespace-nowrap">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-5 sm:px-8 py-4 text-slate-500 font-medium">{student.class}</td>
                      <td className="px-5 sm:px-8 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {[
                            { id: 'present', label: 'H', color: 'bg-fresh-green' },
                            { id: 'absent', label: 'A', color: 'bg-red-500' },
                            { id: 'late', label: 'T', color: 'bg-orange-500' },
                            { id: 'excused', label: 'I', color: 'bg-blue-500' }
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => handleAttendance(student.id, opt.id)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${status === opt.id ? `${opt.color} text-white shadow-lg` : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                              title={opt.id}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Stats Card */}
          <div className="bg-deep-blue rounded-[2rem] p-8 text-white">
            <h3 className="text-xl font-bold mb-6">Ringkasan Hari Ini</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Hadir</span>
                <span className="text-2xl font-bold text-fresh-green">{(attendance || []).filter(a => a.status === 'present').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Alpa</span>
                <span className="text-2xl font-bold text-red-400">{(attendance || []).filter(a => a.status === 'absent').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Izin/Sakit</span>
                <span className="text-2xl font-bold text-blue-400">{(attendance || []).filter(a => a.status === 'excused').length}</span>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-deep-blue">Jadwal Tugas</h3>
              <button className="text-fresh-green"><Plus className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              {(tasks || []).map((task) => (
                <div key={task.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="font-bold text-deep-blue mb-1">{task.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{task.class_name}</span>
                    <span className="text-xs font-bold text-fresh-green">{task.due_date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
