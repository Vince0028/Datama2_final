-- ============================================================================
-- FINAL CONSOLIDATED RLS FIX
-- Run this script in Supabase SQL Editor to fix ALL permission issues
-- ============================================================================
-- NOTE: If policies already exist, this script uses CREATE OR REPLACE where
-- possible, or DROP + CREATE. Safe to re-run.
-- ============================================================================

-- 1. ENABLE PUBLIC ACCESS FOR ROOMS (Fixes "No rooms found" on guest page)
DROP POLICY IF EXISTS "Public can view room types" ON RoomType;
CREATE POLICY "Public can view room types" ON RoomType 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view rooms" ON Room;
CREATE POLICY "Public can view rooms" ON Room 
    FOR SELECT USING (true);

-- 1b. STAFF CAN UPDATE ROOMS (Fixes room status changes not saving)
DROP POLICY IF EXISTS "Staff can update rooms" ON Room;
CREATE POLICY "Staff can update rooms" ON Room
    FOR UPDATE TO authenticated
    USING (auth.jwt()->>'email' IN (SELECT Email FROM Staff))
    WITH CHECK (auth.jwt()->>'email' IN (SELECT Email FROM Staff));

-- 2. FIX STAFF LOGIN PERMISSIONS (Fixes "Unauthorized" or stuck login)
DROP POLICY IF EXISTS "Enable read access for own staff record" ON Staff;
CREATE POLICY "Enable read access for own staff record" ON Staff
    FOR SELECT TO authenticated
    USING (auth.jwt()->>'email' = Email);

-- 3. FIX GUEST DATA ACCESS
DROP POLICY IF EXISTS "Users can view own guest data" ON Guest;
CREATE POLICY "Users can view own guest data" ON Guest 
    FOR SELECT USING (auth.jwt()->>'email' = Email);

DROP POLICY IF EXISTS "Users can insert own guest data" ON Guest;
CREATE POLICY "Users can insert own guest data" ON Guest 
    FOR INSERT WITH CHECK (auth.jwt()->>'email' = Email);

-- 4. FIX RESERVATION DATA ACCESS
DROP POLICY IF EXISTS "Users can view own reservations" ON Reservation;
CREATE POLICY "Users can view own reservations" ON Reservation
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ReservationGuest rg
            JOIN Guest g ON rg.Guest_ID = g.Guest_ID
            WHERE rg.Reservation_ID = Reservation.Reservation_ID
            AND g.Email = auth.jwt()->>'email'
        ) OR auth.jwt()->>'email' IN (SELECT Email FROM Staff)
    );

-- 4b. STAFF CAN UPDATE RESERVATIONS
DROP POLICY IF EXISTS "Staff can update reservations" ON Reservation;
CREATE POLICY "Staff can update reservations" ON Reservation
    FOR UPDATE TO authenticated
    USING (auth.jwt()->>'email' IN (SELECT Email FROM Staff))
    WITH CHECK (auth.jwt()->>'email' IN (SELECT Email FROM Staff));

-- 4c. AUTHENTICATED USERS CAN INSERT RESERVATIONS
DROP POLICY IF EXISTS "Authenticated users can create reservations" ON Reservation;
CREATE POLICY "Authenticated users can create reservations" ON Reservation
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. RESERVATION GUEST LINKS
DROP POLICY IF EXISTS "Users can link guests" ON ReservationGuest;
CREATE POLICY "Users can link guests" ON ReservationGuest
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view guest links" ON ReservationGuest;
CREATE POLICY "Users can view guest links" ON ReservationGuest
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM Guest g
            WHERE g.Guest_ID = ReservationGuest.Guest_ID
            AND g.Email = auth.jwt()->>'email'
        ) OR auth.jwt()->>'email' IN (SELECT Email FROM Staff)
    );

-- 6. STAFF ADMIN ACCESS
DROP POLICY IF EXISTS "Staff can view all guests" ON Guest;
CREATE POLICY "Staff can view all guests" ON Guest
    FOR SELECT USING (auth.jwt()->>'email' IN (SELECT Email FROM Staff));

-- 7. ENABLE REALTIME ON KEY TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE room;
ALTER PUBLICATION supabase_realtime ADD TABLE reservation;

-- Confirmation
SELECT 'RLS Policies Updated Successfully' as status;
