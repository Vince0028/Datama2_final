// Authentication types for the Hotel Reservation System

export interface UserAccount {
    User_ID: number;
    Email: string;
    Password_Hash: string;
    User_Type: 'Guest' | 'Staff';
    Guest_ID: number | null;
    Staff_ID: number | null;
    Created_At: string;
}

export interface AuthUser {
    User_ID: number;
    Email: string;
    User_Type: 'Guest' | 'Staff';
    Guest_ID: number | null;
    Staff_ID: number | null;
    // Joined data
    guestData?: {
        First_Name: string;
        Last_Name: string;
        Email: string;
        Phone?: number;
        Address?: string;
        City?: string;
        Postal_Code?: number | null;
    };
    staffData?: {
        First_Name: string;
        Last_Name: string;
        Role: string;
    };
}

export interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
