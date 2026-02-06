-- Database Design and Implementation for Hotel Reservation System
-- DATAMA1 Finals Project - Group 1

-- 1. Guest Table
CREATE TABLE Guest (
    Guest_ID INT NOT NULL,
    First_Name VARCHAR(100) NOT NULL,
    Middle_Name VARCHAR(100) NOT NULL,
    Last_Name VARCHAR(100) NOT NULL,
    Phone VARCHAR(20) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Address VARCHAR(100) NOT NULL,
    City VARCHAR(100) NOT NULL,
    Postal_Code INT NOT NULL,
    PRIMARY KEY (Guest_ID)
);

-- 2. RoomType Table
CREATE TABLE RoomType (
    RoomType_ID INT NOT NULL,
    Type_Name VARCHAR(50) NOT NULL,
    Base_Rate DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (RoomType_ID)
);

-- 3. Room Table
CREATE TABLE Room (
    Room_ID INT NOT NULL,
    Room_Number VARCHAR(10) NOT NULL,
    RoomType_ID INT NOT NULL,
    Status VARCHAR(50) NOT NULL,
    PRIMARY KEY (Room_ID),
    FOREIGN KEY (RoomType_ID) REFERENCES RoomType(RoomType_ID)
);

-- 4. Staff Table
CREATE TABLE Staff (
    Staff_ID INT NOT NULL,
    First_Name VARCHAR(100) NOT NULL,
    Last_Name VARCHAR(100) NOT NULL,
    Role VARCHAR(50) NOT NULL,
    PRIMARY KEY (Staff_ID)
);

-- 5. Reservation Table
CREATE TABLE Reservation (
    Reservation_ID INT NOT NULL,
    Room_ID INT NOT NULL,
    Staff_ID INT, -- Nullable for Pending reservations
    Check_In DATE NOT NULL,
    Check_Out DATE NOT NULL,
    Status VARCHAR(50) NOT NULL, -- 'Pending', 'Booked', 'CheckedIn', etc.
    Total_Amount DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (Reservation_ID),
    FOREIGN KEY (Room_ID) REFERENCES Room(Room_ID),
    FOREIGN KEY (Staff_ID) REFERENCES Staff(Staff_ID)
);

-- 6. ReservationGuest Table
CREATE TABLE ReservationGuest (
    ResGuest_ID INT NOT NULL,
    Reservation_ID INT NOT NULL,
    Guest_ID INT NOT NULL,
    Guest_Type VARCHAR(50) NOT NULL,
    PRIMARY KEY (ResGuest_ID),
    FOREIGN KEY (Reservation_ID) REFERENCES Reservation(Reservation_ID),
    FOREIGN KEY (Guest_ID) REFERENCES Guest(Guest_ID)
);

-- 7. Payment Table
CREATE TABLE Payment (
    Payment_ID INT NOT NULL,
    Reservation_ID INT NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    Method VARCHAR(50) NOT NULL,
    Status VARCHAR(50) NOT NULL,
    PRIMARY KEY (Payment_ID),
    FOREIGN KEY (Reservation_ID) REFERENCES Reservation(Reservation_ID)
);
