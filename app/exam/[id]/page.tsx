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
import { AlertTriangle, Clock, Maximize, AlertCircle, Eye, Users, UserX, EyeOff, Smartphone, BookOpen, Monitor } from 'lucide-react';
import * as faceapi from '@vladmandic/face-api';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { useEnvironmentSecurity } from '@/hooks/use-environment-security';
import { useKeystrokeDynamics } from '@/hooks/use-keystroke-dynamics';

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
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const flags = useRef<{ type: string; message?: string; timestamp: Date }[]>([]);
    const captures = useRef<{ image: string; reason: string; timestamp: Date }[]>([]);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [status, setStatus] = useState<string>('Initializing...');
    const [headPose, setHeadPose] = useState<{ direction: string; color: string }>({ direction: 'Center', color: 'text-green-500' });
    const detectionInterval = useRef<NodeJS.Timeout | null>(null);
    const objectInterval = useRef<NodeJS.Timeout | null>(null);
    const [objectModel, setObjectModel] = useState<cocoSsd.ObjectDetection | null>(null);
    const detectedObjects = useRef<cocoSsd.DetectedObject[]>([]);

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

                // Load ML Models
                const loadModels = async () => {
                    const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
                    try {
                        await Promise.all([
                            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                            tf.ready(), // Ensure TF is ready
                        ]);
                        const loadedCoco = await cocoSsd.load();
                        setObjectModel(loadedCoco);
                        setModelsLoaded(true);
                        console.log('ML Models Loaded (Face + COCO-SSD)');
                    } catch (e) {
                        console.error('Error loading ML models:', e);
                        toast.error('Failed to load proctoring AI. Please refresh.');
                    }
                };
                loadModels();

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

    // Security Hook (Moved here to access captureSnapshot)
    const handleSecurityViolation = useCallback((type: string, message: string) => {
        if (!started) return;

        // Debounce
        const lastFlag = flags.current[flags.current.length - 1];
        if (!lastFlag || lastFlag.type !== type || (new Date().getTime() - new Date(lastFlag.timestamp).getTime() > 2000)) {
            flags.current.push({ type, message, timestamp: new Date() });
            captureSnapshot(`Security Violation: ${message}`);
        }
    }, [started, captureSnapshot]);

    const securityStatus = useEnvironmentSecurity(handleSecurityViolation);

    // Biometrics Hook
    const { status: bioStatus, confidence: bioConfidence } = useKeystrokeDynamics(started);

    // Flag Biometric Mismatch
    useEffect(() => {
        if (bioStatus === 'Mismatch' && bioConfidence < 50) {
            handleSecurityViolation('BIOMETRIC_MISMATCH', `Typing pattern mismatch (Confidence: ${Math.round(bioConfidence)}%)`);
        }
    }, [bioStatus, bioConfidence, handleSecurityViolation]);

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
            // Wait for video to be ready
            if (videoRef.current) {
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current!.play();
                };
            }
        } catch (err) {
            toast.error('Camera/Microphone permission required for proctoring.');
        }
    };

    useEffect(() => {
        if (started && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [started, stream]);


    useEffect(() => {
        if (!started || !objectModel || !videoRef.current) return;

        const runObjectDetection = async () => {
            if (videoRef.current && videoRef.current.readyState === 4 && !videoRef.current.paused && !videoRef.current.ended) {
                try {
                    const predictions = await objectModel.detect(videoRef.current);
                    detectedObjects.current = predictions;

                    const prohibited = predictions.filter(p => ['cell phone', 'book', 'laptop'].includes(p.class));

                    if (prohibited.length > 0) {
                        const item = prohibited[0].class;
                        // Debounce
                        const lastFlag = flags.current[flags.current.length - 1];
                        if (!lastFlag || lastFlag.type !== 'PROHIBITED_OBJECT' || (new Date().getTime() - new Date(lastFlag.timestamp).getTime() > 5000)) {
                            toast.error(`Prohibited Object Detected: ${item.toUpperCase()}`, { icon: <AlertTriangle className="text-red-600" /> });
                            flags.current.push({ type: 'PROHIBITED_OBJECT', message: `Detected: ${item}`, timestamp: new Date() });
                            captureSnapshot(`Prohibited Object: ${item}`);
                        }
                    }

                } catch (err) {
                    console.error('Object Detection Error:', err);
                }
            }
        };

        const intervalId = setInterval(runObjectDetection, 2000); // Check objects every 2s
        objectInterval.current = intervalId;
        return () => clearInterval(intervalId);
    }, [started, objectModel, captureSnapshot]);


    useEffect(() => {
        if (!started || !modelsLoaded || !videoRef.current || !canvasRef.current) return;

        const runDetection = async () => {
            // Ensure video is playing and has dimensions
            if (videoRef.current && videoRef.current.readyState === 4 && !videoRef.current.paused && !videoRef.current.ended) {

                try {
                    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
                    const detections = await faceapi.detectAllFaces(videoRef.current, options).withFaceLandmarks();

                    const displaySize = {
                        width: videoRef.current.videoWidth,
                        height: videoRef.current.videoHeight
                    };

                    // Resize and Draw Mesh
                    faceapi.matchDimensions(canvasRef.current!, displaySize);
                    const resizedDetections = faceapi.resizeResults(detections, displaySize);

                    // Clear previous drawings
                    const ctx = canvasRef.current!.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);

                        // Draw Face Landmarks
                        faceapi.draw.drawFaceLandmarks(canvasRef.current!, resizedDetections);

                        // Draw Object Bounding Boxes
                        detectedObjects.current.forEach(obj => {
                            const [x, y, width, height] = obj.bbox;
                            const isProhibited = ['cell phone', 'book', 'laptop'].includes(obj.class);

                            ctx.strokeStyle = isProhibited ? 'red' : 'blue';
                            ctx.lineWidth = 2;
                            ctx.strokeRect(x, y, width, height);

                            ctx.fillStyle = isProhibited ? 'red' : 'blue';
                            ctx.font = '12px Arial';
                            ctx.fillText(`${obj.class} (${Math.round(obj.score * 100)}%)`, x, y > 10 ? y - 5 : 10);
                        });
                    }

                    if (detections.length === 0) {
                        setStatus('No Face Detected');
                        setHeadPose({ direction: 'No Face', color: 'text-red-500' });
                        // No Face
                        const lastFlag = flags.current[flags.current.length - 1];
                        if (!lastFlag || lastFlag.type !== 'NO_FACE' || (new Date().getTime() - new Date(lastFlag.timestamp).getTime() > 5000)) {
                            console.warn('Flagging: No Face');
                            toast.warning('No Face Detected!', { icon: <UserX className="text-red-500" /> });
                            flags.current.push({ type: 'NO_FACE', timestamp: new Date() });
                        }
                    } else if (detections.length > 1) {
                        setStatus('Multiple Faces Detected');
                        setHeadPose({ direction: 'Multiple Faces', color: 'text-red-500' });
                        // Multiple Faces
                        const lastFlag = flags.current[flags.current.length - 1];
                        if (!lastFlag || lastFlag.type !== 'MULTIPLE_FACES' || (new Date().getTime() - new Date(lastFlag.timestamp).getTime() > 5000)) {
                            console.warn('Flagging: Multiple Faces');
                            toast.error('Multiple Faces Detected!', { icon: <Users className="text-red-500" /> });
                            flags.current.push({ type: 'MULTIPLE_FACES', timestamp: new Date() });
                            captureSnapshot('Multiple Faces');
                        }
                    } else {
                        // Head Pose Estimation
                        const landmarks = detections[0].landmarks;
                        const nose = landmarks.getNose();
                        const jaw = landmarks.getJawOutline();
                        const leftEye = landmarks.getLeftEye();
                        const rightEye = landmarks.getRightEye();

                        const noseX = nose[3].x;
                        const noseY = nose[3].y;
                        const leftJawX = jaw[0].x;
                        const rightJawX = jaw[16].x;
                        const faceWidth = rightJawX - leftJawX;

                        // Pitch Calculation (Vertical)
                        // Compare nose tip Y to the average Y of eyes
                        const avgEyeY = (leftEye[0].y + rightEye[3].y) / 2;
                        const noseToEyeDist = noseY - avgEyeY;
                        // Normalize by face height (approx via width or jaw-chin)
                        // Simple ratio: strictness depends on camera angle
                        const pitchRatio = noseToEyeDist / faceWidth;

                        const relativeNoseX = (noseX - leftJawX) / faceWidth;

                        let direction = 'Center';
                        let isViolation = false;

                        if (relativeNoseX < 0.25) {
                            direction = 'Looking Right >>'; // Mirrored?
                            isViolation = true;
                        } else if (relativeNoseX > 0.75) {
                            direction = '<< Looking Left';
                            isViolation = true;
                        } else if (pitchRatio < 0.2) { // Nose too close to eyes -> Looking Up
                            direction = 'Looking Up ^^';
                            isViolation = true;
                        } else if (pitchRatio > 0.6) { // Nose far down -> Looking Down
                            direction = 'Looking Down vv';
                            isViolation = true;
                        }

                        setStatus(isViolation ? 'Violation Detected' : 'Active Proctoring');
                        setHeadPose({
                            direction: direction,
                            color: isViolation ? 'text-orange-500' : 'text-green-500'
                        });

                        if (isViolation) {
                            const lastFlag = flags.current[flags.current.length - 1];
                            if (!lastFlag || lastFlag.type !== 'LOOKING_AWAY' || (new Date().getTime() - new Date(lastFlag.timestamp).getTime() > 3000)) {
                                console.warn('Flagging: Looking Away', relativeNoseX);
                                toast.warning(`Looking Away (${direction})`, { icon: <EyeOff className="text-orange-500" /> });
                                flags.current.push({ type: 'LOOKING_AWAY', timestamp: new Date() });
                                captureSnapshot(`Looking Away: ${direction}`);
                            }
                        }
                    }
                } catch (err) {
                    console.error('Face Detection Error:', err);
                }
            }
        };

        const intervalId = setInterval(runDetection, 100); // Faster refresh for mesh (10fps)
        detectionInterval.current = intervalId;

        return () => clearInterval(intervalId);
    }, [started, modelsLoaded, captureSnapshot, videoRef, canvasRef]);

    const submitExam = useCallback(async () => {
        // Stop media stream
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (detectionInterval.current) clearInterval(detectionInterval.current);
        if (objectInterval.current) clearInterval(objectInterval.current);

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
                        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full opacity-70" />
                        {/* Status Overlay */}
                        <div className="absolute bottom-0 left-0 w-full bg-black/60 text-[10px] text-white text-center py-0.5 truncate">
                            <span className={headPose.color}>{headPose.direction}</span>
                        </div>
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

                {securityStatus.isVM && (
                    <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded relative mb-4 flex items-center">
                        <AlertTriangle className="mr-2" />
                        <span><strong>Warning:</strong> Virtual Machine environment detected. This session is being flagged for review.</span>
                    </div>
                )}

                {/* Biometric Status Indicator (For Demo Purposes) */}
                <div className="flex items-center space-x-2 text-xs text-gray-400 mb-2 justify-end">
                    <span>Biometric Status:</span>
                    <span className={`font-bold ${bioStatus === 'Calibrating' ? 'text-blue-500' :
                            bioStatus === 'Verifying' ? 'text-green-500' :
                                'text-red-500'
                        }`}>
                        {bioStatus} {bioStatus !== 'Calibrating' && `(${Math.round(bioConfidence)}%)`}
                    </span>
                </div>

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
