"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, XCircle, Terminal, Info } from 'lucide-react'

export default function GuidePage() {
    return (
        <div className="space-y-8 container mx-auto p-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Platform Guide</h1>
                <p className="text-muted-foreground text-lg">Essential guidelines for a smooth examination experience.</p>
            </div>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold">Before the Exam</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-primary" /> System Check
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>• Ensure you have a stable internet connection.</p>
                            <p>• Use a modern browser (Chrome, Firefox, Edge).</p>
                            <p>• Grant permission for Camera and Microphone when prompted.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Info className="w-5 h-5 text-blue-500" /> Environment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>• Choose a quiet, well-lit room.</p>
                            <p>• Clear your desk of unauthorized materials.</p>
                            <p>• Ensure your face is clearly visible to the camera.</p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold">During the Exam</h2>

                <div className="bg-destructive/15 text-destructive p-4 rounded-lg flex items-start gap-4 border border-destructive/20">
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                    <div>
                        <h3 className="font-bold">Strict Proctoring Rules</h3>
                        <p className="text-sm opacity-90">
                            Violating these rules will trigger flags and may lead to disqualification.
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <CheckCircle2 className="text-green-500" /> Do's
                        </h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
                            <li>Keep your face in the camera frame.</li>
                            <li>Stay in Fullscreen mode at all times.</li>
                            <li>Focus on your screen.</li>
                            <li>Submit before the timer runs out.</li>
                        </ul>
                    </div>
                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <XCircle className="text-red-500" /> Don'ts
                        </h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
                            <li>Do NOT switch tabs or windows.</li>
                            <li>Do NOT maximize/minimize the browser.</li>
                            <li>Do NOT look away for long periods.</li>
                            <li>Do NOT use other devices.</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="bg-secondary/20 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Exam Interface Tips</h2>
                <div className="grid gap-4 md:grid-cols-3 text-center">
                    <div className="p-4 bg-background rounded shadow-sm">
                        <div className="font-bold mb-1">Navigation</div>
                        <p className="text-sm text-muted-foreground">Use "Next" and "Previous" buttons to move between questions.</p>
                    </div>
                    <div className="p-4 bg-background rounded shadow-sm">
                        <div className="font-bold mb-1">Timer</div>
                        <p className="text-sm text-muted-foreground">Keep an eye on the top-right countdown timer.</p>
                    </div>
                    <div className="p-4 bg-background rounded shadow-sm">
                        <div className="font-bold mb-1">Submission</div>
                        <p className="text-sm text-muted-foreground">Click "Finish Exam" only when you are completely done.</p>
                    </div>
                </div>
            </section>
        </div>
    )
}
