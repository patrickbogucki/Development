import { NextResponse } from 'next/server';
import { getProfile, updateProfile } from '../../../lib/db';

export async function GET() {
    try {
        const profile = getProfile();
        return NextResponse.json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { name, email, title, store_number } = body;

        // Basic validation
        if (!name || !email) {
            return NextResponse.json({ error: 'Name and Email are required' }, { status: 400 });
        }

        const updatedProfile = updateProfile({
            name,
            email,
            title: title || '',
            store_number: store_number || ''
        });

        return NextResponse.json(updatedProfile);
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
