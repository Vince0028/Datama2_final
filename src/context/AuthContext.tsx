import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { AuthUser } from '@/types/auth';
import type { Guest } from '@/types/hotel';
import { toast } from 'sonner';

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string, userType: 'Guest' | 'Staff') => Promise<boolean>;
    signup: (email: string, password: string, guestData: Partial<Guest>) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user details based on email
    const fetchUserDetails = async (email: string) => {
        try {
            // Check Staff first
            const { data: staffData, error: staffError } = await supabase
                .from('staff') // Note: Table names are case-sensitive usually, but postgres often lowercases. Assuming 'Staff' or 'staff'.
                .select('*')
                .eq('email', email) // Assuming case-insensitive match or exact match
                .single();

            if (staffData && !staffError) {
                const authUser: AuthUser = {
                    User_ID: staffData.Staff_ID, // Using Staff_ID as User_ID for now or fetch from UserAccount
                    Email: email,
                    User_Type: 'Staff',
                    Guest_ID: null,
                    Staff_ID: staffData.Staff_ID,
                    staffData: {
                        First_Name: staffData.first_name || staffData.First_Name, // Handle potential casing differences
                        Last_Name: staffData.last_name || staffData.Last_Name,
                        Role: staffData.role || staffData.Role,
                    },
                };
                setUser(authUser);
                return;
            }

            // Check Guest
            const { data: guestData, error: guestError } = await supabase
                .from('guest')
                .select('*')
                .eq('email', email)
                .single();

            if (guestData && !guestError) {
                const authUser: AuthUser = {
                    User_ID: guestData.Guest_ID,
                    Email: email,
                    User_Type: 'Guest',
                    Guest_ID: guestData.Guest_ID,
                    Staff_ID: null,
                    guestData: {
                        First_Name: guestData.first_name || guestData.First_Name,
                        Last_Name: guestData.last_name || guestData.Last_Name,
                        Email: guestData.email || guestData.Email,
                        Phone: guestData.phone || guestData.Phone
                    },
                };
                setUser(authUser);
                return;
            }

            // Fallback: Authenticated but no record found (Shouldn't happen ideally)
            console.warn("User authenticated but no Guest/Staff record found.");
            // We can optionally create a Guest record here if missing, but better to handle in signup
            setUser(null);

        } catch (error) {
            console.error("Error fetching user details:", error);
            setUser(null);
        }
    };

    // Initialize Auth
    useEffect(() => {
        const initializeAuth = async () => {
            setIsLoading(true);
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user?.email) {
                await fetchUserDetails(session.user.email);
            } else {
                setUser(null);
            }
            setIsLoading(false);
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user?.email) {
                setIsLoading(true);
                await fetchUserDetails(session.user.email);
                setIsLoading(false);
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string, userType: 'Guest' | 'Staff'): Promise<boolean> => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setIsLoading(false);
            toast.error(error.message);
            return false;
        }

        // Auth state change listener will handle fetching user details
        // We wait a bit to ensure state updates or check manually
        // But for better UX, we can just return true.
        // However, we want to ensure the UserType matches!

        // Wait for user to be populated
        // This is a bit tricky with async event listener. 
        // We can manually fetch here to verify role immediately.

        // Let's verify role locally before returning
        // Note: The listener runs in parallel.

        // Quick verification:
        if (userType === 'Staff') {
            const { data: staff } = await supabase.from('staff').select('*').eq('email', email).single();
            if (!staff) {
                await supabase.auth.signOut();
                toast.error("Unauthorized: No staff account found.");
                setIsLoading(false);
                return false;
            }
        }

        toast.success("Logged in successfully!");
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
        const { data: newGuest, error: guestError } = await supabase
            .from('guest')
            .insert([{
                First_Name: guestData.First_Name,
                Last_Name: guestData.Last_Name,
                Email: email,
                Phone: guestData.Phone,
                Middle_Name: '', // Optional
                Address: '',
                City: '',
                Postal_Code: '',
            }])
            .select()
            .single();

        if (guestError) {
            console.error("Error creating guest record:", guestError);
            toast.error("Account created, but failed to save profile.");
            // Potentially delete auth user or handle cleanup
            setIsLoading(false);
            return false;
        }

        // 3. Create UserAccount Record (Optional but per schema)
        if (newGuest) {
            const { error: accError } = await supabase
                .from('useraccount')
                .insert([{
                    Email: email,
                    Password_Hash: 'supbase-managed', // We don't store real hash
                    User_Type: 'Guest',
                    Guest_ID: newGuest.Guest_ID
                }]);
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
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
