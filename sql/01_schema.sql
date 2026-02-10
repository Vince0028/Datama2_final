-- ============================================================================
--  HOTEL RESERVATION SYSTEM — DATABASE SCHEMA
--  DATAMA2 Finals Project — Group 1
-- ============================================================================



-- ============================================================================
--  BUSINESS RULES
-- ============================================================================
--
--  Room Types and Rooms
--    * One Room Type categorizes one or many Rooms.
--      One or many Rooms is categorized by one Room Type.
--
--  Staff and Reservations
--    * One Staff member processes one or many Reservations.
--      One or many Reservations is processed by one Staff member.
--
--  Rooms and Reservations
--    * One Room can be booked by one or many Reservations.
--      One or many Reservations can only book one Room.
--
--  Reservation and Reservation Guest
--    * One Reservation can include one or many Reservation Guests.
--      One or many Reservation Guests can only include one Reservation.
--
--  Guest and Reservation Guest
--    * One Guest can be linked to one or many Reservation Guests.
--      One or many Reservation Guests is linked to one Guest.
--
--  Payment and Reservation
--    * One or many Payments belongs to one Reservation.
--      One Reservation belongs to one or many Payments.
--
--  UserAccount and Guest/Staff
--    * One UserAccount belongs to one Guest OR one Staff member.
--      One Guest or Staff member has one UserAccount.
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
    Phone       VARCHAR(20)  NOT NULL,
    Email       VARCHAR(100) NOT NULL UNIQUE,
    Address     VARCHAR(255),
    City        VARCHAR(100),
    Postal_Code VARCHAR(20),
    Created_At  TIMESTAMPTZ DEFAULT NOW()
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
    Max_Occupancy INT DEFAULT 2
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
    Floor       INT,
    Image_URL   TEXT,
    FOREIGN KEY (RoomType_ID) REFERENCES RoomType(RoomType_ID)
);


-- ============================================================================
-- TABLE 4: Staff
-- ============================================================================
-- Hotel employees who process reservations.
-- Role values: Manager, Housekeeping, Accountant, FrontDesk, Concierge, ReservationAgent
-- Shift values: Day, Night, Rotating

CREATE TABLE Staff (
    Staff_ID   SERIAL PRIMARY KEY,
    First_Name VARCHAR(100) NOT NULL,
    Last_Name  VARCHAR(100) NOT NULL,
    Email      VARCHAR(100) NOT NULL UNIQUE,
    Role       VARCHAR(50)  NOT NULL,
    Shift      VARCHAR(50)  DEFAULT 'Day',
    Hire_Date  DATE DEFAULT CURRENT_DATE,
    Status     VARCHAR(20)  DEFAULT 'Active',
    CHECK (Role IN ('Manager', 'Housekeeping', 'Accountant', 'FrontDesk', 'Concierge', 'ReservationAgent'))
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
    Notes          TEXT,
    Created_At     TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (Room_ID)  REFERENCES Room(Room_ID),
    FOREIGN KEY (Staff_ID) REFERENCES Staff(Staff_ID),
    CONSTRAINT valid_dates CHECK (Check_Out > Check_In),
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
    UNIQUE (Reservation_ID, Guest_ID)
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
    Method                VARCHAR(20)    NOT NULL,
    Status                VARCHAR(20)    NOT NULL DEFAULT 'Pending',
    Transaction_Reference VARCHAR(100),
    FOREIGN KEY (Reservation_ID) REFERENCES Reservation(Reservation_ID) ON DELETE CASCADE,
    CONSTRAINT payment_method_check CHECK (Method IN ('Cash', 'Card', 'GCash', 'PayPal'))
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
    Notes          TEXT,
    Created_At     TIMESTAMPTZ  DEFAULT NOW(),
    FOREIGN KEY (Reservation_ID) REFERENCES Reservation(Reservation_ID) ON DELETE CASCADE,
    FOREIGN KEY (Staff_ID) REFERENCES Staff(Staff_ID)
);


-- ============================================================================
-- INDEXES (for better query performance)
-- ============================================================================

CREATE INDEX idx_reservation_dates  ON Reservation(Check_In, Check_Out);
CREATE INDEX idx_reservation_status ON Reservation(Status);
CREATE INDEX idx_room_status        ON Room(Status);
CREATE INDEX idx_guest_email        ON Guest(Email);
CREATE INDEX idx_reservation_log    ON ReservationLog(Reservation_ID);
