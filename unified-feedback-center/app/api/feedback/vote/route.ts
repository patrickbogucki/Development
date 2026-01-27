import { NextResponse } from 'next/server';
import { voteSubmission } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, increment } = body; // increment: 1 or -1

        const updated = voteSubmission(id, increment);
        return NextResponse.json(updated);
    } catch (error) {
        console.error("DB Error:", error);
        return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
    }
}
