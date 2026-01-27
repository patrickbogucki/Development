const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'feedback.db');
const db = new Database(dbPath);

const ideas = [
    {
        type: 'Idea',
        title: 'Dark Mode for Admin Panel',
        description: 'The admin panel is too bright at night. Please add a dark mode switch.',
        category: 'technology',
        votes: 45,
        author: 'Alex R.'
    },
    {
        type: 'Idea',
        title: 'Export Reports to CSV',
        description: 'It would be very helpful to export the weekly analytics reports to CSV for external analysis.',
        category: 'operations',
        votes: 128,
        author: 'Sarah M.'
    },
    {
        type: 'Idea',
        title: 'Slack Integration',
        description: 'Send notifications to a specific Slack channel when a new incident is reported.',
        category: 'technology',
        votes: 89,
        author: 'Mike T.'
    },
    {
        type: 'Idea',
        title: 'Mobile App Support',
        description: 'A dedicated mobile app for field agents to submit feedback offline.',
        category: 'technology',
        votes: 210,
        author: 'Jessica L.'
    },
    {
        type: 'Idea',
        title: 'Better Search Functionality',
        description: 'The current search does not handle typos well. Fuzzy search would be great.',
        category: 'technology',
        votes: 67,
        author: 'David K.'
    },
    {
        type: 'Idea',
        title: 'Casual Fridays',
        description: 'Allow casual dress code on Fridays to boost morale.',
        category: 'operations',
        votes: 34,
        author: 'Emily W.'
    },
    {
        type: 'Idea',
        title: 'Coffee Machine Upgrade',
        description: 'The operational cost of the new coffee machine is high, but the quality is low. Can we switch vendors?',
        category: 'operations',
        votes: 12,
        author: 'Tom H.'
    },
    {
        type: 'Idea',
        title: 'Merch Store',
        description: 'Internal store to buy company branded hoodies and mugs.',
        category: 'clothing',
        votes: 156,
        author: 'Chris P.'
    },
    {
        type: 'Idea',
        title: 'Automated Onboarding',
        description: 'Automate the checklist for new hires to save HR time.',
        category: 'operations',
        votes: 99,
        author: 'Aisha B.'
    },
    {
        type: 'Idea',
        title: 'Team Building Retreat',
        description: 'Annual offsite retreat for team bonding.',
        category: 'operations',
        votes: 300,
        author: 'Ryan G.'
    }
];

const stmt = db.prepare(`
  INSERT INTO submissions (type, title, description, category, votes, author, created_at, is_mine)
  VALUES (@type, @title, @description, @category, @votes, @author, datetime('now', '-' || (ABS(RANDOM()) % 10000) || ' minutes'), 0)
`);

const insertMany = db.transaction((ideas) => {
    for (const idea of ideas) stmt.run(idea);
});

insertMany(ideas);

console.log(`Successfully added ${ideas.length} mock ideas to the database.`);
db.close();
