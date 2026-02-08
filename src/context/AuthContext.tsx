import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, rawQuery, rawMutate, setCachedToken } from '@/lib/supabase';
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
                        Last_Name: guestData.last_name || guestData.Last_Name,
                        Email: guestData.email || guestData.Email,
                        Phone: guestData.phone || guestData.Phone
                    },
                });
                return;
            }

            console.warn('User authenticated but no Guest/Staff record found.');
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

        // Force update context immediately (onAuthStateChange may already be doing this)
        await fetchUserDetails(email);

        setIsLoading(false);
        return true;
    };

    const signup = async (email: string, password: string, guestData: Partial<Guest>): Promise<boolean> => {
        setIsLoading(true);

        // 1. Sign up with Supabase Auth
        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            setIsLoading(false);
            toast.error(authError.message);
            return false;
        }

        // 2. Create Guest Record
        const { data: newGuest, error: guestError } = await rawMutate('guest', 'POST', {
            body: {
                first_name: guestData.First_Name,
                last_name: guestData.Last_Name,
                email: email,
                phone: guestData.Phone,
                middle_name: '',
                address: '',
                city: '',
                postal_code: '',
            },
            returnData: true,
            single: true,
        });

        if (guestError) {
            console.error("Error creating guest record:", guestError);
            toast.error("Account created, but failed to save profile.");
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
            });
            if (accError) console.error("Error linking UserAccount:", accError);
        }

        toast.success("Account created! Please sign in.");
        setIsLoading(false);
        return true;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        toast.success('Logged out successfully');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, isInitializing, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
