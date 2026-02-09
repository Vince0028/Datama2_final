import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import type { Reservation, Guest, Room, RoomType } from '@/types/hotel';
import { supabase, rawQuery, rawMutate, getCachedToken } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from "sonner";

interface ReservationContextType {
    reservations: Reservation[];
    rooms: Room[];
    addReservation: (data: Omit<Reservation, 'Reservation_ID' | 'Total_Amount'> & { guest: Partial<Guest>, paymentMethod: string }) => Promise<void>;
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

// ── Mapping helpers (pure functions, no state) ──────────────────────────
function mapRoom(r: any, roomTypesData: any[]): Room {
    const rTypeId = r.roomtype_id || r.RoomType_ID;
    const matchType = roomTypesData?.find((rt: any) =>
        (rt.roomtype_id || rt.RoomType_ID) === rTypeId
    );
    return {
        Room_ID: r.room_id || r.Room_ID,
        Room_Number: r.room_number || r.Room_Number,
        RoomType_ID: rTypeId,
        Status: r.status || r.Status,
        roomType: matchType ? {
            RoomType_ID: matchType.roomtype_id || matchType.RoomType_ID,
            Type_Name: matchType.type_name || matchType.Type_Name,
            Base_Rate: matchType.base_rate || matchType.Base_Rate
        } : undefined
    };
}

function mapReservation(r: any): Reservation {
    return {
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
    };
}

// ── Standalone fetch functions using raw REST (supabase-js hangs) ────────
async function fetchRoomsFromDB(): Promise<{ rooms: Room[]; roomTypes: any[] }> {
    // Get fresh token
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const [typesRes, roomsRes] = await Promise.all([
        rawQuery('roomtype', { token }),
        rawQuery('room', { order: 'room_id.asc', token }),
    ]);
    if (typesRes.error) throw new Error('Room types: ' + typesRes.error.message);
    if (roomsRes.error) throw new Error('Rooms: ' + roomsRes.error.message);

    const types = typesRes.data || [];
    const mapped = (roomsRes.data || []).map((r: any) => mapRoom(r, types));
    return { rooms: mapped, roomTypes: types };
}

async function fetchReservationsFromDB(): Promise<Reservation[]> {
    // Get fresh token
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    // Raw REST doesn't support nested selects like supabase-js,
    // so we fetch each table and join in JS.
    const [resRes, roomsRes, typesRes, rgRes, guestsRes, staffRes] = await Promise.all([
        rawQuery('reservation', { order: 'created_at.desc', token }),
        rawQuery('room', { token }),
        rawQuery('roomtype', { token }),
        rawQuery('reservationguest', { token }),
        rawQuery('guest', { token }),
        rawQuery('staff', { token }),
    ]);

    const roomsArr = roomsRes.data || [];
    const typesArr = typesRes.data || [];
    const rgArr = rgRes.data || [];
    const guestsArr = guestsRes.data || [];
    const staffArr = staffRes.data || [];

    return (resRes.data || []).map((r: any) => {
        const room = roomsArr.find((rm: any) => rm.room_id === r.room_id);
        const roomType = room ? typesArr.find((rt: any) => rt.roomtype_id === room.roomtype_id) : null;
        const resGuests = rgArr
            .filter((rg: any) => rg.reservation_id === r.reservation_id)
            .map((rg: any) => {
                const guest = guestsArr.find((g: any) => g.guest_id === rg.guest_id);
                return {
                    ResGuest_ID: rg.resguest_id,
                    Reservation_ID: rg.reservation_id,
                    Guest_ID: rg.guest_id,
                    Guest_Type: rg.guest_type,
                    guest: guest ? {
                        Guest_ID: guest.guest_id,
                        First_Name: guest.first_name,
                        Last_Name: guest.last_name,
                        Email: guest.email,
                        Phone: guest.phone,
                        Address: guest.address,
                        City: guest.city,
                        Postal_Code: guest.postal_code,
                        Middle_Name: guest.middle_name
                    } : undefined
                };
            });

        // Find staff who processed this reservation
        const staff = r.staff_id ? staffArr.find((s: any) => s.staff_id === r.staff_id) : null;

        return {
            Reservation_ID: r.reservation_id,
            Room_ID: r.room_id,
            Staff_ID: r.staff_id || 0,
            Check_In: r.check_in,
            Check_Out: r.check_out,
            Status: r.status,
            Total_Amount: r.total_amount,
            room: room ? {
                Room_ID: room.room_id,
                Room_Number: room.room_number,
                RoomType_ID: room.roomtype_id,
                Status: room.status,
                roomType: roomType ? {
                    RoomType_ID: roomType.roomtype_id,
                    Type_Name: roomType.type_name,
                    Base_Rate: roomType.base_rate
                } : undefined
            } : undefined,
            guests: resGuests,
            staff: staff ? {
                Staff_ID: staff.staff_id,
                First_Name: staff.first_name,
                Last_Name: staff.last_name,
                Role: staff.role
            } : undefined
        };
    });
}

export function ReservationProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const roomTypesRef = useRef<any[]>([]);
    const mountedRef = useRef(true);

    const refreshData = async () => {
        try {
            const { rooms: fetchedRooms, roomTypes } = await fetchRoomsFromDB();
            if (mountedRef.current) {
                roomTypesRef.current = roomTypes;
                setRooms(fetchedRooms);
            }

            const fetchedReservations = await fetchReservationsFromDB();
            if (mountedRef.current) {
                setReservations(fetchedReservations);
            }
        } catch (err: any) {
            console.error('[ReservationContext] Add refresh failed:', err);
            toast.error('Failed to refresh data: ' + err.message);
        }
    };

    // Refetch data when user changes (login/logout)
    useEffect(() => {
        mountedRef.current = true;
        refreshData();

        // Realtime updates - use unique channel names to avoid conflicts
        const roomChannelName = `rooms-realtime-${Date.now()}`;
        const resChannelName = `reservations-realtime-${Date.now()}`;

        const roomCh = supabase.channel(roomChannelName)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'room' },
                (p) => {
                    if (p.eventType === 'UPDATE') {
                        setRooms(prev => prev.map(r =>
                            r.Room_ID === (p.new.room_id || p.new.Room_ID)
                                ? { ...r, Status: p.new.status || p.new.Status }
                                : r
                        ));
                    }
                }
            )
            .subscribe();

        const resCh = supabase.channel(resChannelName)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'reservation' },
                async (p) => {
                    if (p.eventType === 'UPDATE') {
                        setReservations(prev => prev.map(res =>
                            res.Reservation_ID === p.new.reservation_id
                                ? { ...res, Status: p.new.status, Staff_ID: p.new.staff_id || res.Staff_ID }
                                : res
                        ));
                    } else if (p.eventType === 'INSERT') {
                        // Refresh all reservations when a new one is added
                        fetchReservationsFromDB().then(fetched => {
                            if (mountedRef.current) setReservations(fetched);
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            mountedRef.current = false;
            supabase.removeChannel(roomCh);
            supabase.removeChannel(resCh);
        };
    }, [isAuthenticated, user?.User_Type]);

    const addReservation = async (data: Omit<Reservation, 'Reservation_ID' | 'Total_Amount'> & { guest: Partial<Guest>, paymentMethod: string }) => {
        try {
            const room = rooms.find(r => r.Room_ID === data.Room_ID);
            const baseRate = room?.roomType?.Base_Rate || 0;
            const checkIn = new Date(data.Check_In);
            const checkOut = new Date(data.Check_Out);
            const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
            const totalAmount = baseRate * nights;

            let guestId = user?.Guest_ID;
            if (!guestId) {
                throw new Error("User must be logged in to book");
            }

            // Get fresh token from Supabase session
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;

            console.log('[addReservation] Token exists:', !!token);
            console.log('[addReservation] Guest ID:', guestId);

            if (!token) {
                throw new Error("Authentication token missing. Please log in again.");
            }

            // Insert reservation
            const { data: newRes, error: resError } = await rawMutate('reservation', 'POST', {
                body: {
                    room_id: data.Room_ID,
                    staff_id: data.Staff_ID || null,
                    check_in: data.Check_In,
                    check_out: data.Check_Out,
                    status: data.Status || 'Pending',
                    total_amount: totalAmount
                },
                returnData: true,
                single: true,
                token: token,
            });
            if (resError) throw new Error(resError.message);

            // Insert reservation-guest link
            const { error: rgError } = await rawMutate('reservationguest', 'POST', {
                body: {
                    reservation_id: newRes.reservation_id,
                    guest_id: guestId,
                    guest_type: 'Primary'
                },
                token: token,
            });
            if (rgError) throw new Error(rgError.message);

            // Insert Payment record
            const { error: payError } = await rawMutate('payment', 'POST', {
                body: {
                    reservation_id: newRes.reservation_id,
                    amount: totalAmount,
                    method: data.paymentMethod,
                    status: 'Pending',
                    payment_date: new Date().toISOString()
                },
                token: token,
            });

            if (payError) {
                console.error("Payment creation failed:", payError);
                toast.error("Reservation created but payment record failed.");
            }

            toast.success("Reservation Request Sent!", {
                description: "Staff will review your booking shortly."
            });
        } catch (error: any) {
            console.error("Error adding reservation:", error);
            toast.error(error.message || "Failed to book room");
        }
    };

    const updateStatus = async (id: number, status: Reservation['Status']) => {
        const targetRes = reservations.find(r => r.Reservation_ID === id);
        const previousStatus = targetRes?.Status;

        // Optimistic update
        setReservations(prev =>
            prev.map(res =>
                res.Reservation_ID === id
                    ? { ...res, Status: status, Staff_ID: user?.Staff_ID || res.Staff_ID }
                    : res
            )
        );

        try {
            // Get fresh token
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;

            if (!token) {
                throw new Error("No auth token - please log in again");
            }

            // Always assign the staff who processed the action
            const updates: any = {
                status,
                staff_id: user?.Staff_ID || null
            };

            console.log('[updateStatus] Updating reservation:', id, updates, 'Staff_ID:', user?.Staff_ID);

            const { data: patchData, error } = await rawMutate('reservation', 'PATCH', {
                body: updates,
                filters: `reservation_id=eq.${id}`,
                token,
                returnData: true,
            });

            console.log('[updateStatus] PATCH result:', patchData, error);

            if (error) throw new Error(error.message);

            // Log the action in ReservationLog
            if (user?.Staff_ID) {
                const actionName = status === 'Booked' ? 'Approved'
                    : status === 'Cancelled' ? 'Rejected'
                        : status === 'CheckedIn' ? 'Checked In'
                            : status === 'CheckedOut' ? 'Checked Out'
                                : status;

                await rawMutate('reservationlog', 'POST', {
                    body: {
                        reservation_id: id,
                        staff_id: user.Staff_ID,
                        action: actionName,
                        previous_status: previousStatus || 'Unknown',
                        new_status: status,
                    },
                    token,
                });
            }

            if (targetRes) {
                let newRoomStatus: Room['Status'] | null = null;
                if (status === 'CheckedIn') newRoomStatus = 'Occupied';
                else if (status === 'CheckedOut') newRoomStatus = 'Available';
                if (newRoomStatus) await updateRoomStatus(targetRes.Room_ID, newRoomStatus);
            }

            // Update local state with staff info
            setReservations(prev =>
                prev.map(res =>
                    res.Reservation_ID === id
                        ? {
                            ...res,
                            Status: status,
                            Staff_ID: user?.Staff_ID || res.Staff_ID,
                            staff: user?.staffData ? {
                                Staff_ID: user.Staff_ID!,
                                First_Name: user.staffData.First_Name,
                                Last_Name: user.staffData.Last_Name,
                                Role: user.staffData.Role as any
                            } : res.staff
                        }
                        : res
                )
            );

            const staffName = user?.staffData?.First_Name || 'Staff';
            toast.success(`Reservation ${status}`, {
                description: `Processed by ${staffName}`
            });
        } catch (error: any) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status: " + error.message);
        }
    };

    const updateRoomStatus = async (id: number, status: Room['Status']) => {
        // Optimistic update
        setRooms(prev =>
            prev.map(room =>
                room.Room_ID === id ? { ...room, Status: status } : room
            )
        );

        try {
            const { error } = await rawMutate('room', 'PATCH', {
                body: { status },
                filters: `room_id=eq.${id}`,
            });
            if (error) throw new Error(error.message);
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
        <ReservationContext.Provider value={{
            reservations,
            rooms,
            addReservation,
            updateStatus,
            metrics,
            resetData,
            updateRoomStatus,
            checkAvailability,
            refreshData
        }}>
            {children}
        </ReservationContext.Provider>
    );
}

export function useReservations() {
    const context = useContext(ReservationContext);
    if (!context) throw new Error('useReservations must be used within a ReservationProvider');
    return context;
}
