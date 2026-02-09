'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Trash2, Plus, GripVertical } from 'lucide-react';

interface Question {
    id: string; // temp id for UI
    type: 'mcq' | 'descriptive' | 'true_false' | 'fill_blank';
    questionText: string;
    options: string[];
    correctAnswer: any;
    marks: number;
}

export default function CreateExamPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Exam Details
    const [examData, setExamData] = useState({
        title: '',
        description: '',
        duration: 60,
        startTime: '',
        endTime: '',
        proctoring: true,
        allowedEmailsString: '', // helper for UI
    });

    const [questions, setQuestions] = useState<Question[]>([]);

    const addQuestion = (type: Question['type']) => {
        const newQuestion: Question = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            questionText: '',
            options: type === 'mcq' ? ['', '', '', ''] : [],
            correctAnswer: type === 'true_false' ? 'true' : '',
            marks: 1,
        };
        setQuestions([...questions, newQuestion]);
    };

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const updateQuestion = (id: string, field: keyof Question, value: any) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const updateOption = (qId: string, opIndex: number, value: string) => {
        setQuestions(questions.map(q => {
            if (q.id !== qId) return q;
            const newOptions = [...q.options];
            newOptions[opIndex] = value;
            return { ...q, options: newOptions };
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Validate
            if (!examData.title || !examData.startTime || !examData.endTime) {
                toast.error('Please fill in all basic exam details');
                setLoading(false);
                return;
            }
            if (questions.length === 0) {
                toast.error('Please add at least one question');
                setLoading(false);
                return;
            }

            // Prepare payload
            // converting token to user ID must happen on server, here we send the token via header handled by browser/fetch interceptor usually
            // but in this simple app, we are just sending data. We need to send the token in header manually if we don't have cookies.
            // Actually my auth layout stores token in localstorage.

            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Not authenticated');
                router.push('/login');
                return;
            }

            const res = await fetch('/api/exams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...examData,
                    allowedEmails: examData.allowedEmailsString
                        ? examData.allowedEmailsString.split(',').map(e => e.trim()).filter(e => e)
                        : [],
                    questions: questions.map(({ id, ...rest }) => rest), // remove temp id
                }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Exam created successfully');
                router.push('/dashboard/examiner');
            } else {
                toast.error(data.message || 'Failed to create exam');
            }

        } catch (e) {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Create New Exam</h1>
                <Button onClick={handleSubmit} disabled={loading} size="lg">
                    {loading ? 'Saving...' : 'Publish Exam'}
                </Button>
            </div>

            {/* Exam Details Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Exam Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Exam Title</Label>
                            <Input
                                id="title"
                                value={examData.title}
                                onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                                placeholder="e.g. Mid-Term Physics"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration (minutes)</Label>
                            <Input
                                id="duration"
                                type="number"
                                value={examData.duration}
                                onChange={(e) => setExamData({ ...examData, duration: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="startTime">Start Time</Label>
                            <Input
                                id="startTime"
                                type="datetime-local"
                                value={examData.startTime}
                                onChange={(e) => setExamData({ ...examData, startTime: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endTime">End Time</Label>
                            <Input
                                id="endTime"
                                type="datetime-local"
                                value={examData.endTime}
                                onChange={(e) => setExamData({ ...examData, endTime: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={examData.description}
                            onChange={(e) => setExamData({ ...examData, description: e.target.value })}
                            placeholder="Instructions for candidates..."
                        />
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <Switch
                            id="proctoring"
                            checked={examData.proctoring}
                            onCheckedChange={(c) => setExamData({ ...examData, proctoring: c })}
                        />
                        <Label htmlFor="proctoring">Enable AI Proctoring (Webcam & Tab Monitoring)</Label>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                        <Label htmlFor="allowedEmails">Restricted Access (Optional)</Label>
                        <p className="text-sm text-gray-500">Enter email addresses allowed to take this exam, separated by commas. Leave empty to allow everyone.</p>
                        <Textarea
                            id="allowedEmails"
                            value={examData.allowedEmailsString}
                            onChange={(e) => setExamData({ ...examData, allowedEmailsString: e.target.value })}
                            placeholder="john@example.com, jane@school.edu"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Questions Manager */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Questions ({questions.length})</h2>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => addQuestion('mcq')}><Plus className="w-4 h-4 mr-2" /> MCQ</Button>
                        <Button size="sm" variant="outline" onClick={() => addQuestion('descriptive')}><Plus className="w-4 h-4 mr-2" /> Text</Button>
                        <Button size="sm" variant="outline" onClick={() => addQuestion('true_false')}><Plus className="w-4 h-4 mr-2" /> T/F</Button>
                        <Button size="sm" variant="outline" onClick={() => addQuestion('fill_blank')}><Plus className="w-4 h-4 mr-2" /> Fill Blanks</Button>
                    </div>
                </div>

                {questions.map((q, index) => (
                    <Card key={q.id} className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                            onClick={() => removeQuestion(q.id)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>

                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center">
                                <GripVertical className="w-4 h-4 mr-2 text-gray-400" />
                                Question {index + 1} <span className="text-xs font-normal text-muted-foreground ml-2 uppercase border px-2 py-0.5 rounded">{q.type.replace('_', ' ')}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Label>Question Text</Label>
                                    <Textarea
                                        value={q.questionText}
                                        onChange={(e) => updateQuestion(q.id, 'questionText', e.target.value)}
                                        placeholder="Enter question here..."
                                    />
                                </div>
                                <div className="w-24">
                                    <Label>Marks</Label>
                                    <Input
                                        type="number"
                                        value={q.marks}
                                        onChange={(e) => updateQuestion(q.id, 'marks', Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            {q.type === 'mcq' && (
                                <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                                    <Label>Options & Correct Answer</Label>
                                    {q.options.map((opt, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="w-6 text-center text-sm font-bold text-gray-400">{String.fromCharCode(65 + i)}</div>
                                            <Input
                                                value={opt}
                                                onChange={(e) => updateOption(q.id, i, e.target.value)}
                                                placeholder={`Option ${i + 1}`}
                                            />
                                            <input
                                                type="radio"
                                                name={`correct-${q.id}`}
                                                checked={q.correctAnswer === opt && opt !== ''}
                                                onChange={() => updateQuestion(q.id, 'correctAnswer', opt)}
                                                className="w-4 h-4"
                                            />
                                        </div>
                                    ))}
                                    <p className="text-xs text-muted-foreground">Select the radio button next to the correct option.</p>
                                </div>
                            )}

                            {q.type === 'true_false' && (
                                <div className="space-y-2">
                                    <Label>Correct Answer</Label>
                                    <Select value={q.correctAnswer} onValueChange={(val) => updateQuestion(q.id, 'correctAnswer', val)}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="true">True</SelectItem>
                                            <SelectItem value="false">False</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {q.type === 'fill_blank' && (
                                <div className="space-y-2">
                                    <Label>Correct Answer</Label>
                                    <Input
                                        value={q.correctAnswer}
                                        onChange={(e) => updateQuestion(q.id, 'correctAnswer', e.target.value)}
                                        placeholder="The exact word/phrase"
                                    />
                                </div>
                            )}

                        </CardContent>
                    </Card>
                ))}

                {questions.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg text-gray-400">
                        No questions added yet. Click on the buttons above to add questions.
                    </div>
                )}
            </div>
        </div>
    );
}
