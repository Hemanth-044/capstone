'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LayoutDashboard, FilePlus, LogOut, User, Calendar as CalendarIcon, BookOpen, FileText, HelpCircle, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';
import { ModeToggle } from '@/components/mode-toggle';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        // Basic client-side role check
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    setUserRole(user.role);
                } catch (e) {
                    router.push('/login');
                }
            } else {
                router.push('/login');
            }
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.success('Logged out');
        router.push('/login');
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground w-64 p-4 space-y-4 border-r border-sidebar-border">
            <div className="text-2xl font-bold mb-6 flex justify-between items-center">
                <span>ExamPlatform</span>
            </div>

            <div className="space-y-2 flex-1">
                {userRole === 'examiner' && (
                    <>
                        <Link href="/dashboard/examiner">
                            <Button variant={pathname === '/dashboard/examiner' ? 'secondary' : 'ghost'} className="w-full justify-start">
                                <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                            </Button>
                        </Link>
                        <Link href="/dashboard/examiner/create-exam">
                            <Button variant={pathname === '/dashboard/examiner/create-exam' ? 'secondary' : 'ghost'} className="w-full justify-start">
                                <FilePlus className="mr-2 h-4 w-4" /> Create Exam
                            </Button>
                        </Link>
                        <Link href="/dashboard/groups">
                            <Button variant={pathname.startsWith('/dashboard/groups') ? 'secondary' : 'ghost'} className="w-full justify-start">
                                <User className="mr-2 h-4 w-4" /> Groups
                            </Button>
                        </Link>
                        <Link href="/dashboard/calendar">
                            <Button variant={pathname === '/dashboard/calendar' ? 'secondary' : 'ghost'} className="w-full justify-start">
                                <CalendarIcon className="mr-2 h-4 w-4" /> Calendar
                            </Button>
                        </Link>
                    </>
                )}

                {userRole === 'candidate' && (
                    <>
                        <Link href="/dashboard/candidate">
                            <Button variant={pathname === '/dashboard/candidate' ? 'secondary' : 'ghost'} className="w-full justify-start">
                                <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                            </Button>
                        </Link>
                        <Link href="/dashboard/groups">
                            <Button variant={pathname.startsWith('/dashboard/groups') ? 'secondary' : 'ghost'} className="w-full justify-start">
                                <User className="mr-2 h-4 w-4" /> Groups
                            </Button>
                        </Link>
                        <Link href="/dashboard/calendar">
                            <Button variant={pathname === '/dashboard/calendar' ? 'secondary' : 'ghost'} className="w-full justify-start">
                                <CalendarIcon className="mr-2 h-4 w-4" /> Calendar
                            </Button>
                        </Link>
                        <Link href="/dashboard/candidate/analysis">
                            <Button variant={pathname === '/dashboard/candidate/analysis' ? 'secondary' : 'ghost'} className="w-full justify-start">
                                <BarChart2 className="mr-2 h-4 w-4" /> Analytics
                            </Button>
                        </Link>
                        <Link href="/dashboard/library">
                            <Button variant={pathname === '/dashboard/library' ? 'secondary' : 'ghost'} className="w-full justify-start">
                                <BookOpen className="mr-2 h-4 w-4" /> Resources
                            </Button>
                        </Link>
                        <div className='my-2 border-t border-sidebar-border/50' />
                        <Link href="/dashboard/candidate/guide">
                            <Button variant={pathname === '/dashboard/candidate/guide' ? 'secondary' : 'ghost'} className="w-full justify-start">
                                <FileText className="mr-2 h-4 w-4" /> Guide
                            </Button>
                        </Link>
                        <Link href="/dashboard/candidate/help">
                            <Button variant={pathname === '/dashboard/candidate/help' ? 'secondary' : 'ghost'} className="w-full justify-start">
                                <HelpCircle className="mr-2 h-4 w-4" /> Help & Support
                            </Button>
                        </Link>
                    </>
                )}
            </div>

            <div className="border-t border-sidebar-border pt-4 space-y-2">
                <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-sm font-medium">Theme</span>
                    <ModeToggle />
                </div>
                <Link href="/dashboard/profile">
                    <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                        <User className="mr-2 h-4 w-4" /> Profile
                    </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-sidebar-accent hover:text-destructive" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </div>
        </div >
    );

    if (!userRole) return null; // or loading spinner

    return (
        <div className="flex h-screen w-full bg-background">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <SidebarContent />
            </div>

            {/* Mobile Sidebar */}
            <div className="md:hidden absolute top-4 left-4 z-50">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Menu className="h-4 w-4" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 border-none w-64">
                        <SidebarContent />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-8 pt-16 md:pt-8 w-full">
                {children}
            </div>
        </div>
    );
}
