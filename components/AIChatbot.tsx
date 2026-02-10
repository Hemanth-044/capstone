'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, X, Send, Cpu, User } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
    role: 'user' | 'model';
    content: string;
}

export default function AIChatbot({ role = 'candidate' }: { role?: 'examiner' | 'candidate' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'model', content: role === 'examiner'
                ? "Hello! I'm your AI Assistant. Need help creating exam questions?"
                : "Hi there! I'm your AI Tutor. Stuck on a concept? Ask me anything!"
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMsg], role }),
            });

            if (!res.ok) throw new Error('Failed to get response');

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'model', content: data.text }]);
        } catch (error) {
            console.error(error);
            toast.error('AI is currently unavailable.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <Card className="w-80 h-96 shadow-xl mb-4 flex flex-col animate-in fade-in slide-in-from-bottom-5">
                    <CardHeader className="bg-primary text-primary-foreground py-3 px-4 rounded-t-lg flex flex-row items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Cpu className="w-5 h-5" />
                            <CardTitle className="text-sm font-medium">AI Assistant</CardTitle>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary/80" onClick={() => setIsOpen(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden bg-gray-50 dark:bg-gray-900">
                        <ScrollArea className="h-full p-4">
                            <div className="flex flex-col space-y-4">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-br-none'
                                            : 'bg-white dark:bg-gray-800 border shadow-sm rounded-bl-none'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white dark:bg-gray-800 border shadow-sm rounded-lg p-3 rounded-bl-none">
                                            <span className="flex space-x-1">
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-0"></span>
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></span>
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="p-3 bg-white dark:bg-gray-950 border-t">
                        <div className="flex w-full items-center space-x-2">
                            <Input
                                placeholder="Type your question..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                disabled={loading}
                                className="h-9 text-sm focus-visible:ring-1"
                            />
                            <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={loading || !input.trim()}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            )}

            <Button
                onClick={() => setIsOpen(!isOpen)}
                size="lg"
                className={`rounded-full shadow-lg h-14 w-14 p-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 ${isOpen ? 'rotate-90 opacity-0 pointer-events-none absolute' : 'rotate-0 opacity-100'}`}
            >
                <MessageSquare className="w-7 h-7 text-white" />
            </Button>
        </div>
    );
}
