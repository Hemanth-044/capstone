import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import Exam from '@/models/Exam';
import User from '@/models/User'; // Ensure User model is registered
import { verifyAuth } from '@/lib/auth';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string; subId: string }> }
) {
    try {
        await dbConnect();
        const { id: examId, subId } = await params;
        const decoded = verifyAuth(req);

        if (!decoded || typeof decoded === 'string') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const submission = await Submission.findById(subId)
            .populate('studentId', 'name email')
            .populate('examId', 'title questions');

        if (!submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        // Verify that the exam belongs to the requester (examiner) logic could be added here
        // For now, assuming if they have the ID, they can view (or check the Exam's createdBy if needed)

        return NextResponse.json({ submission });
    } catch (error) {
        console.error('Error fetching submission:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
