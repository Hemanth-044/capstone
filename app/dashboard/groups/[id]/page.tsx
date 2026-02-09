'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LinkIcon, FileText, Send, User, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Group {
    _id: string;
    name: string;
    description: string;
    createdBy: string;
    members: string[];
    resources: Array<{ title: string; type: string; content: string; createdAt: string; }>;
    posts: Array<{ authorName: string; content: string; createdAt: string; }>;
}

export default function GroupDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [group, setGroup] = useState<Group | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);

    // Post State
    const [newPost, setNewPost] = useState('');

    // Resource State
    const [newResTitle, setNewResTitle] = useState('');
    const [newResLink, setNewResLink] = useState('');
    const [resDialogOpen, setResDialogOpen] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUserRole(JSON.parse(userStr).role);
        }
        fetchGroup();
    }, [id]);

    const fetchGroup = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/groups/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setGroup(data.group);
            } else {
                toast.error('Failed to load group');
                router.push('/dashboard/groups');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async () => {
        if (!newPost.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/groups/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ type: 'post', content: newPost })
            });
            if (res.ok) {
                setNewPost('');
                fetchGroup(); // Refresh
            }
        } catch (error) {
            toast.error('Failed to post');
        }
    };

    const handleAddResource = async () => {
        if (!newResTitle || !newResLink) return toast.error('Fill all fields');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/groups/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'resource',
                    title: newResTitle,
                    resourceType: 'link',
                    content: newResLink
                })
            });
            if (res.ok) {
                toast.success('Resource added');
                setResDialogOpen(false);
                setNewResTitle('');
                setNewResLink('');
                fetchGroup();
            }
        } catch (error) {
            toast.error('Failed to add resource');
        }
    };

    if (loading) return <div>Loading group...</div>;
    if (!group) return <div>Group not found</div>;

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div>
                <h1 className="text-3xl font-bold">{group.name}</h1>
                <p className="text-gray-500">{group.description}</p>
            </div>

            <Tabs defaultValue="feed" className="flex-1 flex flex-col">
                <TabsList>
                    <TabsTrigger value="feed">Discussion Feed</TabsTrigger>
                    <TabsTrigger value="resources">Resources & Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="feed" className="flex-1 flex flex-col min-h-0 space-y-4 mt-4">
                    <Card className="flex-1 flex flex-col min-h-0">
                        <CardContent className="flex-1 p-4 flex flex-col min-h-0">
                            <ScrollArea className="flex-1 pr-4">
                                <div className="space-y-4">
                                    {group.posts.map((post, i) => (
                                        <div key={i} className="flex gap-3">
                                            <div className="bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center">
                                                <User className="w-4 h-4 text-slate-500" />
                                            </div>
                                            <div className="bg-white border rounded-lg p-3 max-w-[80%] shadow-sm">
                                                <p className="text-xs font-bold text-gray-700">{post.authorName} <span className="font-normal text-gray-400 ml-2">{new Date(post.createdAt).toLocaleTimeString()}</span></p>
                                                <p className="text-sm mt-1">{post.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {group.posts.length === 0 && <div className="text-center text-gray-400 py-10">No discussions yet. Start one!</div>}
                                </div>
                            </ScrollArea>

                            <div className="pt-4 border-t mt-4 flex gap-2">
                                <Input
                                    value={newPost}
                                    onChange={e => setNewPost(e.target.value)}
                                    placeholder="Type a message..."
                                    onKeyDown={e => e.key === 'Enter' && handlePost()}
                                />
                                <Button onClick={handlePost} size="icon"><Send className="w-4 h-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="resources" className="mt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Course Materials</h2>
                        {userRole === 'examiner' && (
                            <Dialog open={resDialogOpen} onOpenChange={setResDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm"><LinkIcon className="w-4 h-4 mr-2" /> Share Resource</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Resource Link</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <label>Title</label>
                                            <Input value={newResTitle} onChange={e => setNewResTitle(e.target.value)} placeholder="e.g. Lecture 1 Slides" />
                                        </div>
                                        <div className="space-y-2">
                                            <label>Link (URL)</label>
                                            <Input value={newResLink} onChange={e => setNewResLink(e.target.value)} placeholder="https://drive.google.com/..." />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleAddResource}>Add Resource</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {group.resources.map((res, i) => (
                            <Card key={i} className="flex flex-row items-center p-4 gap-4 hover:shadow-md transition">
                                <div className="bg-blue-100 p-3 rounded-lg">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold">{res.title}</h3>
                                    <a href={res.content} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center">
                                        Open Link <ExternalLink className="w-3 h-3 ml-1" />
                                    </a>
                                </div>
                            </Card>
                        ))}
                        {group.resources.length === 0 && <div className="text-gray-400 col-span-2 text-center py-10">No resources shared yet.</div>}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
