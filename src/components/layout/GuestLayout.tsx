import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Hotel, Bed, Calendar, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";

interface GuestLayoutProps {
    children: ReactNode;
}

export function GuestLayout({ children }: GuestLayoutProps) {
    const location = useLocation();

    const navigation = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Rooms', href: '/guest/rooms', icon: Bed },
        { name: 'My Booking', href: '/guest/booking', icon: Calendar },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <Hotel className="h-5 w-5" />
                            </div>
                            <span className="font-display font-bold text-lg hidden sm:inline-block">
                                Hotel Reservation
                            </span>
                        </Link>
                    </div>

                    <nav className="flex items-center gap-1 sm:gap-6">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={cn(
                                        "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    <span className="hidden sm:inline-block">{item.name}</span>
                                </Link>
                            );
                        })}
                        <Link to="/staff/dashboard">
                            <Button variant="ghost" size="sm" className="ml-4 text-xs text-muted-foreground">
                                Staff Access
                            </Button>
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Simple Footer */}
            <footer className="border-t py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        © 2024 Hotel Reservation System. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
