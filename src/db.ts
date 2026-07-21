import { Database } from "bun:sqlite";

const DB_PATH = process.env.DATABASE_PATH || "./gezylms.db";
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent reads
db.exec("PRAGMA journal_mode=WAL");
db.exec("PRAGMA foreign_keys=ON");

// ── Schema ──

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    summary TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft',
    sort_order INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS material_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content_markdown TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(material_id, slug)
  );

  CREATE TABLE IF NOT EXISTS section_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    section_id INTEGER REFERENCES material_sections(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'in_progress',
    last_opened_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    UNIQUE(user_id, section_id)
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
    section_id INTEGER REFERENCES material_sections(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft',
    deadline_at TEXT,
    answers_released_at TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    question_type TEXT NOT NULL,
    question_text TEXT NOT NULL,
    options TEXT NOT NULL DEFAULT '[]',
    correct_answer TEXT NOT NULL,
    points INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    explanation TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    answers TEXT NOT NULL DEFAULT '[]',
    score INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    completed_at TEXT DEFAULT (datetime('now'))
  );
`);

// ── Seed admin if not exists ──
const adminExists = db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
if (!adminExists) {
  const bcrypt = await import("bcrypt-ts");
  const hash = bcrypt.hashSync("admin", 12);
  db.query("INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)").run(
    "admin",
    hash,
    "Administrator",
    "admin"
  );
  console.log("🔑 Default admin created: username=admin, password=admin (CHANGE IMMEDIATELY)");
}

export default db;
