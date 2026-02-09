import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import Exam from '@/models/Exam';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        await dbConnect();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const submissions = await Submission.find({ studentId: user.id })
            .populate('examId', 'title questions duration')
            .sort({ submittedAt: 1 }); // Sort by date ascending for trend charts

        // Process data for charts
        const trendData = submissions.map(sub => ({
            date: new Date(sub.submittedAt).toLocaleDateString(),
            score: sub.score,
            title: sub.examId?.title || 'Unknown Exam'
        }));

        const comparisonData = submissions.map(sub => {
            const totalMarks = sub.examId?.questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0) || 0;
            return {
                title: sub.examId?.title || 'Unknown Exam',
                obtained: sub.score,
                total: totalMarks,
            };
        });

        const flaggedCount = submissions.filter(sub => sub.flags && sub.flags.length > 0).length;
        const cleanCount = submissions.length - flaggedCount;
        const integrityData = [
            { name: 'Clean', value: cleanCount, fill: '#10b981' }, // Green
            { name: 'Flagged', value: flaggedCount, fill: '#ef4444' } // Red
        ];

        // Average Accuracy
        let totalObtained = 0;
        let totalPossible = 0;
        submissions.forEach(sub => {
            totalObtained += sub.score;
            const examTotal = sub.examId?.questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0) || 0;
            totalPossible += examTotal;
        });
        const averageAccuracy = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;
        const accuracyData = [
            { name: 'Accuracy', value: averageAccuracy, fill: '#8884d8' }
        ];

        // Recent Activity (Last 5)
        const recentActivity = submissions.slice(-5).map(sub => ({
            title: sub.examId?.title,
            score: sub.score,
            flags: sub.flags?.length || 0
        })).reverse();

        return NextResponse.json({
            trendData,
            comparisonData,
            integrityData,
            accuracyData,
            recentActivity,
            stats: {
                totalExams: submissions.length,
                averageScore: (totalObtained / submissions.length) || 0,
                flaggedRate: (flaggedCount / submissions.length) * 100 || 0
            }
        });

    } catch (error) {
        console.error('Analysis Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
