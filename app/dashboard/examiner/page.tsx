'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function ExaminerDashboard() {
    const [loading, setLoading] = useState(true);

    const [exams, setExams] = useState<any[]>([]);

    useEffect(() => {
        const fetchExams = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch('/api/exams', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setExams(data.exams);
                }
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetchExams();
    }, []);

    const stats = {
        totalExams: exams.length,
        activeExams: exams.filter(e => new Date(e.endTime) > new Date()).length,
        completedExams: 'N/A', // compute later
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Examiner Dashboard</h1>
                <Link href="/dashboard/examiner/create-exam">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create New Exam
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalExams}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Exams</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeExams}</div>
                    </CardContent>
                </Card>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">My Exams</h2>
                {exams.length === 0 ? (
                    <div className="rounded-md border bg-white p-8 text-center text-muted-foreground">
                        No exams created yet. Click "Create New Exam" to get started.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {exams.map((exam) => (
                            <Card key={exam._id}>
                                <CardHeader>
                                    <CardTitle className="line-clamp-1">{exam.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{exam.description || 'No description'}</p>
                                    <Link href={`/dashboard/examiner/exam/${exam._id}/results`}>
                                        <Button variant="outline" className="w-full">
                                            View Results & Flags
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
