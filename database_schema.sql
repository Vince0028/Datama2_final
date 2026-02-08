-- ============================================================================
-- Hotel Reservation System - Supabase Database Schema
-- DATAMA1 Finals Project - Group 1
-- ============================================================================
-- Copy this entire file into Supabase SQL Editor and run it
-- This creates all tables with proper constraints and relationships
-- ============================================================================

-- Enable UUID extension (Supabase uses UUIDs by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. GUEST TABLE
-- ============================================================================
CREATE TABLE Guest (
    Guest_ID SERIAL PRIMARY KEY,
    First_Name VARCHAR(100) NOT NULL,
    Middle_Name VARCHAR(100),
    Last_Name VARCHAR(100) NOT NULL,
    Phone VARCHAR(20) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Address VARCHAR(255),
    City VARCHAR(100),
    Postal_Code VARCHAR(20),
    Created_At TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. ROOM TYPE TABLE
-- ============================================================================
-- Room Types: Single, Double, Deluxe, Suite, Family, Economy
CREATE TABLE RoomType (
    RoomType_ID SERIAL PRIMARY KEY,
    Type_Name VARCHAR(50) NOT NULL UNIQUE,
    Base_Rate DECIMAL(10,2) NOT NULL,
    Description TEXT,
    Max_Occupancy INT DEFAULT 2
);

-- Insert default room types
INSERT INTO RoomType (Type_Name, Base_Rate, Description, Max_Occupancy) VALUES
    ('Single', 2500.00, 'Cozy room with single bed', 1),
    ('Double', 3500.00, 'Comfortable room with double bed', 2),
    ('Deluxe', 5000.00, 'Spacious room with premium amenities', 2),
    ('Suite', 8000.00, 'Luxury suite with separate living area', 4),
    ('Family', 6500.00, 'Large room ideal for families', 5),
    ('Economy', 1800.00, 'Budget-friendly accommodation', 2);

-- ============================================================================
-- 3. ROOM TABLE
-- ============================================================================
-- Room Status: Available, Occupied, Maintenance, Reserved
CREATE TABLE Room (
    Room_ID SERIAL PRIMARY KEY,
    Room_Number VARCHAR(10) NOT NULL UNIQUE,
    RoomType_ID INT NOT NULL REFERENCES RoomType(RoomType_ID),
    Status VARCHAR(20) NOT NULL DEFAULT 'Available' 
        CHECK (Status IN ('Available', 'Occupied', 'Maintenance', 'Reserved')),
    Floor INT,
    Image_URL TEXT
);

-- ============================================================================
-- 4. STAFF TABLE
-- ============================================================================
-- Staff Roles: Manager, FrontDesk, Housekeeping, Concierge, Accountant
CREATE TABLE Staff (
    Staff_ID SERIAL PRIMARY KEY,
    First_Name VARCHAR(100) NOT NULL,
    Last_Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Role VARCHAR(50) NOT NULL 
        CHECK (Role IN ('Manager', 'FrontDesk', 'Housekeeping', 'Concierge', 'Accountant')),
    Shift VARCHAR(50) DEFAULT 'Day'
        CHECK (Shift IN ('Day', 'Night', 'Rotating')),
    Hire_Date DATE DEFAULT CURRENT_DATE,
    Status VARCHAR(20) DEFAULT 'Active'
        CHECK (Status IN ('Active', 'OnLeave', 'Inactive'))
);

-- Insert default staff (for demo purposes)
INSERT INTO Staff (First_Name, Last_Name, Email, Role, Shift) VALUES
    ('John', 'Smith', 'frontdesk@hotel.com', 'FrontDesk', 'Day'),
    ('Sarah', 'Johnson', 'admin@hotel.com', 'Manager', 'Day'),
    ('Mike', 'Davis', 'concierge@hotel.com', 'Concierge', 'Day');

-- ============================================================================
-- 5. USER ACCOUNT TABLE (Authentication)
-- ============================================================================
-- Links to Supabase Auth - can use auth.users or standalone
CREATE TABLE UserAccount (
    User_ID SERIAL PRIMARY KEY,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Password_Hash VARCHAR(255) NOT NULL,
    User_Type VARCHAR(20) NOT NULL 
        CHECK (User_Type IN ('Guest', 'Staff')),
    Guest_ID INT REFERENCES Guest(Guest_ID) ON DELETE SET NULL,
    Staff_ID INT REFERENCES Staff(Staff_ID) ON DELETE SET NULL,
    Created_At TIMESTAMPTZ DEFAULT NOW(),
    Last_Login TIMESTAMPTZ,
    -- Constraint: Must have either Guest_ID or Staff_ID based on User_Type
    CONSTRAINT user_type_link CHECK (
        (User_Type = 'Guest' AND Guest_ID IS NOT NULL AND Staff_ID IS NULL) OR
        (User_Type = 'Staff' AND Staff_ID IS NOT NULL AND Guest_ID IS NULL)
    )
);

-- ============================================================================
-- 6. RESERVATION TABLE
-- ============================================================================
-- Reservation Status: Pending, Confirmed, CheckedIn, CheckedOut, Cancelled
CREATE TABLE Reservation (
    Reservation_ID SERIAL PRIMARY KEY,
    Room_ID INT NOT NULL REFERENCES Room(Room_ID),
    Staff_ID INT REFERENCES Staff(Staff_ID), -- Nullable for Pending reservations
    Check_In DATE NOT NULL,
    Check_Out DATE NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (Status IN ('Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled')),
    Total_Amount DECIMAL(10,2) NOT NULL,
    Notes TEXT,
    Created_At TIMESTAMPTZ DEFAULT NOW(),
    -- Check-out must be after check-in
    CONSTRAINT valid_dates CHECK (Check_Out > Check_In)
);

-- ============================================================================
-- 7. RESERVATION GUEST TABLE (Junction Table)
-- ============================================================================
-- Guest Type: Primary, Additional
CREATE TABLE ReservationGuest (
    ResGuest_ID SERIAL PRIMARY KEY,
    Reservation_ID INT NOT NULL REFERENCES Reservation(Reservation_ID) ON DELETE CASCADE,
    Guest_ID INT NOT NULL REFERENCES Guest(Guest_ID),
    Guest_Type VARCHAR(20) NOT NULL DEFAULT 'Primary'
        CHECK (Guest_Type IN ('Primary', 'Additional')),
    UNIQUE (Reservation_ID, Guest_ID) -- Prevent duplicate guest entries
);

-- ============================================================================
-- 8. PAYMENT TABLE
-- ============================================================================
-- Payment Method: Card, Cash, Online
-- Payment Status: Pending, Paid, Refunded
CREATE TABLE Payment (
    Payment_ID SERIAL PRIMARY KEY,
    Reservation_ID INT NOT NULL REFERENCES Reservation(Reservation_ID) ON DELETE CASCADE,
    Amount DECIMAL(10,2) NOT NULL,
    Payment_Date TIMESTAMPTZ DEFAULT NOW(),
    Method VARCHAR(20) NOT NULL
        CHECK (Method IN ('Card', 'Cash', 'Online')),
    Status VARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (Status IN ('Pending', 'Paid', 'Refunded')),
    Transaction_Reference VARCHAR(100)
);

-- ============================================================================
-- INDEXES (for better query performance)
-- ============================================================================
CREATE INDEX idx_reservation_dates ON Reservation(Check_In, Check_Out);
CREATE INDEX idx_reservation_status ON Reservation(Status);
CREATE INDEX idx_room_status ON Room(Status);
CREATE INDEX idx_guest_email ON Guest(Email);
CREATE INDEX idx_useraccount_email ON UserAccount(Email);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Enable for Supabase
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE Guest ENABLE ROW LEVEL SECURITY;
ALTER TABLE Room ENABLE ROW LEVEL SECURITY;
ALTER TABLE RoomType ENABLE ROW LEVEL SECURITY;
ALTER TABLE Staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE UserAccount ENABLE ROW LEVEL SECURITY;
ALTER TABLE Reservation ENABLE ROW LEVEL SECURITY;
ALTER TABLE ReservationGuest ENABLE ROW LEVEL SECURITY;
ALTER TABLE Payment ENABLE ROW LEVEL SECURITY;

-- Public read access for RoomType and Room (for browsing)
CREATE POLICY "Public can view room types" ON RoomType FOR SELECT USING (true);
CREATE POLICY "Public can view rooms" ON Room FOR SELECT USING (true);

-- Authenticated users can view their own data
CREATE POLICY "Users can view own guest data" ON Guest 
    FOR SELECT USING (auth.uid()::text = Email);
    
CREATE POLICY "Users can view own reservations" ON Reservation
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ReservationGuest rg
            JOIN Guest g ON rg.Guest_ID = g.Guest_ID
            WHERE rg.Reservation_ID = Reservation.Reservation_ID
            AND g.Email = auth.jwt()->>'email'
        )
    );

-- ============================================================================
-- SAMPLE DATA (Optional - comment out for production)
-- ============================================================================
-- Insert sample rooms
INSERT INTO Room (Room_Number, RoomType_ID, Status, Floor) VALUES
    ('101', 1, 'Available', 1),
    ('102', 1, 'Available', 1),
    ('201', 2, 'Available', 2),
    ('202', 2, 'Maintenance', 2),
    ('301', 3, 'Available', 3),
    ('401', 4, 'Available', 4),
    ('501', 5, 'Available', 5),
    ('601', 6, 'Available', 6);
