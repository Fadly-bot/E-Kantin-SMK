import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve(process.cwd(), 'ekantin.db');
const db = new Database(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

try {
  // Initialize database with tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      class_name TEXT,
      balance DECIMAL(12, 2) DEFAULT 0.00,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price DECIMAL(12, 2) NOT NULL,
      category TEXT,
      image_url TEXT,
      seller_id INTEGER,
      is_available BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      product_name TEXT NOT NULL,
      category TEXT,
      price DECIMAL(12, 2) NOT NULL, -- This will be the Harga Satuan
      quantity INTEGER DEFAULT 1,
      payment_method TEXT,
      vendor TEXT NOT NULL,
      status TEXT DEFAULT 'Selesai',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS seller_payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL,
      provider_name TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      type TEXT NOT NULL, -- 'bank', 'e-wallet'
      qr_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      teacher_id INTEGER,
      status TEXT NOT NULL,
      attendance_date DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(student_id, attendance_date)
    );

    CREATE TABLE IF NOT EXISTS student_productivity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      type TEXT NOT NULL, -- 'habit', 'task', 'reminder'
      title TEXT NOT NULL,
      description TEXT,
      is_completed BOOLEAN DEFAULT FALSE,
      streak_count INTEGER DEFAULT 0,
      due_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER,
      class_name TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS time_management (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      day_name TEXT NOT NULL,
      hours DECIMAL(4, 2) DEFAULT 0.00,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER,
      item_name TEXT NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      category TEXT DEFAULT 'Beban',
      payment_method TEXT DEFAULT 'Tunai',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL, -- 'order', 'task'
      is_read BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
} catch (error) {
  console.error('CRITICAL: Database initialization failed:', error);
}

try {
  // Seed initial data if empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    // Password is 'password123'
    const passwordHash = bcrypt.hashSync('password123', 10);
    
    const insertUser = db.prepare('INSERT INTO users (username, password, full_name, role, class_name, balance) VALUES (?, ?, ?, ?, ?, ?)');
    const ahmadResult = insertUser.run('ahmad', passwordHash, 'Ahmad Subarjo', 'student', '12-RPL-1', 75000);
    const guruResult = insertUser.run('guru1', passwordHash, 'Ibu Siti', 'teacher', null, 0);
    const sellerResult = insertUser.run('kantin1', passwordHash, 'Pak Budi (Kantin)', 'seller', null, 0);
    
    const ahmadId = ahmadResult.lastInsertRowid;
    const guruId = guruResult.lastInsertRowid;
    const sellerId = sellerResult.lastInsertRowid;

    const insertProductivity = db.prepare('INSERT INTO student_productivity (student_id, type, title, is_completed, streak_count) VALUES (?, ?, ?, ?, ?)');
    insertProductivity.run(ahmadId, 'habit', 'Sarapan Sehat', 1, 12);
    insertProductivity.run(ahmadId, 'habit', 'Baca Buku 15 Menit', 0, 5);
    insertProductivity.run(ahmadId, 'habit', 'Minum Air 2L', 1, 20);

    const insertTime = db.prepare('INSERT INTO time_management (student_id, day_name, hours) VALUES (?, ?, ?)');
    ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].forEach((day, i) => {
      insertTime.run(ahmadId, day, [6, 8, 5, 9, 7, 4, 2][i]);
    });

    const insertTask = db.prepare('INSERT INTO tasks (teacher_id, class_name, title, description, due_date) VALUES (?, ?, ?, ?, ?)');
    insertTask.run(guruId, '12-RPL-1', 'Tugas Pemrograman Web', 'Buat landing page sederhana', '2024-04-20');
    insertTask.run(guruId, '12-RPL-1', 'Tugas Basis Data', 'Normalisasi database', '2024-04-22');

    const insertProduct = db.prepare('INSERT INTO products (name, description, price, category, seller_id) VALUES (?, ?, ?, ?, ?)');
    insertProduct.run('Nasi Goreng', 'Nasi goreng spesial dengan telur', 15000, 'Makanan', sellerId);
    insertProduct.run('Es Teh Manis', 'Es teh manis segar', 5000, 'Minuman', sellerId);
    insertProduct.run('Batagor', 'Bakso tahu goreng bumbu kacang', 10000, 'Camilan', sellerId);

    const insertTx = db.prepare('INSERT INTO transactions (user_id, product_name, price, vendor, status, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    insertTx.run(ahmadId, 'Nasi Goreng Spesial', 15000, 'Kantin Pak Budi', 'Success', '2024-04-14 10:30:00');
    insertTx.run(ahmadId, 'Es Teh Manis', 5000, 'Kantin Pak Budi', 'Success', '2024-04-14 10:35:00');

    const insertNotify = db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)');
    insertNotify.run(ahmadId, 'Pesanan Jadi!', 'Batagor Anda sudah siap diambil di Kantin Pak Budi', 'order');
    insertNotify.run(ahmadId, 'Tugas Baru', 'Guru Siti memberikan tugas baru: Pemrograman Web', 'task');
  }
} catch (error) {
  console.error('Database seeding failed:', error);
}

export default db;
