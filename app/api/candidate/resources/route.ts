import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Group from '@/models/Group';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        await dbConnect();
        const decoded = verifyAuth(req);
        if (!decoded || typeof decoded === 'string') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Find groups where the user is a member (by email) or the creator
        const groups = await Group.find({
            $or: [
                { members: user.email },
                { createdBy: user._id }
            ]
        });

        // Aggregate resources
        let allResources: any[] = [];
        groups.forEach(group => {
            if (group.resources && group.resources.length > 0) {
                const groupResources = group.resources.map((res: any) => ({
                    ...res.toObject ? res.toObject() : res,
                    groupName: group.name,
                    groupId: group._id
                }));
                allResources = [...allResources, ...groupResources];
            }
        });

        // Sort by date descending
        allResources.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ resources: allResources });
    } catch (error) {
        console.error('Error fetching resources:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
