-- ============================================================================
--  HOTEL RESERVATION SYSTEM — ROW LEVEL SECURITY (RLS) POLICIES
--  Run this AFTER 01_schema.sql
-- ============================================================================
--  Supabase uses RLS to control who can read/write each table.
--  Without these policies, the tables would be invisible to the app.
--
--  KEY CONCEPTS:
--    • anon        → unauthenticated visitor (browsing rooms)
--    • authenticated → logged-in user (guest or staff)
--    • auth.jwt()->>'email' → the email of the currently logged-in user
--    • auth.role()  → 'anon' or 'authenticated'
--
--  We use DROP POLICY IF EXISTS so this script is safe to re-run.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 1: Enable RLS on every table
-- ─────────────────────────────────────────────────────────────────────────
-- When RLS is enabled, no data is returned unless a policy explicitly
-- allows it. This is Supabase's security model.

ALTER TABLE Guest             ENABLE ROW LEVEL SECURITY;
ALTER TABLE RoomType          ENABLE ROW LEVEL SECURITY;
ALTER TABLE Room              ENABLE ROW LEVEL SECURITY;
ALTER TABLE Staff             ENABLE ROW LEVEL SECURITY;
ALTER TABLE UserAccount       ENABLE ROW LEVEL SECURITY;
ALTER TABLE Reservation       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ReservationGuest  ENABLE ROW LEVEL SECURITY;
ALTER TABLE Payment           ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 2: RoomType & Room — PUBLIC read access
-- ─────────────────────────────────────────────────────────────────────────
-- Anyone (even not logged in) can browse room types and rooms.
-- This powers the guest-facing "Our Rooms" page.

DROP POLICY IF EXISTS "Public can view room types" ON RoomType;
CREATE POLICY "Public can view room types" ON RoomType
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view rooms" ON Room;
CREATE POLICY "Public can view rooms" ON Room
    FOR SELECT USING (true);

-- Staff can update room status (Available ↔ Occupied ↔ Maintenance)
DROP POLICY IF EXISTS "Staff can update rooms" ON Room;
CREATE POLICY "Staff can update rooms" ON Room
    FOR UPDATE TO authenticated
    USING  (auth.jwt()->>'email' IN (SELECT email FROM Staff))
    WITH CHECK (auth.jwt()->>'email' IN (SELECT email FROM Staff));


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 3: Staff — authenticated staff can read own record
-- ─────────────────────────────────────────────────────────────────────────
-- Used during login to verify the user is actually a staff member.

DROP POLICY IF EXISTS "Staff can view own record" ON Staff;
CREATE POLICY "Staff can view own record" ON Staff
    FOR SELECT TO authenticated
    USING (auth.jwt()->>'email' = email);


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 4: Guest — own data + staff can view all
-- ─────────────────────────────────────────────────────────────────────────

-- Guests can see their own profile
DROP POLICY IF EXISTS "Guests can view own data" ON Guest;
CREATE POLICY "Guests can view own data" ON Guest
    FOR SELECT USING (auth.jwt()->>'email' = email);

-- Guests can create their profile during signup
DROP POLICY IF EXISTS "Guests can insert own data" ON Guest;
CREATE POLICY "Guests can insert own data" ON Guest
    FOR INSERT WITH CHECK (auth.jwt()->>'email' = email);

-- Guests can update their own profile
DROP POLICY IF EXISTS "Guests can update own data" ON Guest;
CREATE POLICY "Guests can update own data" ON Guest
    FOR UPDATE USING (auth.jwt()->>'email' = email);

-- Staff can view all guests (for the Guests management page)
DROP POLICY IF EXISTS "Staff can view all guests" ON Guest;
CREATE POLICY "Staff can view all guests" ON Guest
    FOR SELECT USING (auth.jwt()->>'email' IN (SELECT email FROM Staff));


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 5: Reservation — guests see own, staff see all
-- ─────────────────────────────────────────────────────────────────────────

-- SELECT: guests see their reservations, staff see everything
DROP POLICY IF EXISTS "View own or staff reservations" ON Reservation;
CREATE POLICY "View own or staff reservations" ON Reservation
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ReservationGuest rg
            JOIN Guest g ON rg.guest_id = g.guest_id
            WHERE rg.reservation_id = Reservation.reservation_id
              AND g.email = auth.jwt()->>'email'
        )
        OR auth.jwt()->>'email' IN (SELECT email FROM Staff)
    );

-- INSERT: any logged-in user can create a reservation
DROP POLICY IF EXISTS "Authenticated users can create reservations" ON Reservation;
CREATE POLICY "Authenticated users can create reservations" ON Reservation
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: staff can change status (Pending → Booked, etc.)
DROP POLICY IF EXISTS "Staff can update reservations" ON Reservation;
CREATE POLICY "Staff can update reservations" ON Reservation
    FOR UPDATE TO authenticated
    USING  (auth.jwt()->>'email' IN (SELECT email FROM Staff))
    WITH CHECK (auth.jwt()->>'email' IN (SELECT email FROM Staff));


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 6: ReservationGuest — link guests to reservations
-- ─────────────────────────────────────────────────────────────────────────

-- Any authenticated user can link a guest during booking
DROP POLICY IF EXISTS "Authenticated can link guests" ON ReservationGuest;
CREATE POLICY "Authenticated can link guests" ON ReservationGuest
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Guests see their own links, staff see all
DROP POLICY IF EXISTS "View own or staff guest links" ON ReservationGuest;
CREATE POLICY "View own or staff guest links" ON ReservationGuest
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM Guest g
            WHERE g.guest_id = ReservationGuest.guest_id
              AND g.email = auth.jwt()->>'email'
        )
        OR auth.jwt()->>'email' IN (SELECT email FROM Staff)
    );


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 7: UserAccount — own account only
-- ─────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view own account" ON UserAccount;
CREATE POLICY "Users can view own account" ON UserAccount
    FOR SELECT USING (auth.jwt()->>'email' = email);

DROP POLICY IF EXISTS "Users can create own account" ON UserAccount;
CREATE POLICY "Users can create own account" ON UserAccount
    FOR INSERT WITH CHECK (auth.jwt()->>'email' = email);


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 8: Payment — guests see own, staff see all
-- ─────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "View own or staff payments" ON Payment;
CREATE POLICY "View own or staff payments" ON Payment
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM Reservation r
            JOIN ReservationGuest rg ON r.reservation_id = rg.reservation_id
            JOIN Guest g ON rg.guest_id = g.guest_id
            WHERE r.reservation_id = Payment.reservation_id
              AND g.email = auth.jwt()->>'email'
        )
        OR auth.jwt()->>'email' IN (SELECT email FROM Staff)
    );

DROP POLICY IF EXISTS "Authenticated can create payments" ON Payment;
CREATE POLICY "Authenticated can create payments" ON Payment
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 9: Enable Supabase Realtime on key tables
-- ─────────────────────────────────────────────────────────────────────────
-- This lets the front-end receive live updates when room status
-- or reservation status changes (no page refresh needed).

ALTER PUBLICATION supabase_realtime ADD TABLE room;
ALTER PUBLICATION supabase_realtime ADD TABLE reservation;


-- ─────────────────────────────────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────────────────────────────────
SELECT '✅ RLS policies applied successfully' AS status;
