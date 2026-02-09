import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Group from '@/models/Group';
import { verifyToken } from '@/lib/auth';
import { headers } from 'next/headers';

// Helper to check access
import User from '@/models/User';

const checkAccess = async (req: Request, groupId: string) => {
    await dbConnect();
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Unauthorized');
    }
    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);
    if (!decoded) throw new Error('Unauthorized');

    const user = await User.findById(decoded.id);
    if (!user) throw new Error('User not found');

    const group = await Group.findById(groupId);
    if (!group) throw new Error('Group not found');

    if (user.role === 'examiner') {
        if (group.createdBy.toString() !== user._id.toString()) throw new Error('Forbidden');
    } else {
        if (!group.members.includes(user.email)) throw new Error('Forbidden');
    }
    return { group, user };
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { group } = await checkAccess(req, id);
        return NextResponse.json({ group }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { group, user } = await checkAccess(req, id);
        const body = await req.json();

        if (body.type === 'resource') {
            if (user.role !== 'examiner') return NextResponse.json({ message: 'Only examiners can add resources' }, { status: 403 });

            group.resources.push({
                title: body.title,
                type: body.resourceType,
                content: body.content,
            });
        } else if (body.type === 'post') {
            group.posts.push({
                authorId: user._id,
                authorName: user.name,
                content: body.content
            });
        }

        await group.save();
        return NextResponse.json({ message: 'Updated', group }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
