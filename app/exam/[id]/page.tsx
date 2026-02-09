'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { AlertTriangle, Clock, Maximize, AlertCircle } from 'lucide-react';

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [exam, setExam] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [started, setStarted] = useState(false);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const flags = useRef<{ type: string; timestamp: Date }[]>([]);

    // Unwrap params
    const [examId, setExamId] = useState<string>('');

    useEffect(() => {
        params.then(p => setExamId(p.id));
    }, [params]);

    // Fetch Exam
    useEffect(() => {
        if (!examId) return;
        const fetchExam = async () => {
            try {
                const token = localStorage.getItem('token');

                // Check submission status first
                const statusRes = await fetch(`/api/exams/${examId}/check-status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const statusData = await statusRes.json();
                if (statusData.submitted) {
                    toast.error('You have already submitted this exam.');
                    router.push('/dashboard/candidate');
                    return;
                }

                const res = await fetch(`/api/exams/${examId}`);
                const data = await res.json();
                if (res.ok) {
                    setExam(data.exam);
                    setTimeLeft(data.exam.duration * 60);
                } else {
                    toast.error('Failed to load exam');
                    router.push('/dashboard/candidate');
                }
            } catch (e) {
                toast.error('Error loading exam');
            } finally {
                setLoading(false);
            }
        };
        fetchExam();
    }, [examId, router]);

    // Timer
    useEffect(() => {
        if (!started || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    submitExam();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [started, timeLeft]);

    // Proctoring: Visibility Change (Tab Switch)
    useEffect(() => {
        if (!started) return;
        const handleVisibilityChange = () => {
            if (document.hidden) {
                toast.warning('Warning: Tab switch detected! This action is flagged.', { duration: 5000 });
                flags.current.push({ type: 'TAB_SWITCH', timestamp: new Date() });
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [started]);

    // Proctoring: Capture Snapshot
    const captureSnapshot = useCallback((reason: string) => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            // Compress to jpeg 0.5 to save space
            const image = canvas.toDataURL('image/jpeg', 0.5);
            captures.current.push({ image, reason, timestamp: new Date() });
        }
    }, []);

    // Proctoring: Fullscreen
    const enterFullscreen = useCallback(() => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => {
                toast.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
            if (!document.fullscreenElement && started) {
                toast.warning('Warning: You exited fullscreen mode! This action is flagged.');
                flags.current.push({ type: 'FULLSCREEN_EXIT', timestamp: new Date() });
                captureSnapshot('Fullscreen Exit');
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [started, captureSnapshot]);

    // Proctoring: Camera
    const startProctoring = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(mediaStream);
            setStarted(true);
            enterFullscreen();
        } catch (err) {
            toast.error('Camera/Microphone permission required for proctoring.');
        }
    };

    useEffect(() => {
        if (started && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [started, stream]);


    const submitExam = useCallback(async () => {
        // Stop media stream
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        try {
            const userStr = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            if (!userStr || !token) return;

            const res = await fetch(`/api/exams/${examId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    answers,
                    flags: flags.current,
                    captures: captures.current,
                }),
            });

            if (res.ok) {
                toast.success('Exam submitted successfully!');
                router.push('/dashboard/candidate');
            } else {
                toast.error('Submission failed.');
            }
        } catch (e) {
            toast.error('Error submitting exam');
        }
    }, [answers, examId, stream, router]);

    if (loading) return <div className="p-8">Loading Exam...</div>;
    if (!exam) return <div className="p-8">Exam not found.</div>;

    if (!started) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-6 max-w-2xl mx-auto text-center">
                <h1 className="text-3xl font-bold">{exam.title}</h1>
                <Card className="w-full text-left">
                    <CardHeader>
                        <CardTitle>Instructions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>{exam.description}</p>
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                            <div className="flex items-center mb-2">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                                <span className="font-bold text-yellow-700">Strict Proctoring Enabled</span>
                            </div>
                            <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                                <li>Fullscreen mode is required. Exiting flags the session.</li>
                                <li>Tab switching is monitored and flagged.</li>
                                <li>Camera and Microphone must remain active.</li>
                            </ul>
                        </div>
                        <p className="text-sm text-gray-500">Duration: {exam.duration} minutes</p>
                    </CardContent>
                    <CardFooter>
                        <Button size="lg" className="w-full" onClick={startProctoring}>
                            Agree & Start Exam
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const currentQ = exam.questions[currentQIndex];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <h2 className="font-bold text-lg truncate w-1/3">{exam.title}</h2>
                <div className="flex items-center space-x-4">
                    {/* Proctoring View */}
                    <div className="relative w-32 h-24 bg-black rounded overflow-hidden shadow-lg border-2 border-red-500">
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    </div>

                    <div className={`text-xl font-mono font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-gray-700'}`}>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>

                    <Button variant="destructive" size="sm" onClick={submitExam}>Finish Exam</Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto p-6 max-w-4xl">
                {!isFullscreen && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center">
                        <AlertCircle className="mr-2" />
                        <span>Please enable fullscreen mode to avoid being flagged!</span>
                        <Button variant="outline" size="sm" className="ml-auto" onClick={enterFullscreen}>Enable <Maximize className="ml-2 w-3 h-3" /></Button>
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-500">Question {currentQIndex + 1} of {exam.questions.length}</span>
                            <span className="text-sm font-medium text-gray-500">Marks: {currentQ.marks}</span>
                        </div>
                        <CardTitle className="text-xl">{currentQ.questionText}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {currentQ.type === 'mcq' && (
                            <RadioGroup
                                value={answers[currentQ._id] || ''}
                                onValueChange={(val) => setAnswers({ ...answers, [currentQ._id]: val })}
                            >
                                {currentQ.options.map((opt: string, i: number) => (
                                    <div key={i} className="flex items-center space-x-2 border p-3 rounded hover:bg-slate-50">
                                        <RadioGroupItem value={opt} id={`opt-${i}`} />
                                        <Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer">{opt}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        )}

                        {currentQ.type === 'true_false' && (
                            <RadioGroup
                                value={answers[currentQ._id] || ''}
                                onValueChange={(val) => setAnswers({ ...answers, [currentQ._id]: val })}
                            >
                                <div className="flex items-center space-x-2 border p-3 rounded">
                                    <RadioGroupItem value="true" id="true" />
                                    <Label htmlFor="true">True</Label>
                                </div>
                                <div className="flex items-center space-x-2 border p-3 rounded">
                                    <RadioGroupItem value="false" id="false" />
                                    <Label htmlFor="false">False</Label>
                                </div>
                            </RadioGroup>
                        )}

                        {(currentQ.type === 'descriptive' || currentQ.type === 'fill_blank') && (
                            <Textarea
                                value={answers[currentQ._id] || ''}
                                onChange={(e) => setAnswers({ ...answers, [currentQ._id]: e.target.value })}
                                placeholder="Type your answer here..."
                                className="min-h-[150px]"
                            />
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQIndex === 0}
                        >
                            Previous
                        </Button>
                        {currentQIndex < exam.questions.length - 1 ? (
                            <Button onClick={() => setCurrentQIndex(prev => prev + 1)}>
                                Next
                            </Button>
                        ) : (
                            <Button onClick={submitExam} className="bg-green-600 hover:bg-green-700">
                                Submit Exam
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </main >
        </div >
    );
}
