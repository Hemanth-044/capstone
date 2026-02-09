import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Group from '@/models/Group';
import { verifyToken } from '@/lib/auth';
import { headers } from 'next/headers';

import User from '@/models/User';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const headersList = await headers();
        const authHeader = headersList.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded: any = verifyToken(token);

        if (!decoded || decoded.role !== 'examiner') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { name, description, members } = await req.json();

        // Optional: Validate members against existing users or just allow emails? Allowed just emails for now as per plan.

        const group = await Group.create({
            name,
            description,
            createdBy: decoded.id,
            members: members || [],
        });

        return NextResponse.json({ message: 'Group created', group }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        await dbConnect();
        const headersList = await headers();
        const authHeader = headersList.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded: any = verifyToken(token);
        if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const user = await User.findById(decoded.id);
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        let query = {};
        if (user.role === 'examiner') {
            query = { createdBy: user._id };
        } else {
            // Find groups where member email is in list
            query = { members: user.email };
        }

        const groups = await Group.find(query).sort({ createdAt: -1 });
        return NextResponse.json({ groups }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
