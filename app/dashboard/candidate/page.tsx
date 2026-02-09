'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Exam {
    _id: string;
    title: string;
    duration: number;
    startTime: string;
    endTime: string;
}

interface Stats {
    totalExams: number;
    averageScore: number;
    history: Array<{ date: string; score: number; title: string; }>;
}

export default function CandidateDashboard() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [submittedExams, setSubmittedExams] = useState<Set<string>>(new Set());
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [examsRes, submittedRes, statsRes] = await Promise.all([
                    fetch('/api/exams'),
                    fetch('/api/candidate/submitted-exams', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch('/api/candidate/stats', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                const examsData = await examsRes.json();
                const submittedData = await submittedRes.json();
                const statsData = await statsRes.json();

                if (examsRes.ok) setExams(examsData.exams);
                if (submittedRes.ok) setSubmittedExams(new Set(submittedData.submittedExams));
                if (statsRes.ok) setStats(statsData.stats);
            } catch (error) {
                console.error('Error fetching data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getExamStatus = (exam: Exam) => {
        if (submittedExams.has(exam._id)) return { label: 'Submitted', color: 'bg-blue-500', disabled: true };

        const now = new Date();
        const start = new Date(exam.startTime);
        const end = new Date(exam.endTime);

        if (now < start) return { label: 'Upcoming', color: 'bg-yellow-500', disabled: true };
        if (now > end) return { label: 'Expired', color: 'bg-red-500', disabled: true };
        return { label: 'Active', color: 'bg-green-500', disabled: false };
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Candidate Dashboard</h1>

            {/* Performance Stats */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-100 p-4 rounded text-center">
                                    <h3 className="text-sm font-medium text-gray-500">Exams Taken</h3>
                                    <p className="text-3xl font-bold">{stats.totalExams}</p>
                                </div>
                                <div className="bg-slate-100 p-4 rounded text-center">
                                    <h3 className="text-sm font-medium text-gray-500">Avg. Score</h3>
                                    <p className="text-3xl font-bold text-green-600">{stats.averageScore}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Score History</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[200px]">
                            {stats.history.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={stats.history}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="title" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">No data found</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            <div>
                <h2 className="text-xl font-semibold mb-4">Available Exams</h2>
                {loading ? (
                    <div>Loading exams...</div>
                ) : exams.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg text-gray-400">
                        No exams available at the moment.
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {exams.map((exam) => {
                            const status = getExamStatus(exam);
                            return (
                                <Card key={exam._id} className="flex flex-col">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg line-clamp-1">{exam.title}</CardTitle>
                                            <Badge className={status.color}>{status.label}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-2 text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <Clock className="w-4 h-4 mr-2" />
                                            {exam.duration} mins
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            {new Date(exam.startTime).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs">
                                            {new Date(exam.startTime).toLocaleTimeString()} - {new Date(exam.endTime).toLocaleTimeString()}
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Link href={status.disabled ? '#' : `/exam/${exam._id}`} className="w-full">
                                            <Button className="w-full" disabled={status.disabled}>
                                                {status.label === 'Active' ? 'Start Exam' : status.label}
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
