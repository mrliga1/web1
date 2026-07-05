-- Chạy script này trong SQL Editor của Supabase để khởi tạo bảng và chính sách

-- Bảng users (được tùy biến trong quá trình code AuthContext)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  uid text UNIQUE,
  email text,
  role text,
  username text,
  phone text,
  avatarUrl text
);

-- Bảng products chứa dữ liệu JSONB tương thích Firebase
CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  data jsonb
);

-- Bảng projects chứa dữ liệu JSONB
CREATE TABLE IF NOT EXISTS projects (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  data jsonb
);

-- Bảng news chứa dữ liệu JSONB
CREATE TABLE IF NOT EXISTS news (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  data jsonb
);

-- Bảng contacts chứa dữ liệu JSONB
CREATE TABLE IF NOT EXISTS contacts (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  data jsonb
);

-- Bảng configuration chứa dữ liệu JSONB
CREATE TABLE IF NOT EXISTS configuration (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  data jsonb
);

-- Bảng settings
CREATE TABLE IF NOT EXISTS settings (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  data jsonb
);

-- Bảng layouts
CREATE TABLE IF NOT EXISTS layouts (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  data jsonb
);

-- Bảng categories
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  data jsonb
);

-- Bảng consultations
CREATE TABLE IF NOT EXISTS consultations (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  data jsonb
);

-- Bảng activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  data jsonb
);

-- Bảng reviews
CREATE TABLE IF NOT EXISTS reviews (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  data jsonb
);

-- Tắt RLS (Row Level Security) tạm thời để cho phép Next.js API và Client SDK truy cập tự do như Firebase Test Mode
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE news DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE configuration DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE layouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE consultations DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
