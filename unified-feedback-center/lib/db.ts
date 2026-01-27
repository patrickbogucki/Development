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

export function getSubmissions() {
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

export default db;
