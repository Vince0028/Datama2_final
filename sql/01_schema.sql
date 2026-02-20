-- ============================================================================
--  HOTEL RESERVATION SYSTEM — DATABASE SCHEMA
--  DATAMA2 Finals Project — Group 1
-- ============================================================================



-- ============================================================================
--  BUSINESS RULES
-- ============================================================================
--
--  Room Types and Rooms
--    * Room Type categorizes one or many Rooms, and each Room is categorized by
--      one Room Type.
--
--  Staff and Reservations
--    * Staff member processes one or many Reservations, and each Reservation is
--      processed by one Staff member.
--
--  Rooms and Reservations
--    * Room is booked by one or many Reservations, and each Reservation books
--      one Room.
--
--  Reservation and Reservation Guest
--    * Reservation includes one or many Reservation Guests, and each Reservation
--      Guest is included in one Reservation.
--
--  Guest and Reservation Guest
--    * Guest is linked to one or many Reservation Guests, and each Reservation
--      Guest is linked to one Guest.
--
--  Reservation and Payment
--    * Reservation receives one or many Payments, and each Payment is for
--      one Reservation.
--
--  UserAccount and Guest/Staff
--    * UserAccount belongs to one Guest or Staff member, and each Guest or Staff
--      member has one UserAccount.
--
-- ============================================================================


-- ============================================================================
--  ENTITY-RELATIONSHIP OVERVIEW
-- ============================================================================
--
--   Guest ───────────┐
--                    │  (many-to-many via ReservationGuest)
--   Reservation ─────┤
--        │           └── ReservationGuest   (junction table)
--        │
--        ├── Room ──── RoomType             (each room has one type)
--        ├── Staff                          (staff assigned on approval)
--        └── Payment                        (one reservation → many payments)
--
--   UserAccount ──── links to Guest OR Staff for authentication
--
-- ============================================================================


-- ============================================================================
-- TABLE 1: Guest
-- ============================================================================
-- Stores personal information of hotel guests.
-- One guest can have many reservations (through ReservationGuest).

CREATE TABLE Guest (
    Guest_ID    SERIAL PRIMARY KEY,
    First_Name  VARCHAR(100) NOT NULL,
    Middle_Name VARCHAR(100),
    Last_Name   VARCHAR(100) NOT NULL,
    Phone       BIGINT       NOT NULL,
    Email       VARCHAR(100) NOT NULL UNIQUE,
    Address     VARCHAR(255),
    City        VARCHAR(100),
    Postal_Code INT,
    Created_At  TIMESTAMPTZ DEFAULT NOW(),
    -- Ensures email matches a standard format (e.g., name@domain.com)
    CONSTRAINT email_format      CHECK (Email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    -- Prevents saving a blank or space-only First Name
    CONSTRAINT guest_fname_not_empty CHECK (TRIM(First_Name) <> ''),
    -- Prevents saving a blank or space-only Last Name
    CONSTRAINT guest_lname_not_empty CHECK (TRIM(Last_Name) <> ''),
    -- Requires phone number to be a valid 10-digit local or 12-digit international format
    CONSTRAINT guest_phone_positive  CHECK (
        (Phone >= 9000000000 AND Phone <= 9999999999)         -- local:  09XX XXX XXXX (stored without leading 0)
        OR (Phone >= 639000000000 AND Phone <= 639999999999)  -- intl:   63 9XX XXX XXXX
    ),
    -- Guest names must start with a capital letter, only use letters, and allows special characters like hyphens or apostrophes
    CONSTRAINT guest_name_alpha      CHECK (
        First_Name ~ '^([A-Z][a-z''.]+)([ \-][A-Z][a-z''.]+)*$'
        AND Last_Name ~ '^([A-Z][a-z''.]+)([ \-][A-Z][a-z''.]+)*$'
    )
);


-- ============================================================================
-- TABLE 2: RoomType
-- ============================================================================
-- Lookup table for room categories.
-- Values: Single, Double, Deluxe, Suite, Family, Economy

CREATE TABLE RoomType (
    RoomType_ID   SERIAL PRIMARY KEY,
    Type_Name     VARCHAR(50)   NOT NULL UNIQUE,
    Base_Rate     DECIMAL(10,2) NOT NULL,
    Description   TEXT,
    Max_Occupancy INT DEFAULT 2,
    -- Prevents assigning negative or zero prices to a room base rate
    CONSTRAINT positive_rate CHECK (Base_Rate > 0),
    -- Prevents setting the max occupancy size to zero or a negative number
    CONSTRAINT positive_occupancy CHECK (Max_Occupancy > 0)
);


-- ============================================================================
-- TABLE 3: Room
-- ============================================================================
-- Each physical room in the hotel.
-- Status values: Available, Occupied, Maintenance

CREATE TABLE Room (
    Room_ID     SERIAL PRIMARY KEY,
    Room_Number VARCHAR(10) NOT NULL UNIQUE,
    RoomType_ID INT         NOT NULL,
    Status      VARCHAR(20) NOT NULL DEFAULT 'Available',
    Floor       INT         NOT NULL,
    -- Ensures the room isn't placed on a 0 or negative floor number
    CONSTRAINT positive_floor    CHECK (Floor > 0),
    -- Restricts a room status exactly to 'Available', 'Occupied', or 'Maintenance'
    CONSTRAINT room_status_check CHECK (Status IN ('Available', 'Occupied', 'Maintenance')),
    -- Ensures the room number isn't just an empty field or spaces
    CONSTRAINT room_number_format CHECK (TRIM(Room_Number) <> ''),
    FOREIGN KEY (RoomType_ID) REFERENCES RoomType(RoomType_ID)
);


-- ============================================================================
-- TABLE 4: Staff
-- ============================================================================
-- Hotel employees who process reservations.
-- Role values: Manager, Housekeeping, Accountant, ReservationAgent
-- Shift values: Day, Night, Rotating

CREATE TABLE Staff (
    Staff_ID   SERIAL PRIMARY KEY,
    First_Name VARCHAR(50)  NOT NULL,
    Last_Name  VARCHAR(50)  NOT NULL,
    Email      VARCHAR(100) NOT NULL UNIQUE,
    Role       VARCHAR(50)  NOT NULL,
    Shift      VARCHAR(50)  NOT NULL DEFAULT 'Day',
    Hire_Date  DATE DEFAULT CURRENT_DATE,
    Status     VARCHAR(20)  NOT NULL DEFAULT 'Active',
    Is_Owner   BOOLEAN      NOT NULL DEFAULT FALSE,
    -- Stops you from recording a staff member without a valid first name
    CONSTRAINT staff_fname_not_empty CHECK (TRIM(First_Name) <> ''),
    -- Stops you from recording a staff member without a valid last name
    CONSTRAINT staff_lname_not_empty CHECK (TRIM(Last_Name) <> ''),
    -- Validates that the staff member's email has a proper format
    CONSTRAINT staff_email_format    CHECK (Email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    -- Restricts jobs to only 4 options: Manager, Housekeeping, Accountant, or ReservationAgent
    CONSTRAINT staff_role_check      CHECK (Role IN ('Manager', 'Housekeeping', 'Accountant', 'ReservationAgent')),
    -- Restricts the work shifts to exactly Day, Night, or Rotating
    CONSTRAINT staff_shift_check     CHECK (Shift IN ('Day', 'Night', 'Rotating')),
    -- Keeps the employment status to strictly Active, Inactive, or OnLeave
    CONSTRAINT staff_status_check    CHECK (Status IN ('Active', 'Inactive', 'OnLeave'))
);


-- ============================================================================
-- TABLE 5: Reservation
-- ============================================================================
-- Core transaction table — one row per booking.
-- Status values: Pending, Booked, CheckedIn, CheckedOut, Cancelled
-- Staff_ID is NULL until a staff member approves the reservation.

CREATE TABLE Reservation (
    Reservation_ID SERIAL PRIMARY KEY,
    Room_ID        INT            NOT NULL,
    Staff_ID       INT,
    Check_In       DATE           NOT NULL,
    Check_Out      DATE           NOT NULL,
    Status         VARCHAR(20)    NOT NULL DEFAULT 'Pending',
    Total_Amount   DECIMAL(10,2)  NOT NULL,
    Created_At     TIMESTAMPTZ DEFAULT NOW(),
    -- Ensures a reservation total bill is 0 or higher (no negative totals)
    CONSTRAINT positive_total CHECK (Total_Amount >= 0),
    FOREIGN KEY (Room_ID)  REFERENCES Room(Room_ID),
    FOREIGN KEY (Staff_ID) REFERENCES Staff(Staff_ID),
    -- Stops impossible bookings by making sure the Check-Out date is after Check-In
    CONSTRAINT valid_dates CHECK (Check_Out > Check_In),
    -- Locks the reservation statuses to only Pending, Booked, CheckedIn, CheckedOut, or Cancelled
    CONSTRAINT reservation_status_check CHECK (Status IN ('Pending', 'Booked', 'CheckedIn', 'CheckedOut', 'Cancelled'))
);


-- ============================================================================
-- TABLE 6: ReservationGuest (Junction Table)
-- ============================================================================
-- Links Guests to Reservations (many-to-many relationship).
-- Guest_Type values: Primary, Additional

CREATE TABLE ReservationGuest (
    ResGuest_ID    SERIAL PRIMARY KEY,
    Reservation_ID INT         NOT NULL,
    Guest_ID       INT         NOT NULL,
    Guest_Type     VARCHAR(20) NOT NULL DEFAULT 'Primary',
    FOREIGN KEY (Reservation_ID) REFERENCES Reservation(Reservation_ID) ON DELETE CASCADE,
    FOREIGN KEY (Guest_ID)       REFERENCES Guest(Guest_ID),
    UNIQUE (Reservation_ID, Guest_ID),
    -- Restricts the guest's role to either the Primary booker or an Additional companion
    CONSTRAINT guest_type_check CHECK (Guest_Type IN ('Primary', 'Additional'))
);


-- ============================================================================
-- TABLE 7: Payment
-- ============================================================================
-- Tracks payments made for a reservation.
-- Method values: Cash, Card, GCash, PayPal
-- Status values: Pending, Paid, Refunded

CREATE TABLE Payment (
    Payment_ID            SERIAL PRIMARY KEY,
    Reservation_ID        INT            NOT NULL,
    Amount                DECIMAL(10,2)  NOT NULL,
    Payment_Date          TIMESTAMPTZ DEFAULT NOW(),
    -- Ensures every payment made is an amount greater than 0
    CONSTRAINT positive_payment CHECK (Amount > 0),
    Method                VARCHAR(20)    NOT NULL,
    Status                VARCHAR(20)    NOT NULL DEFAULT 'Pending',
    Transaction_Reference VARCHAR(100),
    FOREIGN KEY (Reservation_ID) REFERENCES Reservation(Reservation_ID) ON DELETE CASCADE,
    -- Restricts the accepted payment method to exactly Cash, Card, GCash, or PayPal
    CONSTRAINT payment_method_check CHECK (Method IN ('Cash', 'Card', 'GCash', 'PayPal')),
    -- Limits the payment status tracking to just Pending, Paid, or Refunded
    CONSTRAINT payment_status_check CHECK (Status IN ('Pending', 'Paid', 'Refunded'))
);


-- ============================================================================
-- TABLE 8: ReservationLog (Audit Trail)
-- ============================================================================
-- Tracks all status changes on reservations.
-- Logs WHO changed the status, WHEN, and FROM what TO what.

CREATE TABLE ReservationLog (
    Log_ID         SERIAL PRIMARY KEY,
    Reservation_ID INT          NOT NULL,
    Staff_ID       INT          NOT NULL,
    Action         VARCHAR(50)  NOT NULL,  -- e.g., 'Approved', 'Rejected', 'CheckedIn', 'CheckedOut'
    Previous_Status VARCHAR(20),
    New_Status     VARCHAR(20)  NOT NULL,
    Created_At     TIMESTAMPTZ  DEFAULT NOW(),
    FOREIGN KEY (Reservation_ID) REFERENCES Reservation(Reservation_ID) ON DELETE CASCADE,
    FOREIGN KEY (Staff_ID) REFERENCES Staff(Staff_ID),
    -- Only allows specific actions: Approved, Rejected, CheckedIn, CheckedOut, or Cancelled
    CONSTRAINT log_action_check          CHECK (Action IN ('Approved', 'Rejected', 'CheckedIn', 'CheckedOut', 'Cancelled')),
    -- Enforces that the old status matches the valid reservation statuses (or is null)
    CONSTRAINT log_prev_status_check     CHECK (Previous_Status IS NULL OR Previous_Status IN ('Pending', 'Booked', 'CheckedIn', 'CheckedOut', 'Cancelled')),
    -- Enforces that the new status matches the valid reservation statuses
    CONSTRAINT log_new_status_check      CHECK (New_Status IN ('Pending', 'Booked', 'CheckedIn', 'CheckedOut', 'Cancelled')),
    -- Ensures an action entry isn't accidentally submitted as blank
    CONSTRAINT log_action_not_empty      CHECK (TRIM(Action) <> '')
);


-- ============================================================================
-- INDEXES (for better query performance)
-- ============================================================================

CREATE INDEX idx_reservation_dates  ON Reservation(Check_In, Check_Out);
CREATE INDEX idx_reservation_status ON Reservation(Status);
CREATE INDEX idx_room_status        ON Room(Status);
CREATE INDEX idx_guest_email        ON Guest(Email);
CREATE INDEX idx_reservation_log    ON ReservationLog(Reservation_ID);
CREATE INDEX idx_payment_res        ON Payment(Reservation_ID);
CREATE INDEX idx_resguest_res       ON ReservationGuest(Reservation_ID);
CREATE INDEX idx_staff_status       ON Staff(Status);
