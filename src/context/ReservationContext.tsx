import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Reservation, Guest, Room } from '@/types/hotel';
import { rooms as initialRooms, roomTypes } from '@/data/mockData';
import { toast } from "sonner";

interface ReservationContextType {
    reservations: Reservation[];
    rooms: Room[];
    addReservation: (reservation: Omit<Reservation, 'Reservation_ID' | 'Total_Amount'> & { guest: Partial<Guest> }) => void;
    updateStatus: (id: number, status: Reservation['Status']) => void;
    metrics: {
        totalRevenue: number;
        activeReservations: number;
        availableRooms: number;
        averageStay: number;
    };
    resetData: () => void;
    updateRoomStatus: (id: number, status: Room['Status']) => void;
    checkAvailability: (roomId: number, checkIn: string, checkOut: string) => boolean;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export function ReservationProvider({ children }: { children: ReactNode }) {
    const [reservations, setReservations] = useState<Reservation[]>(() => {
        const saved = localStorage.getItem('hotel_reservations');
        return saved ? JSON.parse(saved) : [];
    });

    const [rooms, setRooms] = useState<Room[]>(() => {
        const saved = localStorage.getItem('hotel_rooms');
        return saved ? JSON.parse(saved) : initialRooms;
    });

    useEffect(() => {
        localStorage.setItem('hotel_reservations', JSON.stringify(reservations));
    }, [reservations]);

    useEffect(() => {
        localStorage.setItem('hotel_rooms', JSON.stringify(rooms));
    }, [rooms]);

    const addReservation = (data: Omit<Reservation, 'Reservation_ID' | 'Total_Amount'> & { guest: Partial<Guest> }) => {
        const room = rooms.find(r => r.Room_ID === data.Room_ID);
        const type = roomTypes.find(rt => rt.RoomType_ID === room?.RoomType_ID);
        const baseRate = type?.Base_Rate || 0;

        const checkIn = new Date(data.Check_In);
        const checkOut = new Date(data.Check_Out);
        const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
        const totalAmount = baseRate * nights;

        const newReservation: Reservation = {
            ...data,
            Reservation_ID: Date.now(), // Simple ID generation
            Total_Amount: totalAmount,
            guests: [
                {
                    ResGuest_ID: Date.now(),
                    Reservation_ID: Date.now(),
                    Guest_ID: Date.now(),
                    Guest_Type: 'Primary',
                    guest: {
                        Guest_ID: Date.now(),
                        First_Name: data.guest.First_Name || '',
                        Last_Name: data.guest.Last_Name || '',
                        Email: data.guest.Email || '',
                        Phone: '',
                        Address: '',
                        City: '',
                        Postal_Code: 0,
                        Middle_Name: ''
                    }
                }
            ],
            room: room ? { ...room, roomType: type } : undefined
        };

        setReservations(prev => [...prev, newReservation]);

        // Auto-update room status if booked
        if (newReservation.Status === 'Booked' || newReservation.Status === 'CheckedIn') {
            updateRoomStatus(newReservation.Room_ID, 'Occupied');
        }

        toast.success("Reservation Request Sent!", {
            description: "Staff will review your booking shortly."
        });
    };

    const updateStatus = (id: number, status: Reservation['Status']) => {
        setReservations(prev => {
            const updated = prev.map(res =>
                res.Reservation_ID === id ? { ...res, Status: status, Staff_ID: status === 'Booked' ? 1 : res.Staff_ID } : res
            );

            // Handle Room Status changes based on Reservation Status
            const targetRes = updated.find(r => r.Reservation_ID === id);
            if (targetRes) {
                if (status === 'CheckedIn' || status === 'Booked') {
                    updateRoomStatus(targetRes.Room_ID, 'Occupied');
                } else if (status === 'CheckedOut' || status === 'Cancelled') {
                    updateRoomStatus(targetRes.Room_ID, 'Available');
                }
            }
            return updated;
        });
        toast.success(`Reservation ${status}`);
    };

    const updateRoomStatus = (id: number, status: Room['Status']) => {
        setRooms(prev => prev.map(room =>
            room.Room_ID === id ? { ...room, Status: status } : room
        ));
        toast.success(`Room status updated to ${status}`);
    };

    const checkAvailability = (roomId: number, checkIn: string, checkOut: string) => {
        const start = new Date(checkIn).getTime();
        const end = new Date(checkOut).getTime();

        const conflict = reservations.some(res => {
            if (res.Room_ID !== roomId) return false;
            // Ignore cancelled or rejected bookings
            if (res.Status === 'Cancelled') return false;

            const resStart = new Date(res.Check_In).getTime();
            const resEnd = new Date(res.Check_Out).getTime();

            // Check if ranges overlap
            return (start < resEnd && end > resStart);
        });

        return !conflict;
    };

    const resetData = () => {
        localStorage.removeItem('hotel_reservations');
        localStorage.removeItem('hotel_rooms');
        setReservations([]);
        setRooms(initialRooms);
        toast.success("System Data Reset", {
            description: "All reservations and guests have been cleared."
        });
        setTimeout(() => window.location.reload(), 1500); // Delay reload to show toast
    };

    // Metrics Calculation
    const metrics = {
        totalRevenue: reservations.filter(r => r.Status === 'Booked' || r.Status === 'CheckedIn').reduce((sum, r) => sum + r.Total_Amount, 0),
        activeReservations: reservations.filter(r => r.Status === 'Booked' || r.Status === 'CheckedIn').length,
        availableRooms: rooms.length - reservations.filter(r => r.Status === 'Booked' || r.Status === 'CheckedIn').length,
        averageStay: reservations.length > 0
            ? reservations.reduce((sum, r) => {
                const start = new Date(r.Check_In).getTime();
                const end = new Date(r.Check_Out).getTime();
                return sum + (end - start);
            }, 0) / (reservations.length * 1000 * 60 * 60 * 24)
            : 0
    };

    return (
        <ReservationContext.Provider value={{ reservations, rooms, addReservation, updateStatus, metrics, resetData, updateRoomStatus, checkAvailability }}>
            {children}
        </ReservationContext.Provider>
    );
}

export function useReservations() {
    const context = useContext(ReservationContext);
    if (!context) throw new Error('useReservations must be used within a ReservationProvider');
    return context;
}
