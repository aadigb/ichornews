import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./news.db', (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Connected to SQLite database');
});

export function initDb() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        bias_score INTEGER
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS quiz_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        question TEXT,
        answer TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
  });
}

export default db;
