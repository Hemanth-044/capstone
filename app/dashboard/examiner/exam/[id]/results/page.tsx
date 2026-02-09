'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle, Eye } from 'lucide-react';

interface Submission {
    _id: string;
    studentId: {
        _id: string;
        name: string;
        email: string;
    };
    score: number;
    flags: Array<{ type: string; timestamp: string }>;
    createdAt: string;
}

export default function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [examId, setExamId] = useState<string>('');

    useEffect(() => {
        params.then(p => setExamId(p.id));
    }, [params]);

    useEffect(() => {
        if (!examId) return;
        const fetchSubmissions = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`/api/exams/${examId}/submissions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setSubmissions(data.submissions);
                }
            } catch (error) {
                console.error('Error fetching results', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSubmissions();
    }, [examId]);

    if (loading) return <div className="p-8">Loading Results...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Exam Results</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Candidates ({submissions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Proctoring Flags</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {submissions.map((sub) => (
                                <TableRow key={sub._id}>
                                    <TableCell className="font-medium">{sub.studentId?.name || 'Unknown'}</TableCell>
                                    <TableCell>{sub.studentId?.email || '-'}</TableCell>
                                    <TableCell className="font-bold text-lg">{sub.score}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            Submitted
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {sub.flags && sub.flags.length > 0 ? (
                                            <Badge variant="destructive" className="flex w-fit items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" /> {sub.flags.length} Flags
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 flex w-fit items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> Clean
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/dashboard/examiner/exam/${examId}/results/${sub._id}`}>
                                            <Button variant="outline" size="sm">
                                                <Eye className="w-4 h-4 mr-2" /> View Report
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {submissions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-gray-500">No submissions found yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
