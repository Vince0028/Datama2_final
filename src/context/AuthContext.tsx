import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, rawQuery, rawMutate, setCachedToken, getCachedToken } from '@/lib/supabase';
import type { AuthUser } from '@/types/auth';
import type { Guest } from '@/types/hotel';
import { toast } from 'sonner';

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitializing: boolean;
    login: (email: string, password: string, userType: 'Guest' | 'Staff') => Promise<boolean>;
    signup: (email: string, password: string, guestData: Partial<Guest>) => Promise<boolean>;
    logout: () => void;
    updateGuestProfile: (data: Partial<Guest>) => Promise<boolean>;
    updateStaff: (staffId: number, data: Partial<{ shift: string; status: string; role: string }>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    // Fetch user details based on email — token passed to avoid getSession() hang
    const fetchUserDetails = async (email: string, token?: string) => {
        try {
            const [staffRes, guestRes] = await Promise.all([
                rawQuery('staff', { filters: `email=eq.${encodeURIComponent(email)}`, token }),
                rawQuery('guest', { filters: `email=eq.${encodeURIComponent(email)}`, token }),
            ]);

            const staffData = staffRes.data?.[0] || null;
            const guestData = guestRes.data?.[0] || null;

            if (staffData) {
                setUser({
                    User_ID: staffData.staff_id || staffData.Staff_ID,
                    Email: email,
                    User_Type: 'Staff',
                    Guest_ID: null,
                    Staff_ID: staffData.staff_id || staffData.Staff_ID,
                    staffData: {
                        First_Name: staffData.first_name || staffData.First_Name,
                        Last_Name: staffData.last_name || staffData.Last_Name,
                        Role: staffData.role || staffData.Role,
                    },
                });
                return;
            }

            if (guestData) {
                setUser({
                    User_ID: guestData.guest_id || guestData.Guest_ID,
                    Email: email,
                    User_Type: 'Guest',
                    Guest_ID: guestData.guest_id || guestData.Guest_ID,
                    Staff_ID: null,
                    guestData: {
                        First_Name: guestData.first_name || guestData.First_Name,
                        Middle_Name: guestData.middle_name || guestData.Middle_Name || '',
                        Last_Name: guestData.last_name || guestData.Last_Name,
                        Email: guestData.email || guestData.Email,
                        Phone: guestData.phone || guestData.Phone,
                        Address: guestData.address || guestData.Address || '',
                        City: guestData.city || guestData.City || '',
                        Postal_Code: guestData.postal_code || guestData.Postal_Code || null,
                    },
                });
                return;
            }

            // No guest/staff record found — create guest record on the fly
            // This handles cases where signup failed to save the profile
            console.warn('No Guest/Staff record found, creating guest record for:', email);
            const { data: newGuest } = await rawMutate('guest', 'POST', {
                body: {
                    first_name: email.split('@')[0],
                    last_name: '',
                    email: email,
                    phone: 0,
                    middle_name: '',
                    address: '',
                    city: '',
                    postal_code: null,
                },
                returnData: true,
                single: true,
                token,
            });

            if (newGuest) {
                setUser({
                    User_ID: newGuest.guest_id,
                    Email: email,
                    User_Type: 'Guest',
                    Guest_ID: newGuest.guest_id,
                    Staff_ID: null,
                    guestData: {
                        First_Name: newGuest.first_name,
                        Last_Name: newGuest.last_name,
                        Email: email,
                        Phone: 0
                    },
                });
                return;
            }

            setUser(null);
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    };

    // Initialize Auth — use onAuthStateChange as the single source of truth
    // This fires immediately with the cached session (no network round-trip)
    // and also handles future sign-in/sign-out events.
    useEffect(() => {
        let initialised = false;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // Cache the token so rawQuery/rawMutate use it instantly
            setCachedToken(session?.access_token || null);

            if (session?.user?.email) {
                await fetchUserDetails(session.user.email, session.access_token);
            } else {
                setUser(null);
            }
            // Mark init complete on the first event (INITIAL_SESSION)
            if (!initialised) {
                initialised = true;
                setIsInitializing(false);
            }
        });

        // Safety timeout — if onAuthStateChange never fires (edge case), unblock the UI
        const safetyTimer = setTimeout(() => {
            if (!initialised) {
                console.warn('Auth init safety timeout reached');
                initialised = true;
                setUser(null);
                setIsInitializing(false);
            }
        }, 1000);

        return () => {
            clearTimeout(safetyTimer);
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string, userType: 'Guest' | 'Staff'): Promise<boolean> => {
        setIsLoading(true);
        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setIsLoading(false);
            toast.error(error.message);
            return false;
        }

        // Auth state change listener will handle fetching user details
        // Verify staff role — pass the fresh session token explicitly
        if (userType === 'Staff') {
            try {
                const token = authData.session?.access_token;
                console.log('Verifying staff with email:', email);
                console.log('Token:', token ? 'present' : 'missing');

                const staffCheck = await rawQuery('staff', {
                    select: 'staff_id,email,role',
                    filters: `email=eq.${encodeURIComponent(email)}`,
                    token
                });

                console.log('Staff check result:', staffCheck);
                const staff = staffCheck.data?.[0] || null;

                if (!staff) {
                    console.error('No staff record found for:', email);
                    await supabase.auth.signOut();
                    toast.error("Unauthorized: No staff account found.");
                    setIsLoading(false);
                    return false;
                }

                console.log('Staff verified:', staff);
            } catch (e) {
                console.error("Staff verification error:", e);
                await supabase.auth.signOut();
                toast.error("Could not verify staff role. Please try again.");
                setIsLoading(false);
                return false;
            }
        }

        toast.success("Logged in successfully!");

        // Force update context immediately — pass the fresh token so RLS policies work
        const token = authData.session?.access_token;
        setCachedToken(token || null);
        await fetchUserDetails(email, token);

        setIsLoading(false);
        return true;
    };

    // ── Friendly error messages for DB constraint violations ──
    const parseConstraintError = (msg: string): string | null => {
        if (msg.includes('guest_name_alpha'))
            return 'Names must be in Title Case (e.g. "Juan Dela Cruz"). At least 2 characters, no ALL CAPS or all lowercase.';
        if (msg.includes('guest_phone_format'))
            return 'Invalid phone number format. Use 09XXXXXXXXX or 639XXXXXXXXX.';
        if (msg.includes('guest_postal_range'))
            return 'Postal code must be between 1000 and 9999.';
        if (msg.includes('23514'))
            return 'Some fields do not meet the required format. Please review your input.';
        return null;
    };

    const signup = async (email: string, password: string, guestData: Partial<Guest>): Promise<boolean> => {
        setIsLoading(true);

        // 1. Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            setIsLoading(false);
            toast.error(authError.message);
            return false;
        }

        // Cache the token immediately so rawMutate can pass RLS
        const token = authData.session?.access_token;
        if (token) setCachedToken(token);

        // 2. Create Guest Record — pass token explicitly for RLS
        const { data: newGuest, error: guestError } = await rawMutate('guest', 'POST', {
            body: {
                first_name: guestData.First_Name,
                middle_name: guestData.Middle_Name || '',
                last_name: guestData.Last_Name,
                email: email.trim(),
                phone: guestData.Phone || 0,
                address: guestData.Address || '',
                city: guestData.City || '',
                postal_code: guestData.Postal_Code || null,
            },
            returnData: true,
            single: true,
            token,
        });

        if (guestError) {
            const friendly = parseConstraintError(guestError.message);
            toast.error(friendly || 'Failed to create account: ' + guestError.message);
            console.error("Error creating guest record:", guestError);
            setIsLoading(false);
            return false;
        }

        // 3. Create UserAccount Record (Optional but per schema)
        if (newGuest) {
            const { error: accError } = await rawMutate('useraccount', 'POST', {
                body: {
                    email: email,
                    password_hash: 'supabase-managed',
                    user_type: 'Guest',
                    guest_id: newGuest.guest_id
                },
                token,
            });
            if (accError) console.error("Error linking UserAccount:", accError);
        }

        toast.success("Account created! Please check your email to verify your account.");
        setIsLoading(false);
        return true;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        toast.success('Logged out successfully');
    };

    const updateGuestProfile = async (data: Partial<Guest>): Promise<boolean> => {
        if (!user?.Guest_ID) return false;
        const token = getCachedToken();
        if (!token) { toast.error('Not authenticated'); return false; }

        const { error } = await rawMutate('guest', 'PATCH', {
            body: {
                first_name: data.First_Name,
                middle_name: data.Middle_Name || '',
                last_name: data.Last_Name,
                phone: data.Phone,
                address: data.Address || '',
                city: data.City || '',
                postal_code: data.Postal_Code || null,
            },
            filters: `guest_id=eq.${user.Guest_ID}`,
            token,
        });

        if (error) {
            const friendly = parseConstraintError(error.message);
            toast.error(friendly || 'Failed to update profile: ' + error.message);
            return false;
        }

        // Refresh user data
        await fetchUserDetails(user.Email, token);
        toast.success('Profile updated successfully');
        return true;
    };

    const updateStaff = async (staffId: number, data: Partial<{ shift: string; status: string; role: string }>): Promise<boolean> => {
        const token = getCachedToken();
        if (!token) { toast.error('Not authenticated'); return false; }

        const body: any = {};
        if (data.shift) body.shift = data.shift;
        if (data.status) body.status = data.status;
        if (data.role) body.role = data.role;

        const { error } = await rawMutate('staff', 'PATCH', {
            body,
            filters: `staff_id=eq.${staffId}`,
            token,
        });

        if (error) {
            toast.error('Failed to update staff: ' + error.message);
            return false;
        }

        toast.success('Staff updated successfully');
        return true;
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, isInitializing, login, signup, logout, updateGuestProfile, updateStaff }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
