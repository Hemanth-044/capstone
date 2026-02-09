'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Users, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Group {
    _id: string;
    name: string;
    description: string;
    members: string[];
}

export default function GroupsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);

    // New Group Form
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [newGroupMembers, setNewGroupMembers] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUserRole(JSON.parse(userStr).role);
        }
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/groups', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setGroups(data.groups);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName) return toast.error('Group Name is required');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newGroupName,
                    description: newGroupDesc,
                    members: newGroupMembers.split(',').map(e => e.trim()).filter(e => e),
                })
            });

            if (res.ok) {
                toast.success('Group Created');
                setDialogOpen(false);
                setNewGroupName('');
                setNewGroupDesc('');
                setNewGroupMembers('');
                fetchGroups();
            } else {
                toast.error('Failed to create group');
            }
        } catch (error) {
            toast.error('Error creating group');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Groups & Classrooms</h1>
                {userRole === 'examiner' && (
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="w-4 h-4 mr-2" /> Create Group</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Study Group</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Group Name</label>
                                    <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="e.g. Physics 101" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <Textarea value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} placeholder="Discussion for Physics..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Add Members (Emails)</label>
                                    <Textarea value={newGroupMembers} onChange={e => setNewGroupMembers(e.target.value)} placeholder="student1@email.com, student2@email.com" />
                                    <p className="text-xs text-muted-foreground">Comma separated emails of students to add.</p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateGroup}>Create Group</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {loading ? <div>Loading groups...</div> : groups.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg text-gray-400">
                    You are not part of any groups yet.
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {groups.map(group => (
                        <Card key={group._id} className="flex flex-col hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-start">
                                    <span className="line-clamp-1">{group.name}</span>
                                    <Users className="w-5 h-5 text-gray-400" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-sm text-gray-500 line-clamp-3">{group.description || 'No description'}</p>
                                <p className="text-xs text-gray-400 mt-4">{group.members.length} Members</p>
                            </CardContent>
                            <CardFooter>
                                <Link href={`/dashboard/groups/${group._id}`} className="w-full">
                                    <Button variant="outline" className="w-full">Enter Group</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
