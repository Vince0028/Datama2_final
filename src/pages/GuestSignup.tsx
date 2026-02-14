import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import { CitySelect } from '@/components/CitySelect';

export default function GuestSignup() {
    const navigate = useNavigate();
    const { signup, isLoading } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        middleName: '',
        lastName: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const LIMITS = { firstName: 50, middleName: 50, lastName: 50, email: 100, address: 150, city: 50, postalCode: 4, phone: 13 };

    // Auto-capitalize each word: "vince nelmar" → "Vince Nelmar", "VINCE" → "Vince"
    const toTitleCase = (str: string) =>
        str.replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        const name = e.target.name;

        // Trim spaces for email and password fields
        if (name === 'email' || name === 'password' || name === 'confirmPassword') {
            value = value.replace(/\s/g, '');
        }

        // Phone & postal code: allow only digits
        if (name === 'phone' || name === 'postalCode') {
            value = value.replace(/[^0-9]/g, '');
        }

        // Names: allow only letters, spaces, hyphens, apostrophes, and dots — then Title Case
        if (name === 'firstName' || name === 'middleName' || name === 'lastName') {
            value = toTitleCase(value.replace(/[^A-Za-z\s\-''.]/g, ''));
        }

        // Address & City: auto Title Case
        if (name === 'address' || name === 'city') {
            value = toTitleCase(value);
        }

        // Enforce max length
        const limit = LIMITS[name as keyof typeof LIMITS];
        if (limit && value.length > limit) value = value.slice(0, limit);

        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const charHint = (field: keyof typeof LIMITS, value: string) => {
        const limit = LIMITS[field];
        const remaining = limit - value.length;
        if (remaining <= Math.ceil(limit * 0.2) && remaining > 0) return <p className="text-xs text-amber-500 mt-0.5">{remaining} characters left</p>;
        if (remaining <= 0) return <p className="text-xs text-destructive mt-0.5">Character limit reached</p>;
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        // Validate names are not empty and at least 2 characters
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            setError('First name and last name are required');
            return;
        }

        if (formData.firstName.trim().length < 2 || formData.lastName.trim().length < 2) {
            setError('First name and last name must be at least 2 characters');
            return;
        }

        // Validate phone is provided and has proper format
        if (!formData.phone.trim()) {
            setError('Phone number is required');
            return;
        }

        if (!/^(09[0-9]{9}|639[0-9]{9})$/.test(formData.phone.trim())) {
            setError('Enter a valid PH phone number (e.g. 09123456789 or 639123456789)');
            return;
        }

        if (formData.postalCode.trim() && !/^[1-9][0-9]{3}$/.test(formData.postalCode.trim())) {
            setError('Postal code must be 4 digits (1000–9999)');
            return;
        }

        const success = await signup(formData.email.trim(), formData.password, {
            First_Name: formData.firstName.trim(),
            Middle_Name: formData.middleName.trim(),
            Last_Name: formData.lastName.trim(),
            Phone: parseInt(formData.phone.trim(), 10),
            Address: formData.address.trim(),
            City: formData.city.trim(),
            Postal_Code: formData.postalCode.trim() ? parseInt(formData.postalCode.trim(), 10) : undefined,
        });

        if (success) {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-10" />

            <Card className="w-full max-w-md relative z-10 shadow-2xl border-none bg-background/95 backdrop-blur-sm">
                <CardHeader className="text-center space-y-2 pb-2">
                    <Link to="/login" className="absolute left-4 top-4 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="mx-auto w-auto h-16 flex items-center justify-center mb-4">
                        <img src="/website_logo.png" alt="Nano Banan" className="h-16 w-auto" />
                    </div>
                    <CardTitle className="text-2xl font-display">Create Account</CardTitle>
                    <CardDescription>Join us and start booking your perfect stay</CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    placeholder="John"
                                    maxLength={LIMITS.firstName}
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                                {charHint('firstName', formData.firstName)}
                                {formData.firstName.length === 1 && (
                                    <p className="flex items-center gap-1 text-xs text-amber-500 mt-0.5">
                                        <AlertCircle className="h-3 w-3" /> Minimum 2 characters required
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="middleName">Middle Name <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                                <Input
                                    id="middleName"
                                    name="middleName"
                                    placeholder="A."
                                    maxLength={LIMITS.middleName}
                                    value={formData.middleName}
                                    onChange={handleChange}
                                />
                                {charHint('middleName', formData.middleName)}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    placeholder="Doe"
                                    maxLength={LIMITS.lastName}
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                                {charHint('lastName', formData.lastName)}
                                {formData.lastName.length === 1 && (
                                    <p className="flex items-center gap-1 text-xs text-amber-500 mt-0.5">
                                        <AlertCircle className="h-3 w-3" /> Minimum 2 characters required
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="your@email.com"
                                maxLength={LIMITS.email}
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                            {charHint('email', formData.email)}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="09123456789"
                                maxLength={LIMITS.phone}
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                            {formData.phone && !/^(09[0-9]{9}|639[0-9]{9})$/.test(formData.phone) && (
                                <p className="flex items-center gap-1 text-xs text-amber-500 mt-0.5">
                                    <AlertCircle className="h-3 w-3" /> Format: 09XXXXXXXXX or 639XXXXXXXXX
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                name="address"
                                placeholder="123 Main Street"
                                maxLength={LIMITS.address}
                                value={formData.address}
                                onChange={handleChange}
                            />
                            {charHint('address', formData.address)}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <CitySelect
                                    value={formData.city}
                                    onChange={(city) => {
                                        setFormData(prev => ({ ...prev, city }));
                                        setError('');
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="postalCode">Postal Code</Label>
                                <Input
                                    id="postalCode"
                                    name="postalCode"
                                    placeholder="1000"
                                    maxLength={LIMITS.postalCode}
                                    value={formData.postalCode}
                                    onChange={handleChange}
                                />
                                {formData.postalCode && !/^[1-9][0-9]{3}$/.test(formData.postalCode) && (
                                    <p className="text-xs text-amber-500 mt-0.5">Must be 4 digits (1000–9999)</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
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

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-destructive text-center">{error}</p>
                        )}
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Create Account
                        </Button>
                        <p className="text-sm text-muted-foreground text-center">
                            Already have an account?{' '}
                            <Link to="/login" className="text-accent hover:underline font-medium">
                                Sign in
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
