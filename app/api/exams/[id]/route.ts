import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Exam from '@/models/Exam';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await dbConnect();
        const exam = await Exam.findById(id);

        if (!exam) {
            return NextResponse.json({ message: 'Exam not found' }, { status: 404 });
        }

        return NextResponse.json({ exam }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || 'Failed to fetch exam' },
            { status: 500 }
        );
    }
}
