import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'feedback.db');
const db = new Database(dbPath);

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT,
    description TEXT,
    category TEXT,
    rating INTEGER,
    feedback_text TEXT,
    is_urgent INTEGER DEFAULT 0,
    votes INTEGER DEFAULT 0,
    author TEXT DEFAULT 'User',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    is_mine INTEGER DEFAULT 0
  )
`);

export interface Submission {
    id: number;
    type: 'Idea' | 'Feedback' | 'Incident';
    title?: string;
    description?: string;
    category?: string;
    rating?: number;
    feedback_text?: string;
    is_urgent?: boolean;
    votes: number;
    author: string;
    created_at?: string;
    is_mine?: boolean; // For local user tracking simulation
}

export function getSubmissions(since?: string) {
    if (since) {
        return db.prepare('SELECT * FROM submissions WHERE created_at > ? ORDER BY created_at DESC').all(since) as Submission[];
    }
    return db.prepare('SELECT * FROM submissions ORDER BY created_at DESC').all() as Submission[];
}

export function createSubmission(data: Omit<Submission, 'id' | 'created_at' | 'votes'>) {
    const stmt = db.prepare(`
        INSERT INTO submissions (type, title, description, category, rating, feedback_text, is_urgent, votes, author, is_mine)
        VALUES (@type, @title, @description, @category, @rating, @feedback_text, @is_urgent, @votes, @author, @is_mine)
    `);

    const info = stmt.run({
        ...data,
        votes: 0,
        is_urgent: data.is_urgent ? 1 : 0,
        is_mine: data.is_mine ? 1 : 0
    });

    return { id: info.lastInsertRowid, ...data };
}

export function voteSubmission(id: number, increment: number) {
    const stmt = db.prepare('UPDATE submissions SET votes = votes + ? WHERE id = ?');
    stmt.run(increment, id);
    return db.prepare('SELECT * FROM submissions WHERE id = ?').get(id) as Submission;
}

// User Profile Table
db.exec(`
  CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT DEFAULT '',
    email TEXT DEFAULT '',
    title TEXT DEFAULT '',
    store_number TEXT DEFAULT ''
  )
`);

// Ensure default profile exists
const profileCheck = db.prepare('SELECT count(*) as count FROM user_profile').get() as { count: number };
if (profileCheck.count === 0) {
    db.prepare(`
    INSERT INTO user_profile (id, name, email, title, store_number)
    VALUES (1, 'Guest User', 'guest@example.com', 'Associate', '001')
  `).run();
}

export interface UserProfile {
    id: number;
    name: string;
    email: string;
    title: string;
    store_number: string;
}

export function getProfile() {
    return db.prepare('SELECT * FROM user_profile WHERE id = 1').get() as UserProfile;
}

export function updateProfile(data: Omit<UserProfile, 'id'>) {
    const stmt = db.prepare(`
    UPDATE user_profile
    SET name = @name, email = @email, title = @title, store_number = @store_number
    WHERE id = 1
  `);
    stmt.run(data);
    return getProfile();
}

export default db;
