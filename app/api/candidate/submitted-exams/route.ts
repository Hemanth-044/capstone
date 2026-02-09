import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import { verifyToken } from '@/lib/auth';
import { headers } from 'next/headers';

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
        if (!decoded) {
            return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
        }

        const submissions = await Submission.find({ studentId: decoded.id }).select('examId');
        const examIds = submissions.map((s: any) => s.examId.toString());

        return NextResponse.json({ submittedExams: examIds }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || 'Error fetching submissions' },
            { status: 500 }
        );
    }
}
