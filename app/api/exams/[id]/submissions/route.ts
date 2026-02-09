import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import Exam from '@/models/Exam'; // Ensure Exam is registered
import User from '@/models/User'; // Ensure User is registered to populate studentId
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

        if (!decoded || decoded.role !== 'examiner') {
            return NextResponse.json({ message: 'Forbidden: Examiners only' }, { status: 403 });
        }

        const submissions = await Submission.find({ examId: id })
            .populate('studentId', 'name email')
            .sort({ score: -1 });

        return NextResponse.json({ submissions }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || 'Failed to fetch submissions' },
            { status: 500 }
        );
    }
}
