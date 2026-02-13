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
                postalCode: user.guestData.Postal_Code || '',
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        const name = e.target.name;

        // Phone: allow only digits
        if (name === 'phone') {
            value = value.replace(/[^0-9]/g, '');
        }

        // Names: allow only letters, spaces, hyphens, apostrophes, and dots
        if (name === 'firstName' || name === 'lastName') {
            value = value.replace(/[^A-Za-z\s\-''.]/g, '');
        }

        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            setError('First name and last name are required');
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

        setIsSaving(true);
        const result = await updateGuestProfile({
            First_Name: formData.firstName.trim(),
            Last_Name: formData.lastName.trim(),
            Phone: parseInt(formData.phone.trim(), 10),
            Address: formData.address.trim(),
            City: formData.city.trim(),
            Postal_Code: formData.postalCode.trim(),
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
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="09123456789"
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
                                value={formData.address}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    name="city"
                                    placeholder="Manila"
                                    value={formData.city}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="postalCode">Postal Code</Label>
                                <Input
                                    id="postalCode"
                                    name="postalCode"
                                    placeholder="1000"
                                    value={formData.postalCode}
                                    onChange={handleChange}
                                />
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
