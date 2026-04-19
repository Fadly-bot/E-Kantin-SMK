-- E-Kantin SMK Database Schema (PostgreSQL/MySQL)

-- Users Table (Role-Based Access)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'seller', 'admin')),
    class_name VARCHAR(20), -- For students (e.g., '12-RPL-1')
    balance DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    category VARCHAR(50),
    image_url TEXT,
    seller_id INTEGER REFERENCES users(id),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'success', -- 'success', 'pending', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance Table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    teacher_id INTEGER REFERENCES users(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    attendance_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, attendance_date)
);

-- Student Productivity Table (Habits & Tasks)
CREATE TABLE student_productivity (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    type VARCHAR(20) NOT NULL, -- 'habit', 'task', 'reminder'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    due_date TIMESTAMP,
    streak_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time Management Stats (Aggregated)
CREATE TABLE time_management_stats (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    day_name VARCHAR(10) NOT NULL, -- 'Sen', 'Sel', etc.
    hours_studied DECIMAL(4, 2) DEFAULT 0.00,
    week_start_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Data (Optional)
-- INSERT INTO users (username, password, full_name, role, class_name, balance) 
-- VALUES ('ahmad', '$2a$10$...', 'Ahmad Subarjo', 'student', '12-RPL-1', 75000);
-- Migration: Add file_path to tasks table
ALTER TABLE tasks ADD COLUMN file_path TEXT;