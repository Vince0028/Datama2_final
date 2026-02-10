# Hotel Reservation System

A full-stack hotel reservation system built with **React (Vite)**, **Tailwind CSS**, and **Supabase**. This application features separate interfaces for guests (booking, room viewing) and staff (management, reporting).

## 🚀 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- A [Supabase](https://supabase.com/) account and project

## 🛠️ Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

## 🗄️ Database Setup

1.  **Go to your Supabase Dashboard** and open the **SQL Editor**.

2.  **Run Schema Scripts**
    Run the scripts located in the `sql/` folder in the following order:
    1.  Copy and run content of `sql/01_schema.sql` (Creates tables).
    2.  Copy and run content of `sql/02_rls_policies.sql` (Sets up security policies).

3.  **Seed Initial Data**
    Run the following SQL block to create the initial Staff records. **Important:** These emails must match the users you create in the next step.
    
    ```sql
    -- Insert Sample Staff Members
    INSERT INTO Staff (First_Name, Last_Name, Email, Role, Shift, Status)
    VALUES 
    ('Admin', 'Manager', 'manager@hotel.com', 'Manager', 'Day', 'Active'),
    ('John', 'Doe', 'frontdesk@hotel.com', 'FrontDesk', 'Day', 'Active'),
    ('Jane', 'Smith', 'housekeeping@hotel.com', 'Housekeeping', 'Day', 'Active');
    
    -- Insert Sample Room Types (REQUIRED for rooms to exist)
    INSERT INTO RoomType (Type_Name, Base_Rate, Description, Max_Occupancy)
    VALUES 
    ('Deluxe Room', 150.00, 'Spacious room with king size bed', 2),
    ('Standard Room', 100.00, 'Cozy room with queen size bed', 2),
    ('Suite', 300.00, 'Luxury suite with city view', 4);

    -- Insert Sample Rooms
    INSERT INTO Room (Room_Number, RoomType_ID, Status, Floor, Image_URL)
    VALUES 
    ('101', (SELECT RoomType_ID FROM RoomType WHERE Type_Name = 'Standard Room'), 'Available', 1, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32'),
    ('102', (SELECT RoomType_ID FROM RoomType WHERE Type_Name = 'Standard Room'), 'Available', 1, 'https://images.unsplash.com/photo-1582719508461-905c673771fd'),
    ('201', (SELECT RoomType_ID FROM RoomType WHERE Type_Name = 'Deluxe Room'), 'Available', 2, 'https://images.unsplash.com/photo-1590490360182-c33d57733427'),
    ('301', (SELECT RoomType_ID FROM RoomType WHERE Type_Name = 'Suite'), 'Available', 3, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461');
    ```

4.  **Create Auth Users**
    In Supabase Dashboard > **Authentication** > **Users**:
    
    Manually create users with the following emails (passwords can be anything you like, e.g., `pass123`):
    - `manager@hotel.com`
    - `frontdesk@hotel.com`
    - `housekeeping@hotel.com`

    > **Note:** The system links your login to the staff permissions via **Email**. Ensure the email in "Authentication" matches the email in the "Staff" table exactly.

## 🏃‍♂️ Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## 📖 Usage Guide

### 🏨 Guest Interface
**URL:** `http://localhost:5173/`

- **Home**: Landing page.
- **Rooms**: View available rooms (`/guest/rooms`).
- **Booking**: Guests can sign up/login and make reservations.

### 💼 Staff Interface
**URL:** `http://localhost:5173/staff-login`

**Login Credentials:**
Use the email/password you created in the **Create Auth Users** step.

- **Manager**: Full access to Dashboard, Rooms, Reservations, Guests, and Reports.
- **Front Desk**: Access to Check-in/Check-out and Reservations.
- **Housekeeping**: View room status and update cleaning status.

### 🧪 Debugging
If you encounter issues, check the browser console or use the debug page (if enabled in development) to verify Supabase connection.
