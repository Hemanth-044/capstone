import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function PUT(req: Request) {
    try {
        await dbConnect();
        const headersList = await headers();
        const authHeader = headersList.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded: any = verifyToken(token);
        if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

        const body = await req.json();
        const { name, currentPassword, newPassword } = body;

        const user = await User.findById(decoded.id);
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        // Update Name
        if (name) user.name = name;

        // Update Password
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ message: 'Current password required to set new password' }, { status: 400 });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return NextResponse.json({ message: 'Incorrect current password' }, { status: 400 });
            }
            user.password = await bcrypt.hash(newPassword, 10);
        }

        await user.save();

        // Return updated user info (excluding password)
        const updatedUser = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        return NextResponse.json({ message: 'Profile updated', user: updatedUser }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Error updating profile' }, { status: 500 });
    }
}
