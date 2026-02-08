import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

// Role-based default landing pages
const roleDefaultPage: Record<string, string> = {
    Manager: '/staff/dashboard',
    Housekeeping: '/staff/rooms',
    Accountant: '/staff/dashboard',
    FrontDesk: '/staff/dashboard',
    Concierge: '/staff/dashboard',
    ReservationAgent: '/staff/dashboard',
};

export default function StaffLogin() {
    const navigate = useNavigate();
    const { login, isLoading, isInitializing, isAuthenticated, user } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Redirect if already logged in as staff — go to role-specific page
    useEffect(() => {
        if (!isInitializing && isAuthenticated && user?.User_Type === 'Staff') {
            const dest = roleDefaultPage[user.staffData?.Role || 'Manager'] || '/staff/dashboard';
            navigate(dest, { replace: true });
        }
    }, [isInitializing, isAuthenticated, user, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Prevent empty submissions
        if (!email || !password) {
            return;
        }

        const success = await login(email, password, 'Staff');
        if (success) {
            // user state may not be set yet, so derive role from the login response
            // The auth state change will redirect via the useEffect above
            // But we also do an immediate navigate as a fallback
            navigate('/staff/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-5" />

            <Card className="w-full max-w-md relative z-10 shadow-2xl border-none bg-background/95 backdrop-blur-sm">
                <CardHeader className="text-center space-y-2 pb-2">
                    <div className="mx-auto w-auto h-16 flex items-center justify-center mb-4">
                        <img src="/website_logo.png" alt="Nano Banan" className="h-16 w-auto" />
                    </div>
                    <CardTitle className="text-2xl font-display">Staff Portal</CardTitle>
                    <CardDescription>Sign in to access the management system</CardDescription>
                </CardHeader>

                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg border border-primary/10">
                            <Briefcase className="h-4 w-4 text-primary" />
                            <span className="text-sm text-muted-foreground">Staff Access Only</span>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Staff Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="staff@hotel.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            <p className="font-medium mb-1">Demo Credentials:</p>
                            <p>housekeeping@hotel.com / house123</p>
                            <p>accountant@hotel.com / accountant123</p>
                            <p>manager@hotel.com / manager123</p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Sign In
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
