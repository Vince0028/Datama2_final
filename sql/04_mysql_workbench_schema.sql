-- ============================================================================
--  HOTEL RESERVATION SYSTEM — MYSQL COMPATIBLE SCHEMA
--  (For MySQL Workbench Reverse Engineering)
-- ============================================================================

-- Disable foreign key checks temporarily to allow drop/create table operations
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if they exist (optional, for clean slate)
DROP TABLE IF EXISTS ReservationLog;
DROP TABLE IF EXISTS Payment;
DROP TABLE IF EXISTS ReservationGuest;
DROP TABLE IF EXISTS Reservation;
DROP TABLE IF EXISTS Staff;
DROP TABLE IF EXISTS Room;
DROP TABLE IF EXISTS RoomType;
DROP TABLE IF EXISTS Guest;

-- ============================================================================
-- TABLE 1: Guest
-- ============================================================================
CREATE TABLE Guest (
    Guest_ID    INT AUTO_INCREMENT PRIMARY KEY,
    First_Name  VARCHAR(100) NOT NULL,
    Middle_Name VARCHAR(100),
    Last_Name   VARCHAR(100) NOT NULL,
    Phone       VARCHAR(20)  NOT NULL,
    Email       VARCHAR(100) NOT NULL UNIQUE,
    Address     VARCHAR(255),
    City        VARCHAR(100),
    Postal_Code VARCHAR(20),
    Created_At  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 2: RoomType
-- ============================================================================
CREATE TABLE RoomType (
    RoomType_ID   INT AUTO_INCREMENT PRIMARY KEY,
    Type_Name     VARCHAR(50)   NOT NULL UNIQUE,
    Base_Rate     DECIMAL(10,2) NOT NULL,
    Description   TEXT,
    Max_Occupancy INT DEFAULT 2,
    CHECK (Base_Rate > 0),
    CHECK (Max_Occupancy > 0)
);

-- ============================================================================
-- TABLE 3: Room
-- ============================================================================
CREATE TABLE Room (
    Room_ID     INT AUTO_INCREMENT PRIMARY KEY,
    Room_Number VARCHAR(10) NOT NULL UNIQUE,
    RoomType_ID INT         NOT NULL,
    Status      VARCHAR(20) NOT NULL DEFAULT 'Available',
    Floor       INT,
    CHECK (Floor > 0),
    FOREIGN KEY (RoomType_ID) REFERENCES RoomType(RoomType_ID)
);

-- ============================================================================
-- TABLE 4: Staff
-- ============================================================================
CREATE TABLE Staff (
    Staff_ID   INT AUTO_INCREMENT PRIMARY KEY,
    First_Name VARCHAR(100) NOT NULL,
    Last_Name  VARCHAR(100) NOT NULL,
    Email      VARCHAR(100) NOT NULL UNIQUE,
    Role       VARCHAR(50)  NOT NULL,
    Shift      VARCHAR(50)  DEFAULT 'Day',
    Hire_Date  DATE DEFAULT (CURRENT_DATE),
    Status     VARCHAR(20)  DEFAULT 'Active',
    CHECK (Role IN ('Manager', 'Housekeeping', 'Accountant', 'FrontDesk', 'Concierge', 'ReservationAgent'))
);

-- ============================================================================
-- TABLE 5: Reservation
-- ============================================================================
CREATE TABLE Reservation (
    Reservation_ID INT AUTO_INCREMENT PRIMARY KEY,
    Room_ID        INT            NOT NULL,
    Staff_ID       INT,
    Check_In       DATE           NOT NULL,
    Check_Out      DATE           NOT NULL,
    Status         VARCHAR(20)    NOT NULL DEFAULT 'Pending',
    Total_Amount   DECIMAL(10,2)  NOT NULL,
    Created_At     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (Total_Amount >= 0),
    FOREIGN KEY (Room_ID)  REFERENCES Room(Room_ID),
    FOREIGN KEY (Staff_ID) REFERENCES Staff(Staff_ID),
    CONSTRAINT valid_dates CHECK (Check_Out > Check_In),
    CONSTRAINT reservation_status_check CHECK (Status IN ('Pending', 'Booked', 'CheckedIn', 'CheckedOut', 'Cancelled'))
);

-- ============================================================================
-- TABLE 6: ReservationGuest (Junction Table)
-- ============================================================================
CREATE TABLE ReservationGuest (
    ResGuest_ID    INT AUTO_INCREMENT PRIMARY KEY,
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
CREATE TABLE Payment (
    Payment_ID            INT AUTO_INCREMENT PRIMARY KEY,
    Reservation_ID        INT            NOT NULL,
    Amount                DECIMAL(10,2)  NOT NULL,
    CHECK (Amount > 0),
    Payment_Date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Method                VARCHAR(20)    NOT NULL,
    Status                VARCHAR(20)    NOT NULL DEFAULT 'Pending',
    Transaction_Reference VARCHAR(100),
    FOREIGN KEY (Reservation_ID) REFERENCES Reservation(Reservation_ID) ON DELETE CASCADE,
    CONSTRAINT payment_method_check CHECK (Method IN ('Cash', 'Card', 'GCash', 'PayPal'))
);

-- ============================================================================
-- TABLE 8: ReservationLog (Audit Trail)
-- ============================================================================
CREATE TABLE ReservationLog (
    Log_ID         INT AUTO_INCREMENT PRIMARY KEY,
    Reservation_ID INT          NOT NULL,
    Staff_ID       INT          NOT NULL,
    Action         VARCHAR(50)  NOT NULL,
    Previous_Status VARCHAR(20),
    New_Status     VARCHAR(20)  NOT NULL,
    Created_At     TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Reservation_ID) REFERENCES Reservation(Reservation_ID) ON DELETE CASCADE,
    FOREIGN KEY (Staff_ID) REFERENCES Staff(Staff_ID)
);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
