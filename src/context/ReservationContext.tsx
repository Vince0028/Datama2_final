import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Reservation, Guest, Room, RoomType } from '@/types/hotel';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from "sonner";

interface ReservationContextType {
    reservations: Reservation[];
    rooms: Room[];
    isLoading: boolean;
    addReservation: (data: Omit<Reservation, 'Reservation_ID' | 'Total_Amount'> & { guest: Partial<Guest> }) => Promise<void>;
    updateStatus: (id: number, status: Reservation['Status']) => Promise<void>;
    metrics: {
        totalRevenue: number;
        activeReservations: number;
        availableRooms: number;
        averageStay: number;
    };
    resetData: () => void;
    updateRoomStatus: (id: number, status: Room['Status']) => Promise<void>;
    checkAvailability: (roomId: number, checkIn: string, checkOut: string) => boolean;
    refreshData: () => Promise<void>;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export function ReservationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch Initial Data
    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch Rooms with Type
            const { data: roomsData, error: roomsError } = await supabase
                .from('room')
                .select(`
                    *,
                    roomtype (*)
                `)
                .order('room_id');

            if (roomsError) throw roomsError;

            // Map DB snake_case to Types PascalCase
            const mappedRooms: Room[] = (roomsData || []).map((r: any) => ({
                Room_ID: r.room_id,
                Room_Number: r.room_number,
                RoomType_ID: r.roomtype_id,
                Status: r.status,
                roomType: r.roomtype ? {
                    RoomType_ID: r.roomtype.roomtype_id,
                    Type_Name: r.roomtype.type_name,
                    Base_Rate: r.roomtype.base_rate
                } : undefined
            }));
            setRooms(mappedRooms);

            // Fetch Reservations with nested guests and rooms
            const { data: resData, error: resError } = await supabase
                .from('reservation')
                .select(`
                    *,
                    room:room (*, roomtype(*)),
                    guests:reservationguest (
                        *,
                        guest (*)
                    )
                `)
                .order('created_at', { ascending: false });

            if (resError) throw resError;

            const mappedReservations: Reservation[] = (resData || []).map((r: any) => ({
                Reservation_ID: r.reservation_id,
                Room_ID: r.room_id,
                Staff_ID: r.staff_id || 0,
                Check_In: r.check_in,
                Check_Out: r.check_out,
                Status: r.status,
                Total_Amount: r.total_amount,
                room: r.room ? {
                    Room_ID: r.room.room_id,
                    Room_Number: r.room.room_number,
                    RoomType_ID: r.room.roomtype_id,
                    Status: r.room.status,
                    roomType: r.room.roomtype ? {
                        RoomType_ID: r.room.roomtype.roomtype_id,
                        Type_Name: r.room.roomtype.type_name,
                        Base_Rate: r.room.roomtype.base_rate
                    } : undefined
                } : undefined,
                guests: (r.guests || []).map((rg: any) => ({
                    ResGuest_ID: rg.resguest_id,
                    Reservation_ID: rg.reservation_id,
                    Guest_ID: rg.guest_id,
                    Guest_Type: rg.guest_type,
                    guest: rg.guest ? {
                        Guest_ID: rg.guest.guest_id,
                        First_Name: rg.guest.first_name,
                        Last_Name: rg.guest.last_name,
                        Email: rg.guest.email,
                        Phone: rg.guest.phone,
                        Address: rg.guest.address,
                        City: rg.guest.city,
                        Postal_Code: rg.guest.postal_code,
                        Middle_Name: rg.guest.middle_name
                    } : undefined
                }))
            }));
            setReservations(mappedReservations);

        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load hotel data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Subscribe to changes
        const roomSubscription = supabase
            .channel('room-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'room' }, fetchData)
            .subscribe();

        const resSubscription = supabase
            .channel('reservation-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reservation' }, fetchData)
            .subscribe();

        return () => {
            roomSubscription.unsubscribe();
            resSubscription.unsubscribe();
        };
    }, []);

    const addReservation = async (data: Omit<Reservation, 'Reservation_ID' | 'Total_Amount'> & { guest: Partial<Guest> }) => {
        try {
            // 1. Calculate Amount
            const room = rooms.find(r => r.Room_ID === data.Room_ID);
            const baseRate = room?.roomType?.Base_Rate || 0;
            const checkIn = new Date(data.Check_In);
            const checkOut = new Date(data.Check_Out);
            const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
            const totalAmount = baseRate * nights;

            let guestId = user?.Guest_ID;

            // If no logged in guest ID, or booking for someone else (staff mode?)
            // For now assuming Guest Mode: must have Guest_ID
            if (!guestId) {
                // If we have guest details but no ID, query or insert guest?
                // In this app flow, we require login, so user.Guest_ID should exist.
                // But let's handle the case just in case.
                console.warn("No Guest_ID found in auth context for booking");
                throw new Error("User must be logged in to book");
            }

            // 2. Insert Reservation
            const { data: newRes, error: resError } = await supabase
                .from('reservation')
                .insert([{
                    room_id: data.Room_ID,
                    staff_id: null,
                    check_in: data.Check_In,
                    check_out: data.Check_Out,
                    status: 'Pending',
                    total_amount: totalAmount
                }])
                .select()
                .single();

            if (resError) throw resError;

            // 3. Insert ReservationGuest
            const { error: resGuestError } = await supabase
                .from('reservationguest')
                .insert([{
                    reservation_id: newRes.reservation_id,
                    guest_id: guestId,
                    guest_type: 'Primary'
                }]);

            if (resGuestError) throw resGuestError;

            toast.success("Reservation Request Sent!", {
                description: "Staff will review your booking shortly."
            });

            // Realtime subscription will fetch data, but we can verify
            // await fetchData();

        } catch (error: any) {
            console.error("Error adding reservation:", error);
            toast.error(error.message || "Failed to book room");
        }
    };

    const updateStatus = async (id: number, status: Reservation['Status']) => {
        try {
            const updates: any = { status: status };
            if (status === 'Booked') {
                updates.staff_id = user?.Staff_ID || null; // Track which staff approved it
            }

            const { error } = await supabase
                .from('reservation')
                .update(updates)
                .eq('reservation_id', id);

            if (error) throw error;

            // Logic for room status update is handled by DB triggers usually, or manually here
            // We'll do it manually to be safe for now
            const targetRes = reservations.find(r => r.Reservation_ID === id);
            if (targetRes) {
                let newRoomStatus: Room['Status'] | null = null;
                if (status === 'CheckedIn') newRoomStatus = 'Occupied';
                else if (status === 'CheckedOut') newRoomStatus = 'Available';

                if (newRoomStatus) {
                    await updateRoomStatus(targetRes.Room_ID, newRoomStatus);
                }
            }

            toast.success(`Reservation ${status}`);
        } catch (error: any) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    };

    const updateRoomStatus = async (id: number, status: Room['Status']) => {
        try {
            const { error } = await supabase
                .from('room')
                .update({ status: status })
                .eq('room_id', id);

            if (error) throw error;
            toast.success(`Room status updated to ${status}`);
        } catch (error: any) {
            toast.error("Failed to update room status");
        }
    };

    const checkAvailability = (roomId: number, checkIn: string, checkOut: string) => {
        // Client-side check against loaded reservations (efficient for small dataset)
        const start = new Date(checkIn).getTime();
        const end = new Date(checkOut).getTime();

        const conflict = reservations.some(res => {
            if (res.Room_ID !== roomId) return false;
            if (res.Status === 'Cancelled' || res.Status === 'CheckedOut') return false;

            const resStart = new Date(res.Check_In).getTime();
            const resEnd = new Date(res.Check_Out).getTime();

            return (start < resEnd && end > resStart);
        });

        return !conflict;
    };

    const resetData = async () => {
        // Dangerous admin action - maybe clear tables?
        // For now, let's just toast
        toast.error("Reset not implemented for live database");
    };

    const metrics = {
        totalRevenue: reservations
            .filter(r => r.Status === 'Booked' || r.Status === 'CheckedIn' || r.Status === 'CheckedOut')
            .reduce((sum, r) => sum + r.Total_Amount, 0),
        activeReservations: reservations.filter(r => r.Status === 'Booked' || r.Status === 'CheckedIn').length,
        availableRooms: rooms.length - reservations.filter(r => r.Status === 'Booked' || r.Status === 'CheckedIn').length,
        averageStay: reservations.length > 0
            ? reservations.reduce((sum, r) => {
                const start = new Date(r.Check_In).getTime();
                const end = new Date(r.Check_Out).getTime();
                // Ensure positive duration
                const duration = Math.max(0, end - start);
                return sum + duration;
            }, 0) / (reservations.length * 1000 * 60 * 60 * 24)
            : 0
    };

    return (
        <ReservationContext.Provider value={{ reservations, rooms, isLoading, addReservation, updateStatus, metrics, resetData, updateRoomStatus, checkAvailability, refreshData: fetchData }}>
            {children}
        </ReservationContext.Provider>
    );
}

export function useReservations() {
    const context = useContext(ReservationContext);
    if (!context) throw new Error('useReservations must be used within a ReservationProvider');
    return context;
}
