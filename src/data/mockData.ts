// Mock data matching your DATAMA1 project exactly
import type { Guest, RoomType, Room, Staff, Reservation, ReservationGuest, Payment } from '@/types/hotel';

export const guests: Guest[] = [];

export const roomTypes: RoomType[] = [
  { RoomType_ID: 1, Type_Name: 'Single', Base_Rate: 1200.00 },
  { RoomType_ID: 2, Type_Name: 'Double', Base_Rate: 1800.00 },
  { RoomType_ID: 3, Type_Name: 'Deluxe', Base_Rate: 2600.00 },
  { RoomType_ID: 4, Type_Name: 'Suite', Base_Rate: 4500.00 },
  { RoomType_ID: 5, Type_Name: 'Family', Base_Rate: 3500.00 },
  { RoomType_ID: 6, Type_Name: 'Economy', Base_Rate: 900.00 },
];

export const rooms: Room[] = [
  { Room_ID: 1, Room_Number: '101', RoomType_ID: 1, Status: 'Available' },
  { Room_ID: 2, Room_Number: '102', RoomType_ID: 2, Status: 'Available' },
  { Room_ID: 3, Room_Number: '201', RoomType_ID: 3, Status: 'Maintenance' },
  { Room_ID: 4, Room_Number: '301', RoomType_ID: 4, Status: 'Available' },
  { Room_ID: 5, Room_Number: '302', RoomType_ID: 5, Status: 'Occupied' },
  { Room_ID: 6, Room_Number: '103', RoomType_ID: 6, Status: 'Available' },
];

export const staff: Staff[] = [
  { Staff_ID: 1, First_Name: 'Ramon', Last_Name: 'Santos', Role: 'FrontDesk' },
  { Staff_ID: 2, First_Name: 'Leah', Last_Name: 'Garcia', Role: 'Manager' },
  { Staff_ID: 3, First_Name: 'Diego', Last_Name: 'Cruz', Role: 'Housekeeping' },
  { Staff_ID: 4, First_Name: 'Nina', Last_Name: 'Velasco', Role: 'Concierge' },
  { Staff_ID: 5, First_Name: 'Tom', Last_Name: 'Perez', Role: 'FrontDesk' },
  { Staff_ID: 6, First_Name: 'Ivy', Last_Name: 'Lopez', Role: 'Accountant' },
];

export const reservations: Reservation[] = [];

export const reservationGuests: ReservationGuest[] = [];

export const payments: Payment[] = [];

// Helper functions to get enriched data
export const getRoomWithType = (room: Room): Room & { roomType: RoomType } => {
  const roomType = roomTypes.find(rt => rt.RoomType_ID === room.RoomType_ID)!;
  return { ...room, roomType };
};

export const getReservationWithDetails = (reservation: Reservation) => {
  const room = rooms.find(r => r.Room_ID === reservation.Room_ID);
  const staffMember = staff.find(s => s.Staff_ID === reservation.Staff_ID);
  const resGuests = reservationGuests
    .filter(rg => rg.Reservation_ID === reservation.Reservation_ID)
    .map(rg => ({
      ...rg,
      guest: guests.find(g => g.Guest_ID === rg.Guest_ID),
    }));

  return {
    ...reservation,
    room: room ? getRoomWithType(room) : undefined,
    staff: staffMember,
    guests: resGuests,
  };
};

// Dashboard calculations
export const calculateDashboardMetrics = () => {
  const totalRevenue = payments
    .filter(p => p.Status === 'Paid')
    .reduce((sum, p) => sum + p.Amount, 0);

  const activeReservations = reservations.filter(
    r => r.Status === 'Booked' || r.Status === 'CheckedIn'
  ).length;

  const availableRooms = rooms.filter(r => r.Status === 'Available').length;

  const completedReservations = reservations.filter(r => r.Status === 'CheckedOut');
  const totalNights = completedReservations.reduce((sum, r) => {
    const checkIn = new Date(r.Check_In);
    const checkOut = new Date(r.Check_Out);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return sum + nights;
  }, 0);
  const averageStay = completedReservations.length > 0
    ? totalNights / completedReservations.length
    : 0;

  return { totalRevenue, activeReservations, availableRooms, averageStay };
};

// Revenue by payment method
export const getRevenueByMethod = () => {
  const revenueMap = payments.reduce((acc, p) => {
    if (p.Status === 'Paid') {
      acc[p.Method] = (acc[p.Method] || 0) + p.Amount;
    }
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(revenueMap).map(([method, amount]) => ({
    method,
    amount,
  }));
};
