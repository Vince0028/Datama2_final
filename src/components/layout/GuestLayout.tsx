import { ReactNode, useState } from 'react';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface GuestLayoutProps {
    children: ReactNode;
}

export function GuestLayout({ children }: GuestLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const [privacyOpen, setPrivacyOpen] = useState(false);
    const [termsOpen, setTermsOpen] = useState(false);
    const [contactOpen, setContactOpen] = useState(false);

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
                            <img src="/website_logo.png" alt="Nano Banan" className="h-10 w-auto" />
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
                                                {user.guestData?.First_Name || 'Guest'}
                                            </span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuLabel>
                                            {user.guestData?.First_Name} {user.guestData?.Last_Name}
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => navigate('/guest/profile')}>
                                            <User className="h-4 w-4 mr-2" />
                                            My Account
                                        </DropdownMenuItem>
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

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-300">
                <div className="container py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <img src="/website_logo.png" alt="Nano Banan" className="h-8 w-auto" />
                            <span className="font-display font-semibold text-white">Hotel Reservation</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                            <span onClick={() => setPrivacyOpen(true)} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
                            <span onClick={() => setTermsOpen(true)} className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
                            <span onClick={() => setContactOpen(true)} className="hover:text-white transition-colors cursor-pointer">Contact Us</span>
                        </div>
                        <p className="text-sm text-slate-400">
                            © 2026 Hotel Reservation
                        </p>
                    </div>
                </div>
            </footer>

            {/* Privacy Policy Dialog */}
            <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Privacy Policy</DialogTitle>
                        <DialogDescription>Last updated: February 8, 2026</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm">
                        <section>
                            <h3 className="font-semibold text-base mb-2">1. Information We Collect</h3>
                            <p className="text-muted-foreground">
                                We collect information you provide directly to us, including your name, email address, phone number,
                                and payment information when you make a reservation. We also collect information about your device
                                and how you interact with our services.
                            </p>
                        </section>
                        <section>
                            <h3 className="font-semibold text-base mb-2">2. How We Use Your Information</h3>
                            <p className="text-muted-foreground">
                                We use your information to process reservations, communicate with you about your bookings,
                                improve our services, and send you promotional materials (with your consent). We do not sell
                                your personal information to third parties.
                            </p>
                        </section>
                        <section>
                            <h3 className="font-semibold text-base mb-2">3. Data Security</h3>
                            <p className="text-muted-foreground">
                                We implement industry-standard security measures to protect your personal information.
                                All payment transactions are processed through secure, encrypted connections.
                            </p>
                        </section>
                        <section>
                            <h3 className="font-semibold text-base mb-2">4. Your Rights</h3>
                            <p className="text-muted-foreground">
                                You have the right to access, correct, or delete your personal information at any time.
                                You may also opt out of marketing communications by contacting us at privacy@hotel.com.
                            </p>
                        </section>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Terms of Service Dialog */}
            <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Terms of Service</DialogTitle>
                        <DialogDescription>Last updated: February 8, 2026</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm">
                        <section>
                            <h3 className="font-semibold text-base mb-2">1. Reservation & Cancellation Policy</h3>
                            <p className="text-muted-foreground">
                                All reservations are subject to availability. Cancellations made 48 hours before check-in
                                will receive a full refund. Cancellations made within 48 hours are subject to a one-night charge.
                            </p>
                        </section>
                        <section>
                            <h3 className="font-semibold text-base mb-2">2. Check-in & Check-out</h3>
                            <p className="text-muted-foreground">
                                Standard check-in time is 3:00 PM and check-out time is 11:00 AM. Early check-in or late
                                check-out may be available upon request and subject to additional charges.
                            </p>
                        </section>
                        <section>
                            <h3 className="font-semibold text-base mb-2">3. Payment Terms</h3>
                            <p className="text-muted-foreground">
                                Full payment is required at the time of booking. We accept major credit cards and online payment methods.
                                All prices are in Philippine Pesos (₱) and include applicable taxes unless otherwise stated.
                            </p>
                        </section>
                        <section>
                            <h3 className="font-semibold text-base mb-2">4. Guest Conduct</h3>
                            <p className="text-muted-foreground">
                                Guests are expected to respect hotel property and other guests. Smoking is prohibited in all rooms.
                                Any damage to hotel property will be charged to the guest's account.
                            </p>
                        </section>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Contact Us Dialog */}
            <Dialog open={contactOpen} onOpenChange={setContactOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Contact Us</DialogTitle>
                        <DialogDescription>We're here to help 24/7</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold">General Inquiries</h3>
                            <p className="text-sm text-muted-foreground">Email: info@hotel.com</p>
                            <p className="text-sm text-muted-foreground">Phone: +63 2 1234 5678</p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold">Reservations</h3>
                            <p className="text-sm text-muted-foreground">Email: reservations@hotel.com</p>
                            <p className="text-sm text-muted-foreground">Phone: +63 2 8765 4321</p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold">Address</h3>
                            <p className="text-sm text-muted-foreground">
                                123 Hotel Boulevard<br />
                                Makati City, Metro Manila<br />
                                Philippines 1200
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold">Business Hours</h3>
                            <p className="text-sm text-muted-foreground">Front Desk: 24/7</p>
                            <p className="text-sm text-muted-foreground">Office: Monday - Friday, 9 AM - 6 PM</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

