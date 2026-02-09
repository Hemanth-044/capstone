import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import { verifyToken } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await dbConnect();

        const headersList = await headers();
        const authHeader = headersList.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded: any = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
        }

        const submission = await Submission.findOne({ examId: id, studentId: decoded.id });

        return NextResponse.json({ submitted: !!submission }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || 'Error checking status' },
            { status: 500 }
        );
    }
}
