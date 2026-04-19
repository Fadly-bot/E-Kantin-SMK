import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './src/lib/db.ts';
import multer from 'multer'; // Tambahkan ini
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'ekantin-super-secret-key';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir); // Buat folder uploads jika belum ada
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Beri nama unik: timestamp-namafile.ext
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  const app = express();
  const PORT = 3000;
  // --- MULAI COPY ---
  try {
    db.prepare("ALTER TABLE tasks ADD COLUMN file_path TEXT").run();
    console.log("Mantap! Kolom file_path berhasil ditambahkan.");
  } catch (err: any) {
    if (err.message && err.message.includes("duplicate column name")) {
      console.log("Kolom file_path sudah tersedia.");
    } else {
      console.log("Info database:", err.message);
    }
  }
  // --- SELESAI COPY ---

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Add request logging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Middleware to verify JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    console.log(`${req.method} ${req.url} - Auth Check`);
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || token === 'null' || token === 'undefined') return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ message: 'Forbidden' });
      req.user = user;
      next();
    });
  };

  // --- API ROUTES ---

  // Health Check
  app.get('/api/health', (req, res) => {
    console.log('Health check requested');
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
  });

  // Auth: Login
  app.post('/api/login', (req, res) => {
    try {
      const { username, password } = req.body;
      console.log(`Login attempt for: ${username}`);
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      // Verify password
      const isPasswordValid = bcrypt.compareSync(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'sandi salah' });
      }
      
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          role: user.role,
          class_name: user.class_name,
          balance: user.balance
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Auth: Register
  app.post('/api/register', (req, res) => {
    const { username, password, fullName, role, className } = req.body;
    
    // Password validation: UPPER, lower, number, symbol (._+), exactly 15
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[._+])[A-Za-z\d._+]{15}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Password harus mengandung huruf besar, kecil, angka, simbol (._+) dan harus tepat 15 karakter.' 
      });
    }

    // Student class validation
    if (role === 'student' && className) {
      const classPattern = /^(10|11|12)\s+(RPL|TKJ|TEI|TPTU)(\s+[1-3])?$/i;
      if (!classPattern.test(className.trim())) {
        return res.status(400).json({ 
          message: 'Format kelas tidak sesuai. Contoh: 10 RPL, 11 TKJ 2, 12 TEI' 
        });
      }
    }

    try {
      const passwordHash = bcrypt.hashSync(password, 10);
      const insert = db.prepare('INSERT INTO users (username, password, full_name, role, class_name, balance) VALUES (?, ?, ?, ?, ?, ?)');
      const result = insert.run(username, passwordHash, fullName, role, className || null, 0);
      
      const token = jwt.sign({ id: result.lastInsertRowid, username, role }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({
        token,
        user: {
          id: result.lastInsertRowid,
          username,
          full_name: fullName,
          role,
          class_name: className,
          balance: 0
        }
      });
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ message: 'Username sudah digunakan' });
      }
      res.status(500).json({ message: 'Gagal registrasi' });
    }
  });

  // Auth: Get Current User
  app.get('/api/me', authenticateToken, (req: any, res) => {
    const user = db.prepare('SELECT id, username, full_name, role, class_name, balance FROM users WHERE id = ?').get(req.user.id) as any;
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  });

  // Products: Search (Broadened to include students for search feature)
  app.get('/api/search', authenticateToken, (req: any, res) => {
    try {
      const { q } = req.query;
      
      let products;
      let students = [];

      if (!q || q === '') {
        products = db.prepare('SELECT * FROM products').all() as any[];
      } else {
        products = db.prepare('SELECT * FROM products WHERE name LIKE ? OR category LIKE ?').all(`%${q}%`, `%${q}%`) as any[];
        students = db.prepare("SELECT id, full_name, class_name FROM users WHERE role = 'student' AND (full_name LIKE ? OR username LIKE ?)").all(`%${q}%`, `%${q}%`);
      }

      // Fetch payment methods for all unique sellers in the product list
      const sellerIds = [...new Set(products.map(p => p.seller_id))].filter(Boolean);
      let paymentMethods: any[] = [];
      if (sellerIds.length > 0) {
        const placeholders = sellerIds.map(() => '?').join(',');
        paymentMethods = db.prepare(`SELECT * FROM seller_payment_methods WHERE seller_id IN (${placeholders})`).all(...sellerIds);
      }
      
      res.json({ products, students, paymentMethods });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Student: Toggle Habit
  app.patch('/api/student/habits/:id', authenticateToken, (req: any, res) => {
    try {
      const { id } = req.params;
      const { is_completed } = req.body;
      
      const habit = db.prepare('SELECT * FROM student_productivity WHERE id = ? AND student_id = ?').get(id, req.user.id) as any;
      if (!habit) return res.status(404).json({ message: 'Habit not found' });

      let newStreak = habit.streak_count;
      if (is_completed && !habit.is_completed) {
        newStreak += 1;
        // Update time management: add 1 hour to today for finishing a habit
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const today = dayNames[new Date().getDay()];
        db.prepare('UPDATE time_management SET hours = hours + 1 WHERE student_id = ? AND day_name = ?').run(req.user.id, today);
      } else if (!is_completed && habit.is_completed) {
        newStreak = Math.max(0, newStreak - 1);
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const today = dayNames[new Date().getDay()];
        db.prepare('UPDATE time_management SET hours = MAX(0, hours - 1) WHERE student_id = ? AND day_name = ?').run(req.user.id, today);
      }

      db.prepare('UPDATE student_productivity SET is_completed = ?, streak_count = ? WHERE id = ?').run(is_completed ? 1 : 0, newStreak, id);
      res.json({ success: true, streak_count: newStreak });
    } catch (error) {
      console.error('Toggle habit error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Student: Toggle Task/Any Productivity Item
  app.patch('/api/student/productivity/:id', authenticateToken, (req: any, res) => {
    try {
      const { id } = req.params;
      const { is_completed } = req.body;
      
      const item = db.prepare('SELECT * FROM student_productivity WHERE id = ? AND student_id = ?').get(id, req.user.id) as any;
      if (!item) return res.status(404).json({ message: 'Item not found' });

      db.prepare('UPDATE student_productivity SET is_completed = ? WHERE id = ?').run(is_completed ? 1 : 0, id);
      
      // Update time management: add 1.5 hours to today for finishing a task
      if (is_completed && !item.is_completed) {
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const today = dayNames[new Date().getDay()];
        db.prepare('UPDATE time_management SET hours = hours + 1.5 WHERE student_id = ? AND day_name = ?').run(req.user.id, today);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Toggle productivity error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Student: Add Habit
  app.post('/api/student/habits', authenticateToken, (req: any, res) => {
    try {
      const { title } = req.body;
      const insert = db.prepare('INSERT INTO student_productivity (student_id, title, type, is_completed, streak_count) VALUES (?, ?, ?, ?, ?)');
      const result = insert.run(req.user.id, title, 'habit', 0, 0);
      res.json({ id: result.lastInsertRowid, success: true });
    } catch (error) {
      console.error('Add habit error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Student: Purchase Product
  app.post('/api/student/purchase', authenticateToken, (req: any, res) => {
    try {
      const { productName, price, quantity, vendor, paymentMethod, category } = req.body;
      
      const insertTx = db.prepare('INSERT INTO transactions (user_id, product_name, price, quantity, category, payment_method, vendor, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      insertTx.run(req.user.id, productName, price, quantity || 1, category || 'Umum', paymentMethod, vendor, 'Selesai', new Date().toISOString());
      
      const insertNotify = db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)');
      const total = price * (quantity || 1);
      insertNotify.run(req.user.id, 'Pembelian Berhasil', `Anda telah membeli ${productName} (x${quantity || 1}) seharga Rp ${total.toLocaleString()} menggunakan ${paymentMethod}`, 'order');

      res.json({ success: true });
    } catch (error) {
      console.error('Purchase error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Seller: Add Product
  app.post('/api/seller/products', authenticateToken, (req: any, res) => {
    try {
      if (req.user.role !== 'seller') return res.status(403).json({ message: 'Seller access only' });
      const { name, description, price, category, image_url } = req.body;
      
      const result = db.prepare('INSERT INTO products (name, description, price, category, image_url, seller_id) VALUES (?, ?, ?, ?, ?, ?)')
        .run(name, description, price, category, image_url || null, req.user.id);
      
      res.json({ id: result.lastInsertRowid, success: true });
    } catch (error) {
      console.error('Add product error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Seller: Update Product
  app.put('/api/seller/products/:id', authenticateToken, (req: any, res) => {
    try {
      if (req.user.role !== 'seller') return res.status(403).json({ message: 'Seller access only' });
      const { id } = req.params;
      const { name, description, price, category, image_url } = req.body;
      
      const result = db.prepare('UPDATE products SET name = ?, description = ?, price = ?, category = ?, image_url = ? WHERE id = ? AND seller_id = ?')
        .run(name, description, price, category, image_url, id, req.user.id);
      
      if (result.changes === 0) return res.status(404).json({ message: 'Product not found or unauthorized' });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Teacher: Assign Task
  app.post('/api/teacher/tasks', authenticateToken, upload.single('file'), (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Teacher access only' });
      
      const { title, description, due_date, class_name } = req.body;
      const filePath = req.file ? `/uploads/${req.file.filename}` : null;
      
      // Simpan ke database
      const result = db.prepare('INSERT INTO tasks (teacher_id, class_name, title, description, due_date, file_path) VALUES (?, ?, ?, ?, ?, ?)')
        .run(req.user.id, class_name, title, description, due_date, filePath);
      
      const students = db.prepare("SELECT id FROM users WHERE role = 'student' AND class_name = ?").all(class_name) as any[];
      const insertNotify = db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)');
      const insertProductivity = db.prepare('INSERT INTO student_productivity (student_id, type, title, description, due_date) VALUES (?, ?, ?, ?, ?)');
      
      students.forEach(s => {
        insertNotify.run(s.id, 'Tugas Baru', `Tugas baru dari ${req.user.username}: ${title}`, 'task');
        insertProductivity.run(s.id, 'task', title, description, due_date);
        insertProductivity.run(s.id, 'reminder', `Deadline: ${title}`, `Kumpulkan sebelum ${due_date}`, due_date);
      });

      res.json({ id: result.lastInsertRowid, success: true, file: filePath });
    } catch (error) {
      console.error('Add task error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }); // <--- Pastikan penutupnya rapi seperti ini

  // Notifications: Get
  app.get('/api/notifications', authenticateToken, (req: any, res) => {
    try {
      console.log(`Fetching notifications for user: ${req.user.id}`);
      const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error('Fetch notifications error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/notifications', authenticateToken, (req: any, res) => {
    try {
      db.prepare('DELETE FROM notifications WHERE user_id = ?').run(req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Clear notifications error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Notifications: Mark as Read
  app.patch('/api/notifications/:id/read', authenticateToken, (req: any, res) => {
    try {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Read notification error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Student: Productivity Data
  app.get('/api/student/productivity', authenticateToken, (req: any, res) => {
    try {
      const habits = db.prepare("SELECT * FROM student_productivity WHERE student_id = ? AND type = 'habit'").all(req.user.id);
      
      // Get all tasks from productivity (includes teacher-assigned and personal)
      const tasks = db.prepare("SELECT * FROM student_productivity WHERE student_id = ? AND type = 'task'").all(req.user.id);
      
      const reminders = db.prepare("SELECT * FROM student_productivity WHERE student_id = ? AND type = 'reminder'").all(req.user.id);
      const timeData = db.prepare('SELECT day_name as name, hours FROM time_management WHERE student_id = ?').all(req.user.id);
      
      res.json({ 
        habits, 
        tasks: (tasks as any[] || []).map(t => ({ ...t, is_completed: !!t.is_completed })), 
        reminders, 
        timeData 
      });
    } catch (error) {
      console.error('Productivity fetch error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Teacher: Tasks
  app.get('/api/teacher/tasks', authenticateToken, (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Teacher access only' });
      const tasks = db.prepare('SELECT * FROM tasks WHERE teacher_id = ?').all(req.user.id);
      res.json(tasks);
    } catch (error) {
      console.error('Tasks fetch error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Seller: Products
  app.get('/api/seller/products', authenticateToken, (req: any, res) => {
    try {
      if (req.user.role !== 'seller') return res.status(403).json({ message: 'Seller access only' });
      const products = db.prepare('SELECT * FROM products WHERE seller_id = ?').all(req.user.id);
      res.json(products);
    } catch (error) {
      console.error('Products fetch error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Seller: Reports (Sales + Expenses)
  app.get('/api/seller/reports', authenticateToken, (req: any, res) => {
    try {
      if (req.user.role !== 'seller') return res.status(403).json({ message: 'Seller access only' });
      
      const sales = db.prepare(`
        SELECT t.*, u.full_name as customer_name, 'Sales' as type
        FROM transactions t 
        JOIN users u ON t.user_id = u.id 
        WHERE t.vendor LIKE ?
      `).all(`%${req.user.username}%`);

      const expenses = db.prepare('SELECT *, \'Expense\' as type FROM expenses WHERE seller_id = ?').all(req.user.id);
      
      res.json({ sales, expenses });
    } catch (error) {
      console.error('Reports fetch error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Seller: Add Expense
  app.post('/api/seller/expenses', authenticateToken, (req: any, res) => {
    try {
      if (req.user.role !== 'seller') return res.status(403).json({ message: 'Seller access only' });
      const { itemName, amount, category, paymentMethod } = req.body;
      
      const result = db.prepare('INSERT INTO expenses (seller_id, item_name, amount, category, payment_method) VALUES (?, ?, ?, ?, ?)')
        .run(req.user.id, itemName, amount, category || 'Beban', paymentMethod || 'Tunai');
      
      res.json({ id: result.lastInsertRowid, success: true });
    } catch (error) {
      console.error('Add expense error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Seller: Delete Expense
  app.delete('/api/seller/expenses/:id', authenticateToken, (req: any, res) => {
    try {
      if (req.user.role !== 'seller') return res.status(403).json({ message: 'Seller access only' });
      db.prepare('DELETE FROM expenses WHERE id = ? AND seller_id = ?').run(req.params.id, req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete expense error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Seller: Get Payment Methods
  app.get('/api/seller/payment-methods', authenticateToken, (req: any, res) => {
    try {
      if (req.user.role !== 'seller') return res.status(403).json({ message: 'Seller access only' });
      const methods = db.prepare('SELECT * FROM seller_payment_methods WHERE seller_id = ?').all(req.user.id);
      res.json(methods);
    } catch (error) {
      console.error('Fetch payment methods error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Seller: Add/Update Payment Method
  app.post('/api/seller/payment-methods', authenticateToken, (req: any, res) => {
    try {
      if (req.user.role !== 'seller') return res.status(403).json({ message: 'Seller access only' });
      const { providerName, accountName, accountNumber, type, qrUrl, id } = req.body;
      
      if (id) {
        db.prepare('UPDATE seller_payment_methods SET provider_name = ?, account_name = ?, account_number = ?, type = ?, qr_url = ? WHERE id = ? AND seller_id = ?')
          .run(providerName, accountName, accountNumber, type, qrUrl || null, id, req.user.id);
      } else {
        db.prepare('INSERT INTO seller_payment_methods (seller_id, provider_name, account_name, account_number, type, qr_url) VALUES (?, ?, ?, ?, ?, ?)')
          .run(req.user.id, providerName, accountName, accountNumber, type, qrUrl || null);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Save payment method error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Seller: Delete Payment Method
  app.delete('/api/seller/payment-methods/:id', authenticateToken, (req: any, res) => {
    try {
      if (req.user.role !== 'seller') return res.status(403).json({ message: 'Seller access only' });
      db.prepare('DELETE FROM seller_payment_methods WHERE id = ? AND seller_id = ?').run(req.params.id, req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete payment method error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Student: Transactions
  app.get('/api/student/transactions', authenticateToken, (req: any, res) => {
    try {
      const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
      res.json(transactions);
    } catch (error) {
      console.error('Transactions fetch error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Teacher: Attendance List
  app.get('/api/teacher/students', authenticateToken, (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Teacher access only' });
      
      const students = db.prepare("SELECT id, full_name as name, class_name as class FROM users WHERE role = 'student'").all();
      const attendance = db.prepare('SELECT student_id, status FROM attendance WHERE attendance_date = CURRENT_DATE').all();
      
      res.json({ students, attendance });
    } catch (error) {
      console.error('Students fetch error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Teacher: Submit Attendance
  app.post('/api/teacher/attendance', authenticateToken, (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Teacher access only' });
      
      const { studentId, status } = req.body;
      
      // Verify student exists to prevent FK violation
      const student = db.prepare('SELECT id FROM users WHERE id = ? AND role = \'student\'').get(studentId);
      if (!student) {
        return res.status(400).json({ message: 'Student tidak ditemukan' });
      }

      const upsert = db.prepare(`
        INSERT INTO attendance (student_id, teacher_id, status, attendance_date)
        VALUES (?, ?, ?, CURRENT_DATE)
        ON CONFLICT(student_id, attendance_date) DO UPDATE SET status = excluded.status
      `);
      
      upsert.run(studentId, req.user.id, status);
      res.json({ success: true });
    } catch (error) {
      console.error('Attendance submit error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Stats: Popular Food
  app.get('/api/stats/popular-food', (req, res) => {
    res.json([
      { name: 'Nasi Goreng', count: 145, trend: '+12%' },
      { name: 'Es Teh Manis', count: 230, trend: '+5%' },
      { name: 'Batagor', count: 89, trend: '-2%' },
    ]);
  });

  // Product Search (Unauthenticated, for landing page)
  app.get('/api/products/search', (req, res) => {
    try {
      const q = req.query.q || '';
      console.log(`Product search (unauth): ${q}`);
      const products = db.prepare('SELECT * FROM products WHERE name LIKE ? OR category LIKE ?')
        .all(`%${q}%`, `%${q}%`);
      res.json(products);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Catch-all for API routes to prevent falling through to SPA fallback
  app.all('/api/*', (req, res) => {
    console.warn(`404 API Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ message: `API route ${req.method} ${req.url} not found` });
  });

  // Global Error Handler for Express
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('GLOBAL ERROR:', err);
    res.status(500).json({ message: 'Internal Server Error', detail: err.message });
  });

  // --- VITE MIDDLEWARE ---
  console.log('Setting up Vite middleware...');
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware active');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Static production assets active');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
