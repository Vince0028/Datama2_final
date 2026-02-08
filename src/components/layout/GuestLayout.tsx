import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Hotel, Bed, Calendar, Home, LogIn, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GuestLayoutProps {
    children: ReactNode;
}

export function GuestLayout({ children }: GuestLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();

    const navigation = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Rooms', href: '/guest/rooms', icon: Bed },
        { name: 'My Booking', href: '/guest/booking', icon: Calendar },
    ];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

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

                        <div className="flex items-center gap-2 ml-4">
                            {isAuthenticated && user?.User_Type === 'Guest' ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                                                <User className="h-3.5 w-3.5 text-primary" />
                                            </div>
                                            <span className="hidden sm:inline-block text-sm">
                                                {user.guestData?.First_Name}
                                            </span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuLabel>
                                            {user.guestData?.First_Name} {user.guestData?.Last_Name}
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link to="/guest/booking">My Bookings</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Logout
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <>
                                    <Link to="/login">
                                        <Button variant="ghost" size="sm" className="gap-2">
                                            <LogIn className="h-4 w-4" />
                                            <span className="hidden sm:inline-block">Login</span>
                                        </Button>
                                    </Link>
                                    <Link to="/signup">
                                        <Button size="sm" className="hidden sm:inline-flex">
                                            Sign Up
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
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

