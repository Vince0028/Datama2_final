import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GuestProfile() {
    const { user, updateGuestProfile, isLoading } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
    });

    // Populate form with current user data
    useEffect(() => {
        if (user?.guestData) {
            setFormData({
                firstName: user.guestData.First_Name || '',
                lastName: user.guestData.Last_Name || '',
                phone: user.guestData.Phone ? String(user.guestData.Phone) : '',
                address: user.guestData.Address || '',
                city: user.guestData.City || '',
                postalCode: String(user.guestData.Postal_Code || ''),
            });
        }
    }, [user]);

    const LIMITS = { firstName: 50, lastName: 50, email: 100, address: 150, city: 50, postalCode: 4, phone: 13 };

    // Auto-capitalize each word: "vince nelmar" → "Vince Nelmar", "VINCE" → "Vince"
    const toTitleCase = (str: string) =>
        str.replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        const name = e.target.name;

        // Phone & postal code: allow only digits
        if (name === 'phone' || name === 'postalCode') {
            value = value.replace(/[^0-9]/g, '');
        }

        // Names: allow only letters, spaces, hyphens, apostrophes, and dots — then Title Case
        if (name === 'firstName' || name === 'lastName') {
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
        setSuccess('');
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
        setSuccess('');

        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            setError('First name and last name are required');
            return;
        }

        if (formData.firstName.trim().length < 2 || formData.lastName.trim().length < 2) {
            setError('First name and last name must be at least 2 characters');
            return;
        }

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

        setIsSaving(true);
        const result = await updateGuestProfile({
            First_Name: formData.firstName.trim(),
            Last_Name: formData.lastName.trim(),
            Phone: parseInt(formData.phone.trim(), 10),
            Address: formData.address.trim(),
            City: formData.city.trim(),
            Postal_Code: formData.postalCode.trim() ? parseInt(formData.postalCode.trim(), 10) : undefined,
        });

        if (result) {
            setSuccess('Profile updated successfully!');
        }
        setIsSaving(false);
    };

    return (
        <div className="container max-w-2xl py-10">
            <Card className="shadow-lg border-none">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                            <User className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-display">My Account</CardTitle>
                            <CardDescription>Update your personal information</CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-sm">Email</Label>
                            <Input
                                value={user?.Email || ''}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                        </div>

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
                            </div>
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
                                <Input
                                    id="city"
                                    name="city"
                                    placeholder="Manila"
                                    maxLength={LIMITS.city}
                                    value={formData.city}
                                    onChange={handleChange}
                                />
                                {charHint('city', formData.city)}
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

                        {error && (
                            <p className="text-sm text-destructive text-center">{error}</p>
                        )}
                        {success && (
                            <p className="text-sm text-green-600 text-center">{success}</p>
                        )}
                    </CardContent>

                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isSaving || isLoading}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
