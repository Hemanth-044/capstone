"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar, AreaChart, Area
} from 'recharts';
import { toast } from 'sonner';

export default function AnalysisPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/candidate/analysis', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                } else {
                    toast.error('Failed to load analysis data');
                }
            } catch (error) {
                toast.error('Error fetching analytics');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8">Loading Analytics...</div>;
    if (!data) return <div className="p-8">No data available.</div>;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="space-y-6 container mx-auto p-6 max-w-6xl">
            <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
            <p className="text-muted-foreground">Detailed insights into your examination history.</p>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Exams</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{data.stats.totalExams}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Avg Score</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{Math.round(data.stats.averageScore)}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Integrity Rate</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{Math.round(100 - data.stats.flaggedRate)}%</div></CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. Performance Trend */}
                <Card className="col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle>Score History Trend</CardTitle>
                        <CardDescription>Your performance over time across all exams.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <RechartsTooltip />
                                <Legend />
                                <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 2. Score vs Total */}
                <Card>
                    <CardHeader>
                        <CardTitle>Score vs Potential</CardTitle>
                        <CardDescription>Marks obtained vs Total possible marks.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.comparisonData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="title" hide />
                                <YAxis />
                                <RechartsTooltip />
                                <Legend />
                                <Bar dataKey="obtained" fill="#8884d8" name="Obtained" />
                                <Bar dataKey="total" fill="#82ca9d" name="Total Marks" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 3. Integrity Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Exam Integrity Status</CardTitle>
                        <CardDescription>Clean sessions vs Flagged sessions.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.integrityData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.integrityData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 4. Accuracy Radial */}
                <Card>
                    <CardHeader>
                        <CardTitle>Average Accuracy</CardTitle>
                        <CardDescription>Overall percentage of correct answers.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={20} data={data.accuracyData} startAngle={90} endAngle={-270}>
                                <RadialBar
                                    label={{ position: 'insideStart', fill: '#fff' }}
                                    background
                                    dataKey="value"
                                />
                                <Legend iconSize={10} layout="vertical" verticalAlign="bottom" wrapperStyle={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }} />
                                <RechartsTooltip />
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 5. Recent Activity Area */}
                <Card className="col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Activity Volume</CardTitle>
                        <CardDescription>Scores in your last 5 exams.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.recentActivity}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="title" />
                                <YAxis />
                                <RechartsTooltip />
                                <Area type="monotone" dataKey="score" stroke="#8884d8" fill="#8884d8" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
