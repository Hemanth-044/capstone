'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Link as LinkIcon, FileText, Search, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Resource {
    _id: string;
    title: string;
    type: 'link' | 'note' | 'file';
    content: string;
    createdAt: string;
    groupName: string;
    groupId: string;
}

export default function LibraryPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/candidate/resources', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setResources(data.resources);
            } else {
                toast.error('Failed to fetch resources');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error loading library');
        } finally {
            setLoading(false);
        }
    };

    const filteredResources = resources.filter(res => {
        const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            res.groupName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || res.type === filter;
        return matchesSearch && matchesFilter;
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'link': return <LinkIcon className="w-5 h-5 text-blue-500" />;
            case 'note': return <FileText className="w-5 h-5 text-yellow-500" />;
            case 'file': return <BookOpen className="w-5 h-5 text-green-500" />; // simplistic mapping
            default: return <BookOpen className="w-5 h-5" />;
        }
    };

    if (loading) return <div className="p-8">Loading Library...</div>;

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Learning Hub</h1>
                    <p className="text-muted-foreground">Access study materials and resources from your groups.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search resources..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setFilter}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="link">Links</TabsTrigger>
                        <TabsTrigger value="note">Notes</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {filteredResources.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No resources found</h3>
                    <p className="text-slate-500">Join groups to see shared materials here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map((res) => (
                        <Card key={res._id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-slate-100 rounded-lg">
                                            {getIcon(res.type)}
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-semibold line-clamp-1" title={res.title}>
                                                {res.title}
                                            </CardTitle>
                                            <CardDescription className="text-xs">
                                                from {res.groupName}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="capitalize">{res.type}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-slate-600 line-clamp-3 mb-4 min-h-[60px] bg-slate-50 p-3 rounded">
                                    {res.type === 'link' ? (
                                        <a href={res.content} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline break-all">
                                            <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                                            {res.content}
                                        </a>
                                    ) : (
                                        res.content
                                    )}
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-400">
                                    <span className="flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {new Date(res.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function Clock(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}
