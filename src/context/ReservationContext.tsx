import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import type { Reservation, Guest, Room, RoomType, Staff, Payment } from '@/types/hotel';
import { supabase, rawQuery, rawMutate, getCachedToken } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from "sonner";

interface PaymentBreakdown {
    method: string;
    amount: number;
}

interface WalkInData {
    roomId: number;
    staffId: number;
    checkIn: string;
    checkOut: string;
    guestFirstName: string;
    guestMiddleName?: string;
    guestLastName: string;
    guestEmail: string;
    guestPhone: number;
    guestAddress?: string;
    guestCity?: string;
    guestPostalCode?: number;
    paymentMethod: string;
}

interface ReservationContextType {
    reservations: Reservation[];
    rooms: Room[];
    addReservation: (data: Omit<Reservation, 'Reservation_ID' | 'Total_Amount'> & { guest: Partial<Guest>; paymentMethod?: string }) => Promise<void>;
    addWalkInReservation: (data: WalkInData) => Promise<void>;
    updateStatus: (id: number, status: Reservation['Status']) => Promise<void>;
    metrics: {
        totalRevenue: number;
        activeReservations: number;
        availableRooms: number;
        averageStay: number;
    };
    paymentBreakdown: PaymentBreakdown[];
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
    const token = getCachedToken();

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
    // Always read the latest token at each query — avoids stale-null captures
    // when the function is called before auth finishes initialising.
    const token = () => getCachedToken();

    // Raw REST doesn't support nested selects like supabase-js,
    // so we fetch each table and join in JS.
    const [resRes, roomsRes, typesRes, rgRes, guestsRes, staffRes, paymentsRes] = await Promise.all([
        rawQuery('reservation', { order: 'created_at.desc', token: token()! }),
        rawQuery('room', { token: token()! }),
        rawQuery('roomtype', { token: token()! }),
        rawQuery('reservationguest', { token: token()! }),
        rawQuery('guest', { token: token()! }),
        rawQuery('staff', { token: token()! }),
        rawQuery('payment', { token: token()! }),
    ]);

    const roomsArr = roomsRes.data || [];
    const typesArr = typesRes.data || [];
    const rgArr = rgRes.data || [];
    const guestsArr = guestsRes.data || [];
    const staffArr = staffRes.data || [];
    const paymentsArr = paymentsRes.data || [];

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

        // Find payment for this reservation
        const payment = paymentsArr.find((p: any) => p.reservation_id === r.reservation_id);

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
            } : undefined,
            payment: payment ? {
                Payment_ID: payment.payment_id,
                Reservation_ID: payment.reservation_id,
                Amount: payment.amount,
                Method: payment.method,
                Status: payment.status
            } : undefined
        };
    });
}

async function fetchPaymentsFromDB(): Promise<any[]> {
    const token = getCachedToken()!;
    const { data, error } = await rawQuery('payment', { token });
    if (error) throw new Error('Payments: ' + error.message);
    return data || [];
}

export function ReservationProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const roomTypesRef = useRef<any[]>([]);
    const mountedRef = useRef(true);

    // Keep a ref to user so closures always see the latest value
    const userRef = useRef(user);
    useEffect(() => { userRef.current = user; }, [user]);

    // Refetch data when user changes (login/logout)
    useEffect(() => {
        mountedRef.current = true;

        // Rooms are always fetched (publically visible)
        fetchRoomsFromDB()
            .then(({ rooms: fetchedRooms, roomTypes }) => {
                if (!mountedRef.current) return;
                roomTypesRef.current = roomTypes;
                setRooms(fetchedRooms);
            })
            .catch(err => {
                console.error('[ReservationContext] Room fetch failed:', err);
                toast.error('Failed to load rooms: ' + err.message);
            });

        // Only fetch reservations & payments when we have a real auth token.
        // With just the anon key, RLS blocks SELECT on reservation/payment for
        // authenticated-only policies → we'd get empty arrays.
        if (isAuthenticated && getCachedToken()) {
            fetchReservationsFromDB()
                .then(fetched => {
                    if (!mountedRef.current) return;
                    setReservations(fetched);
                })
                .catch(err => {
                    console.error('[ReservationContext] Reservation fetch failed:', err);
                });

            fetchPaymentsFromDB()
                .then(fetched => {
                    if (!mountedRef.current) return;
                    setPayments(fetched);
                })
                .catch(err => {
                    console.error('[ReservationContext] Payment fetch failed:', err);
                });
        } else {
            // Not authenticated — clear stale data from a previous session
            setReservations([]);
            setPayments([]);
        }

        // Realtime updates
        const roomCh = supabase.channel('rooms-realtime').on('postgres_changes',
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
        ).subscribe();

        const resCh = supabase.channel('reservations-realtime').on('postgres_changes',
            { event: '*', schema: 'public', table: 'reservation' },
            (p) => {
                if (p.eventType === 'UPDATE') {
                    setReservations(prev => prev.map(res =>
                        res.Reservation_ID === p.new.reservation_id
                            ? { ...res, Status: p.new.status, Staff_ID: p.new.staff_id || res.Staff_ID }
                            : res
                    ));
                }
                // When a new reservation is inserted, do a full refresh so
                // schedules / calendars on ALL clients update automatically.
                if (p.eventType === 'INSERT') {
                    fetchReservationsFromDB().then(fetched => {
                        if (mountedRef.current) setReservations(fetched);
                    });
                    fetchPaymentsFromDB().then(fetched => {
                        if (mountedRef.current) setPayments(fetched);
                    });
                }
            }
        ).subscribe();

        // ── Auto-checkout: expire reservations past their check-out date ──
        const runAutoCheckout = async () => {
            if (!mountedRef.current) return;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const token = getCachedToken();
            if (!token) return;

            let didChange = false;

            setReservations(prev => {
                const expired = prev.filter(r => {
                    if (r.Status !== 'Booked' && r.Status !== 'CheckedIn') return false;
                    const checkOut = new Date(r.Check_Out);
                    checkOut.setHours(0, 0, 0, 0);
                    return checkOut <= today;
                });

                if (expired.length === 0) return prev;
                didChange = true;

                // Process expired reservations asynchronously
                expired.forEach(async (r) => {
                    try {
                        await rawMutate('reservation', 'PATCH', {
                            body: { status: 'CheckedOut' },
                            filters: `reservation_id=eq.${r.Reservation_ID}`,
                            token,
                        });
                        await rawMutate('room', 'PATCH', {
                            body: { status: 'Available' },
                            filters: `room_id=eq.${r.Room_ID}`,
                            token,
                        });
                        console.log(`[auto-checkout] Reservation #${r.Reservation_ID} auto checked-out (past ${r.Check_Out})`);
                    } catch (err) {
                        console.error('[auto-checkout] Failed:', err);
                    }
                });

                // Update local state
                const expiredIds = new Set(expired.map(e => e.Reservation_ID));
                const expiredRoomIds = new Set(expired.map(e => e.Room_ID));

                // Also update rooms to Available
                setRooms(prevRooms => prevRooms.map(room =>
                    expiredRoomIds.has(room.Room_ID) ? { ...room, Status: 'Available' as Room['Status'] } : room
                ));

                return prev.map(r =>
                    expiredIds.has(r.Reservation_ID) ? { ...r, Status: 'CheckedOut' as Reservation['Status'] } : r
                );
            });
        };

        // Run once on load, then every 60 seconds
        runAutoCheckout();
        const autoCheckoutInterval = setInterval(runAutoCheckout, 60000);

        return () => {
            mountedRef.current = false;
            clearInterval(autoCheckoutInterval);
            supabase.removeChannel(roomCh);
            supabase.removeChannel(resCh);
        };
    }, [isAuthenticated, user?.User_Type]);

    // ── GUEST booking (requires logged-in guest) ──
    const addReservation = async (data: Omit<Reservation, 'Reservation_ID' | 'Total_Amount'> & { guest: Partial<Guest>; paymentMethod?: string }) => {
        try {
            const room = rooms.find(r => r.Room_ID === data.Room_ID);
            const baseRate = room?.roomType?.Base_Rate || 0;
            const checkIn = new Date(data.Check_In);
            const checkOut = new Date(data.Check_Out);
            const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
            const totalAmount = baseRate * nights;

            const guestId = user?.Guest_ID;
            if (!guestId) throw new Error("User must be logged in to book");

            const token = getCachedToken();
            if (!token) throw new Error("Authentication token missing. Please log in again.");

            const { data: newRes, error: resError } = await rawMutate('reservation', 'POST', {
                body: { room_id: data.Room_ID, staff_id: null, check_in: data.Check_In, check_out: data.Check_Out, status: 'Pending', total_amount: totalAmount },
                returnData: true, single: true, token,
            });
            if (resError) throw new Error(resError.message);

            await rawMutate('reservationguest', 'POST', { body: { reservation_id: newRes.reservation_id, guest_id: guestId, guest_type: 'Primary' }, token });

            console.log('[addReservation] Inserting payment:', { reservation_id: newRes.reservation_id, amount: totalAmount, method: data.paymentMethod || 'Cash', status: 'Pending' });
            const { data: payData, error: payError } = await rawMutate('payment', 'POST', {
                body: { reservation_id: newRes.reservation_id, amount: totalAmount, method: data.paymentMethod || 'Cash', status: 'Pending' },
                returnData: true, single: true, token,
            });
            if (payError) {
                console.error('[addReservation] Payment insert failed:', payError);
                toast.error('Reservation created but payment record failed: ' + payError.message);
            } else {
                console.log('[addReservation] Payment inserted successfully:', payData);
            }

            // Refresh all data to include the new reservation + payment
            const updatedReservations = await fetchReservationsFromDB();
            setReservations(updatedReservations);
            const updatedPayments = await fetchPaymentsFromDB();
            setPayments(updatedPayments);

            toast.success("Reservation Request Sent!", { description: "Staff will review your booking shortly." });
        } catch (error: any) {
            console.error("Error adding reservation:", error);
            toast.error(error.message || "Failed to book room");
            throw error; // Re-throw so the dialog knows it failed
        }
    };

    // ── Friendly error messages for DB constraint violations ──
    const parseConstraintError = (msg: string): string | null => {
        if (msg.includes('guest_name_alpha'))
            return 'Names must be in Title Case (e.g. "Juan Dela Cruz"). At least 2 characters, no ALL CAPS or all lowercase.';
        if (msg.includes('guest_phone_format'))
            return 'Invalid phone number format. Use 09XXXXXXXXX or 639XXXXXXXXX.';
        if (msg.includes('23514'))
            return 'Some fields do not meet the required format. Please review your input.';
        return null;
    };

    // ── STAFF walk-in reservation (completely independent, no guest login needed) ──
    const addWalkInReservation = async (data: WalkInData) => {
        try {
            const room = rooms.find(r => r.Room_ID === data.roomId);
            const baseRate = room?.roomType?.Base_Rate || 0;
            const checkIn = new Date(data.checkIn);
            const checkOut = new Date(data.checkOut);
            const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
            const totalAmount = baseRate * nights;

            const token = getCachedToken();
            if (!token) throw new Error("Authentication token missing. Please log in again.");

            // Find or create guest by email
            let guestId: number;
            const { data: existingGuests } = await rawQuery('guest', {
                filters: `email=eq.${encodeURIComponent(data.guestEmail)}`, token,
            });

            if (existingGuests && existingGuests.length > 0) {
                guestId = existingGuests[0].guest_id;
            } else {
                const { data: newGuest, error: guestError } = await rawMutate('guest', 'POST', {
                    body: { first_name: data.guestFirstName, middle_name: data.guestMiddleName || '', last_name: data.guestLastName, email: data.guestEmail, phone: data.guestPhone, address: data.guestAddress || '', city: data.guestCity || '', postal_code: data.guestPostalCode || null },
                    returnData: true, single: true, token,
                });
                if (guestError) {
                    const friendly = parseConstraintError(guestError.message);
                    throw new Error(friendly || 'Failed to create guest: ' + guestError.message);
                }
                guestId = newGuest.guest_id;
            }

            const { data: newRes, error: resError } = await rawMutate('reservation', 'POST', {
                body: { room_id: data.roomId, staff_id: data.staffId, check_in: data.checkIn, check_out: data.checkOut, status: 'Pending', total_amount: totalAmount },
                returnData: true, single: true, token,
            });
            if (resError) throw new Error(resError.message);

            await rawMutate('reservationguest', 'POST', { body: { reservation_id: newRes.reservation_id, guest_id: guestId, guest_type: 'Primary' }, token });

            console.log('[addWalkInReservation] Inserting payment:', { reservation_id: newRes.reservation_id, amount: totalAmount, method: data.paymentMethod || 'Cash', status: 'Pending' });
            const { data: payData, error: payError } = await rawMutate('payment', 'POST', {
                body: { reservation_id: newRes.reservation_id, amount: totalAmount, method: data.paymentMethod || 'Cash', status: 'Pending' },
                returnData: true, single: true, token,
            });
            if (payError) {
                console.error('[addWalkInReservation] Payment insert failed:', payError);
                toast.error('Reservation created but payment record failed: ' + payError.message);
            } else {
                console.log('[addWalkInReservation] Payment inserted successfully:', payData);
            }

            // Refresh all data to include the new reservation + payment
            const updatedReservations = await fetchReservationsFromDB();
            setReservations(updatedReservations);
            const updatedPayments = await fetchPaymentsFromDB();
            setPayments(updatedPayments);

            toast.success("Walk-in Reservation Created!", { description: "Reservation has been created for the guest." });
        } catch (error: any) {
            console.error("Error adding walk-in reservation:", error);
            toast.error(error.message || "Failed to create reservation");
            throw error; // Re-throw so the dialog knows it failed
        }
    };

    const updateStatus = async (id: number, requestedStatus: Reservation['Status']) => {
        let status = requestedStatus;
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
            const token = getCachedToken();
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

                if (status === 'Booked') {
                    // Auto check-in if check-in date is today or in the past
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const checkInDate = new Date(targetRes.Check_In);
                    checkInDate.setHours(0, 0, 0, 0);

                    if (checkInDate <= today) {
                        // Auto-upgrade to CheckedIn and occupy room
                        await rawMutate('reservation', 'PATCH', {
                            body: { status: 'CheckedIn' },
                            filters: `reservation_id=eq.${id}`,
                            token,
                        });
                        // Update local state to reflect CheckedIn
                        status = 'CheckedIn' as Reservation['Status'];
                        newRoomStatus = 'Occupied';
                        console.log('[updateStatus] Auto check-in: check-in date is today or past');
                    }
                }

                if (status === 'CheckedIn') newRoomStatus = 'Occupied';
                else if (status === 'CheckedOut') newRoomStatus = 'Available';
                else if (status === 'Cancelled') newRoomStatus = 'Available';

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
                                Role: user.staffData.Role as Staff['Role']
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

    // Full refresh (used by refreshData)
    const refreshData = async () => {
        const { rooms: fetchedRooms, roomTypes } = await fetchRoomsFromDB();
        roomTypesRef.current = roomTypes;
        setRooms(fetchedRooms);

        const fetched = await fetchReservationsFromDB();
        setReservations(fetched);

        const fetchedPayments = await fetchPaymentsFromDB();
        setPayments(fetchedPayments);
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
        availableRooms: rooms.filter(r => r.Status === 'Available').length,
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

    // Compute payment breakdown from actual payment records
    const activeReservationIds = new Set(
        reservations
            .filter(r => r.Status === 'Booked' || r.Status === 'CheckedIn' || r.Status === 'CheckedOut')
            .map(r => r.Reservation_ID)
    );
    const relevantPayments = payments.filter(p => activeReservationIds.has(p.reservation_id));
    const paymentByMethod: Record<string, number> = {};
    relevantPayments.forEach(p => {
        const method = p.method || 'Unknown';
        paymentByMethod[method] = (paymentByMethod[method] || 0) + Number(p.amount || 0);
    });
    const paymentBreakdown: PaymentBreakdown[] = Object.entries(paymentByMethod).map(([method, amount]) => ({
        method,
        amount
    }));

    return (
        <ReservationContext.Provider value={{ reservations, rooms, addReservation, addWalkInReservation, updateStatus, metrics, paymentBreakdown, resetData, updateRoomStatus, checkAvailability, refreshData }}>
            {children}
        </ReservationContext.Provider>
    );
}

export function useReservations() {
    const context = useContext(ReservationContext);
    if (!context) throw new Error('useReservations must be used within a ReservationProvider');
    return context;
}
