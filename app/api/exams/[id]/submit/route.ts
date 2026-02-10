import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Exam from '@/models/Exam';
import Submission from '@/models/Submission';
import { verifyToken } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(
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

        const body = await req.json();
        const { answers, flags } = body;

        const exam = await Exam.findById(id);
        if (!exam) {
            return NextResponse.json({ message: 'Exam not found' }, { status: 404 });
        }

        // Auto-marking Logic
        let score = 0;

        // We iterate over exam questions to calculate score
        // This is a naive auto-marker. For descriptive, we can't auto-mark easily without AI.
        // For now, we only mark MCQ/TrueFalse/FillBlank exact matches.

        exam.questions.forEach((q: any) => {
            const studentAns = answers[q._id.toString()];
            if (!studentAns) return;

            if (q.type === 'mcq' || q.type === 'true_false') {
                if (studentAns === q.correctAnswer) {
                    score += q.marks;
                }
            } else if (q.type === 'fill_blank') {
                if (typeof studentAns === 'string' && studentAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
                    score += q.marks;
                }
            }
            // Descriptive are left for manual or 0 by default here
        });

        // Zero-Trust: Cryptographic Log Chaining
        let previousHash = 'genesis-' + id; // Initial hash linked to exam ID
        const crypto = require('crypto');

        const securedFlags = (flags || []).map((flag: any) => {
            const dataToHash = `${flag.type}${flag.message}${new Date(flag.timestamp).toISOString()}${previousHash}`;
            const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');

            const securedFlag = {
                ...flag,
                previousHash,
                hash
            };
            previousHash = hash; // Chain it
            return securedFlag;
        });

        const submission = await Submission.create({
            examId: id,
            studentId: decoded.id,
            answers,
            score,
            flags: securedFlags,
            captures: body.captures || [],
        });

        return NextResponse.json({ message: 'Submission received', score }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || 'Submission failed' },
            { status: 500 }
        );
    }
}
