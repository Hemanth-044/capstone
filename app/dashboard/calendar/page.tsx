'use client';

import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import '@/app/calendar.css'; // We'll create this for custom styles

interface Exam {
    _id: string;
    title: string;
    startTime: string;
    endTime: string;
}

export default function CalendarPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        const fetchExams = async () => {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/exams', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setExams(data.exams);
        };
        fetchExams();
    }, []);

    // Get exams for selected date
    const selectedExams = exams.filter(exam => {
        const examDate = new Date(exam.startTime);
        return examDate.getDate() === date.getDate() &&
            examDate.getMonth() === date.getMonth() &&
            examDate.getFullYear() === date.getFullYear();
    });

    const tileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month') {
            const hasExam = exams.some(exam => {
                const examDate = new Date(exam.startTime);
                return examDate.getDate() === date.getDate() &&
                    examDate.getMonth() === date.getMonth() &&
                    examDate.getFullYear() === date.getFullYear();
            });
            return hasExam ? <div className="h-2 w-2 bg-blue-500 rounded-full mx-auto mt-1"></div> : null;
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Exam Schedule</h1>

            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Calendar</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Calendar
                            onChange={(val) => setDate(val as Date)}
                            value={date}
                            tileContent={tileContent}
                            className="rounded-md border p-4 shadow-sm w-full"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Events for {date.toDateString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedExams.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No exams scheduled for this day.</p>
                        ) : (
                            <div className="space-y-4">
                                {selectedExams.map(exam => (
                                    <div key={exam._id} className="p-4 border rounded-lg flex justify-between items-center hover:bg-slate-50">
                                        <div>
                                            <h3 className="font-semibold">{exam.title}</h3>
                                            <p className="text-sm text-gray-500">
                                                {new Date(exam.startTime).toLocaleTimeString()} - {new Date(exam.endTime).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <Link href={`/exam/${exam._id}`}>
                                            <Badge variant="secondary" className="cursor-pointer">View</Badge>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
