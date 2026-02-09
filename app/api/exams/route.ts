import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Exam from '@/models/Exam';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(req: Request) {
    try {
        await dbConnect();

        // Auth Check
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

        const { title, description, duration, startTime, endTime, proctoring, questions, allowedEmails } = await req.json();

        const exam = await Exam.create({
            title,
            description,
            duration,
            startTime,
            endTime,
            proctoring,
            questions,
            allowedEmails: allowedEmails || [],
            createdBy: decoded.id,
        });

        return NextResponse.json({ message: 'Exam created', exam }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || 'Something went wrong' },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        await dbConnect();

        // Auth check for visibility filtering
        const headersList = await headers();
        const authHeader = headersList.get('authorization');
        let userEmail: string | null = null;
        let userRole: string | null = null;
        let userId: string | null = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded: any = verifyToken(token);
                if (decoded) {
                    userEmail = decoded.email;
                    userRole = decoded.role;
                    userId = decoded.id;
                }
            } catch (e) {
                // Token invalid, treat as guest/unauth (though dashboard is protected)
            }
        }

        let query: any = {};

        // Examiner sees everything (or only their own? For now, let's say all, or better yet, their own + all open ones? 
        // User request implied they want to restrict access. If I am an examiner I probably want to see exams I created.)
        if (userRole === 'examiner') {
            // Examiners see only exams they created
            query = { createdBy: userId };
        } else if (userRole === 'candidate') {
            // Candidates see:
            // 1. Exams with allowedEmails = [] (Public)
            // 2. Exams where allowedEmails includes their email.
            query = {
                $or: [
                    { allowedEmails: { $size: 0 } }, // Public
                    { allowedEmails: { $exists: false } }, // Backwards compatibility
                    { allowedEmails: userEmail } // Restricted
                ]
            };
        } else {
            // Unauthenticated or unknown role? Maybe show nothing or public only.
            // Given middleware protects dashboard, this is mostly safe, but let's be strict.
            // If no userEmail, show only public.
            query = {
                $or: [
                    { allowedEmails: { $size: 0 } },
                    { allowedEmails: { $exists: false } }
                ]
            };
        }

        const exams = await Exam.find(query).sort({ createdAt: -1 });
        return NextResponse.json({ exams }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || 'Failed to fetch exams' },
            { status: 500 }
        );
    }
}
