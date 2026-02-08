-- ============================================================================
-- Supabase RLS Policy Patch (Run this AFTER the main schema)
-- ============================================================================
-- Fixes permissions so the app can actually INSERT/UPDATE data 
-- and properly matches users by Email.
-- ============================================================================

-- 1. FIX GUEST POLICIES
DROP POLICY IF EXISTS "Users can view own guest data" ON Guest;
CREATE POLICY "Users can view own guest data" ON Guest 
    FOR SELECT USING (auth.jwt()->>'email' = Email);

CREATE POLICY "Users can insert own guest data" ON Guest 
    FOR INSERT WITH CHECK (auth.jwt()->>'email' = Email);

CREATE POLICY "Users can update own guest data" ON Guest 
    FOR UPDATE USING (auth.jwt()->>'email' = Email);

-- Allow public read for staff to verify users (or restrict strictly to staff role)
CREATE POLICY "Staff can view all guests" ON Guest
    FOR SELECT USING (auth.jwt()->>'email' IN (SELECT Email FROM Staff));


-- 2. FIX RESERVATION POLICIES
DROP POLICY IF EXISTS "Users can view own reservations" ON Reservation;
CREATE POLICY "Users can view own reservations" ON Reservation
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ReservationGuest rg
            JOIN Guest g ON rg.Guest_ID = g.Guest_ID
            WHERE rg.Reservation_ID = Reservation.Reservation_ID
            AND g.Email = auth.jwt()->>'email'
        ) OR auth.jwt()->>'email' IN (SELECT Email FROM Staff) -- Staff can see all
    );

CREATE POLICY "Authenticated users can create reservations" ON Reservation
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own reservations" ON Reservation
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM ReservationGuest rg
            JOIN Guest g ON rg.Guest_ID = g.Guest_ID
            WHERE rg.Reservation_ID = Reservation.Reservation_ID
            AND g.Email = auth.jwt()->>'email'
        ) OR auth.jwt()->>'email' IN (SELECT Email FROM Staff)
    );


-- 3. FIX RESERVATION GUEST POLICIES
-- Allow linking guests to reservations
CREATE POLICY "Users can link guests" ON ReservationGuest
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
CREATE POLICY "Users can view guest links" ON ReservationGuest
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM Guest g
            WHERE g.Guest_ID = ReservationGuest.Guest_ID
            AND g.Email = auth.jwt()->>'email'
        ) OR auth.jwt()->>'email' IN (SELECT Email FROM Staff)
    );


-- 4. FIX USER ACCOUNT POLICIES
-- Allow linking auth user to account
CREATE POLICY "Users can view own account" ON UserAccount
    FOR SELECT USING (auth.jwt()->>'email' = Email);

CREATE POLICY "Users can create own account" ON UserAccount
    FOR INSERT WITH CHECK (auth.jwt()->>'email' = Email);


-- 5. FIX PAYMENT POLICIES
CREATE POLICY "Users can view own payments" ON Payment
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM Reservation r
            JOIN ReservationGuest rg ON r.Reservation_ID = rg.Reservation_ID
            JOIN Guest g ON rg.Guest_ID = g.Guest_ID
            WHERE r.Reservation_ID = Payment.Reservation_ID
            AND g.Email = auth.jwt()->>'email'
        ) OR auth.jwt()->>'email' IN (SELECT Email FROM Staff)
    );

CREATE POLICY "Users can create payments" ON Payment
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
