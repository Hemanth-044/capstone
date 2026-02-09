import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import Exam from '@/models/Exam';
import { verifyToken } from '@/lib/auth';
import { headers } from 'next/headers';

// Helper to calculate previous date bounds
const getDaysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
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
        if (!decoded || decoded.role !== 'candidate') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const submissions = await Submission.find({ studentId: decoded.id })
            .populate('examId', 'title')
            .sort({ submittedAt: 1 }); // Sorted by date for graph

        const totalExams = submissions.length;

        // Calculate average score
        let totalScore = 0;
        let maxPossibleScoreEstimate = 0; // rough estimate if we fetched exam details, but for now just sum

        const history = submissions.map((sub: any) => ({
            date: new Date(sub.createdAt).toLocaleDateString(),
            score: sub.score,
            title: sub.examId?.title || 'Unknown Exam',
        }));

        history.forEach((h: any) => totalScore += h.score);
        const averageScore = totalExams > 0 ? (totalScore / totalExams).toFixed(1) : 0;

        return NextResponse.json({
            stats: {
                totalExams,
                averageScore,
                history
            }
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || 'Error fetching stats' },
            { status: 500 }
        );
    }
}
