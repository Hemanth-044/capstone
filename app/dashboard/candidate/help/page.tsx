"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HelpPage() {
    const faqs = [
        {
            q: "How do I start an exam?",
            a: "Go to your Dashboard, find the exam in the 'Upcoming Exams' or 'Available Exams' list, and click the 'Start Exam' button. The button will only be active during the scheduled exam window."
        },
        {
            q: "What happens if I disconnect?",
            a: "If you lose internet connection, do not close the tab. The system attempts to reconnect. If you must refresh, your progress is saved, but you should notify your examiner immediately."
        },
        {
            q: "Why does the exam require my camera?",
            a: "This platform uses automated proctoring. The camera is used to ensure the integrity of the exam environment. No video is permanently stored unless a violation is detected."
        },
        {
            q: "What counts as a violation?",
            a: "Switching tabs, exiting fullscreen mode, multiple faces in the frame, or looking away from the screen for extended periods are flagged as potential violations."
        },
        {
            q: "How do I see my results?",
            a: "Once you submit an exam, if the results are released immediately, you can view them in the 'History' tab of your dashboard. Some exams require manual grading by the examiner."
        }
    ];

    return (
        <div className="space-y-6 container mx-auto p-6 max-w-4xl">
            <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
            <p className="text-muted-foreground">Frequently asked questions and support resources.</p>

            <div className="grid gap-4">
                {faqs.map((faq, index) => (
                    <Card key={index} className="transition-all hover:shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0">
                                    ?
                                </Badge>
                                {faq.q}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-muted/50 border-none mt-8">
                <CardHeader>
                    <CardTitle>Still need help?</CardTitle>
                    <CardDescription>Contact your institution's administrator or the examiner directly.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm">Email: <span className="font-mono bg-background px-1 py-0.5 rounded">support@examplatform.com</span> (Demo)</p>
                </CardContent>
            </Card>
        </div>
    )
}
