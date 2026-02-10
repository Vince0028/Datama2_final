// Types matching your DATAMA1 database schema exactly

export interface Guest {
  Guest_ID: number;
  First_Name: string;
  Middle_Name: string;
  Last_Name: string;
  Phone: string;
  Email: string;
  Address: string;
  City: string;
  Postal_Code: number;
}

export interface RoomType {
  RoomType_ID: number;
  Type_Name: string;
  Base_Rate: number;
}

export interface Room {
  Room_ID: number;
  Room_Number: string;
  RoomType_ID: number;
  Status: 'Available' | 'Occupied' | 'Maintenance';
  // Joined fields
  roomType?: RoomType;
}

export interface Staff {
  Staff_ID: number;
  First_Name: string;
  Last_Name: string;
  Role: 'Manager' | 'FrontDesk' | 'Housekeeping' | 'Concierge' | 'Accountant' | 'ReservationAgent';
}

export interface Reservation {
  Reservation_ID: number;
  Room_ID: number;
  Staff_ID: number;
  Check_In: string;
  Check_Out: string;
  Status: 'Booked' | 'CheckedIn' | 'CheckedOut' | 'Cancelled' | 'Pending';
  Total_Amount: number;
  // Joined fields
  room?: Room;
  staff?: Staff;
  guests?: ReservationGuest[];
  payment?: Payment;
}

export interface ReservationGuest {
  ResGuest_ID: number;
  Reservation_ID: number;
  Guest_ID: number;
  Guest_Type: 'Primary' | 'Additional';
  // Joined fields
  guest?: Guest;
}

export interface Payment {
  Payment_ID: number;
  Reservation_ID: number;
  Amount: number;
  Method: 'Cash' | 'Card' | 'GCash' | 'PayPal';
  Status: 'Paid' | 'Pending';
}

// Dashboard metrics
export interface DashboardMetrics {
  totalRevenue: number;
  activeReservations: number;
  availableRooms: number;
  averageStay: number;
}
