'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Clock, CheckCircle, ArrowLeft, Camera, AlertOctagon, Users, UserX, EyeOff, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface Submission {
    _id: string;
    studentId: {
        _id: string;
        name: string;
        email: string;
    };
    examId: {
        title: string;
    };
    score: number;
    flags: Array<{ type: string; message?: string; timestamp: string; hash?: string; previousHash?: string }>;
    captures: Array<{ image: string; reason: string; timestamp: string }>;
    createdAt: string;
}

export default function SubmissionDetailsPage({ params }: { params: Promise<{ id: string; subId: string }> }) {
    const router = useRouter();
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [pageParams, setPageParams] = useState<{ id: string; subId: string } | null>(null);

    useEffect(() => {
        params.then(setPageParams);
    }, [params]);

    useEffect(() => {
        if (!pageParams) return;
        const fetchSubmission = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`/api/exams/${pageParams.id}/submissions/${pageParams.subId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setSubmission(data.submission);
                } else {
                    toast.error('Failed to load submission');
                }
            } catch (error) {
                console.error(error);
                toast.error('Error fetching details');
            } finally {
                setLoading(false);
            }
        };
        fetchSubmission();
    }, [pageParams]);

    if (loading) return <div className="p-8">Loading Report...</div>;
    if (!submission) return <div className="p-8">Submission not found</div>;

    const violationCount = submission.flags?.length || 0;
    const aiRiskLevel = violationCount > 5 ? 'Critical' : violationCount > 2 ? 'High' : violationCount > 0 ? 'Medium' : 'Low';
    const riskColor = aiRiskLevel === 'Critical' ? 'text-red-600' : aiRiskLevel === 'High' ? 'text-orange-600' : aiRiskLevel === 'Medium' ? 'text-yellow-600' : 'text-green-600';

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Candidate Report</h1>
                    <p className="text-muted-foreground">
                        {submission.studentId.name} • {submission.examId.title}
                    </p>
                </div>
                <div className="ml-auto flex items-center space-x-2">
                    <Badge variant={violationCount > 0 ? 'destructive' : 'default'} className="text-base px-4 py-1">
                        Score: {submission.score}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Risk Assessment (AI)</CardTitle>
                        <AlertOctagon className={`h-4 w-4 ${riskColor}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${riskColor}`}>{aiRiskLevel}</div>
                        <p className="text-xs text-muted-foreground">{violationCount} total violations detected</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Captured Snapshots</CardTitle>
                        <Camera className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{submission.captures?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Photos taken on violation</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Submission Time</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">{new Date(submission.createdAt).toLocaleTimeString()}</div>
                        <p className="text-xs text-muted-foreground">{new Date(submission.createdAt).toLocaleDateString()}</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Proctoring Timeline</TabsTrigger>
                    <TabsTrigger value="snapshots">Snapshots Gallery</TabsTrigger>
                    <TabsTrigger value="logs">Zero-Trust Logs (Blockchain)</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Session Logs</CardTitle>
                            <CardDescription>Chronological timeline of events during the exam session.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-6">
                                {submission.flags?.map((flag, idx) => {
                                    const getFlagIcon = (type: string) => {
                                        switch (type) {
                                            case 'NO_FACE': return <UserX className="w-4 h-4 text-red-600" />;
                                            case 'MULTIPLE_FACES': return <Users className="w-4 h-4 text-red-600" />;
                                            case 'LOOKING_AWAY': return <EyeOff className="w-4 h-4 text-orange-600" />;
                                            case 'PROHIBITED_OBJECT': return <Smartphone className="w-4 h-4 text-red-600" />;
                                            case 'TAB_SWITCH': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
                                            case 'FULLSCREEN_EXIT': return <AlertOctagon className="w-4 h-4 text-orange-600" />;
                                            default: return <AlertTriangle className="w-4 h-4 text-gray-600" />;
                                        }
                                    };
                                    const getBgColor = (type: string) => {
                                        switch (type) {
                                            case 'NO_FACE': return 'bg-red-100 dark:bg-red-900/30';
                                            case 'MULTIPLE_FACES': return 'bg-red-100 dark:bg-red-900/30';
                                            case 'PROHIBITED_OBJECT': return 'bg-red-100 dark:bg-red-900/30';
                                            case 'LOOKING_AWAY': return 'bg-orange-100 dark:bg-orange-900/30';
                                            case 'TAB_SWITCH': return 'bg-yellow-100 dark:bg-yellow-900/30';
                                            case 'FULLSCREEN_EXIT': return 'bg-orange-100 dark:bg-orange-900/30';
                                            default: return 'bg-gray-100 dark:bg-gray-800';
                                        }
                                    };

                                    return (
                                        <div key={idx} className="relative pl-8 pb-8 border-l last:border-0 border-gray-200 dark:border-gray-700">
                                            <span className={`absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-4 ring-white dark:ring-background ${getBgColor(flag.type)}`}>
                                                {getFlagIcon(flag.type)}
                                            </span>
                                            <h3 className="flex items-center mb-1 text-lg font-semibold">
                                                {flag.type.replace(/_/g, ' ')}
                                            </h3>
                                            <time className="block mb-2 text-sm font-normal leading-none text-muted-foreground">
                                                {new Date(flag.timestamp).toLocaleString()}
                                            </time>
                                            <p className="text-base font-normal text-muted-foreground">
                                                {flag.message || 'Suspicious activity detected.'}
                                            </p>
                                        </div>
                                    )
                                })}
                                {(!submission.flags || submission.flags.length === 0) && (
                                    <div className="ml-6 py-4 text-green-600 flex items-center">
                                        <CheckCircle className="mr-2 h-5 w-5" /> No violations recorded. Clean session.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="snapshots">
                    <Card>
                        <CardHeader>
                            <CardTitle>Violation Snapshots</CardTitle>
                            <CardDescription>Images captured automatically when strict proctoring rules were violated.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {submission.captures && submission.captures.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {submission.captures.map((cap, idx) => (
                                        <div key={idx} className="border rounded-lg overflow-hidden shadow-sm">
                                            <div className="aspect-video relative bg-black">
                                                {/* Base64 image */}
                                                <img
                                                    src={cap.image}
                                                    alt={`Snapshot ${idx + 1}`}
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                            <div className="p-3 bg-slate-50 border-t">
                                                <p className="font-semibold text-sm text-red-600">{cap.reason}</p>
                                                <p className="text-xs text-gray-500">{new Date(cap.timestamp).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <Camera className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                    No snapshots were captured during this session.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="logs">
                    <Card>
                        <CardHeader>
                            <CardTitle>Zero-Trust Cryptographic Chain</CardTitle>
                            <CardDescription>
                                Immutable log of events secured by SHA-256 hashing. Each event is cryptographically linked to the previous one, ensuring data integrity.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {submission.flags?.map((flag, idx) => (
                                    <div key={idx} className="border p-4 rounded-md bg-slate-50 dark:bg-slate-900 shadow-sm font-mono text-xs overflow-hidden">
                                        <div className="flex justify-between items-center mb-2">
                                            <Badge variant="outline" className="uppercase">{flag.type}</Badge>
                                            <span className="text-gray-500">{new Date(flag.timestamp).toLocaleString()}</span>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                                            <span className="text-gray-500 font-semibold">Message:</span>
                                            <span className="truncate text-gray-700 dark:text-gray-300">{flag.message}</span>

                                            <span className="text-blue-600 font-semibold">Prev Hash:</span>
                                            <span className="truncate text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-1 rounded">
                                                {flag.previousHash || 'Genesis Block'}
                                            </span>

                                            <span className="text-green-600 font-semibold">Current Hash:</span>
                                            <span className="truncate text-green-600 bg-green-50 dark:bg-green-900/20 p-1 rounded font-bold">
                                                {flag.hash || 'Calculating...'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {(!submission.flags || submission.flags.length === 0) && (
                                    <div className="text-center py-8 text-gray-500">
                                        No logs generated for this session.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
