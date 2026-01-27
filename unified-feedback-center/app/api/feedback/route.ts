import { NextResponse } from 'next/server';
import { getSubmissions, createSubmission } from '@/lib/db';

export async function GET() {
    try {
        const submissions = getSubmissions();
        // Convert integer booleans back to boolean for frontend
        const parsed = submissions.map(s => ({
            ...s,
            is_urgent: !!s.is_urgent,
            is_mine: !!s.is_mine
        }));
        return NextResponse.json(parsed);
    } catch (error) {
        console.error("DB Error:", error);
        return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, title, description, category, rating, feedback_text, is_urgent, author } = body;

        const newSubmission = createSubmission({
            type,
            title,
            description,
            category,
            rating,
            feedback_text,
            is_urgent,
            author: author || 'User',
            is_mine: true // Submissions via API are from "me"
        });

        return NextResponse.json(newSubmission);
    } catch (error) {
        console.error("DB Error:", error);
        return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
    }
}
