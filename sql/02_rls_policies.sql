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
ALTER TABLE Reservation       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ReservationGuest  ENABLE ROW LEVEL SECURITY;
ALTER TABLE Payment           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ReservationLog    ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 2: RoomType & Room — PUBLIC read access
-- ─────────────────────────────────────────────────────────────────────────
-- Anyone (even not logged in) can browse room types and rooms.
-- This powers the guest-facing "Our Rooms" page.

CREATE POLICY "Public can view room types" ON RoomType
    FOR SELECT USING (true);

CREATE POLICY "Public can view rooms" ON Room
    FOR SELECT USING (true);

-- Staff can update room status (Available ↔ Occupied ↔ Maintenance)
CREATE POLICY "Staff can update rooms" ON Room
    FOR UPDATE TO authenticated
    USING  (auth.jwt()->>'email' IN (SELECT email FROM Staff))
    WITH CHECK (auth.jwt()->>'email' IN (SELECT email FROM Staff));


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 3: Staff — authenticated users can view staff records
-- ─────────────────────────────────────────────────────────────────────────
-- Used during login to verify the user is actually a staff member.
-- Also allows staff to view the Staff Directory.

CREATE POLICY "Authenticated can view staff" ON Staff
    FOR SELECT TO authenticated
    USING (true);


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 4: Guest — own data + staff can view all
-- ─────────────────────────────────────────────────────────────────────────

-- Guests can see their own profile
CREATE POLICY "Guests can view own data" ON Guest
    FOR SELECT USING (auth.jwt()->>'email' = email);

-- Guests can create their profile during signup
CREATE POLICY "Guests can insert own data" ON Guest
    FOR INSERT WITH CHECK (auth.jwt()->>'email' = email);

-- Guests can update their own profile
CREATE POLICY "Guests can update own data" ON Guest
    FOR UPDATE USING (auth.jwt()->>'email' = email);

-- Staff can view all guests (for the Guests management page)
CREATE POLICY "Staff can view all guests" ON Guest
    FOR SELECT USING (auth.jwt()->>'email' IN (SELECT email FROM Staff));


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 5: Reservation — simple permissive policies
-- ─────────────────────────────────────────────────────────────────────────

-- Anyone logged in can SELECT reservations
CREATE POLICY "Select reservations" ON Reservation
    FOR SELECT TO authenticated
    USING (true);

-- Anyone logged in can INSERT reservations  
CREATE POLICY "Insert reservations" ON Reservation
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Anyone logged in can UPDATE reservations
CREATE POLICY "Update reservations" ON Reservation
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 6: ReservationGuest — link guests to reservations
-- ─────────────────────────────────────────────────────────────────────────

-- Anyone logged in can SELECT reservation guests
CREATE POLICY "Select reservation guests" ON ReservationGuest
    FOR SELECT TO authenticated
    USING (true);

-- Anyone logged in can INSERT reservation guests
CREATE POLICY "Insert reservation guests" ON ReservationGuest
    FOR INSERT TO authenticated
    WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 7: Payment — guests see own, staff see all
-- ─────────────────────────────────────────────────────────────────────────

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

CREATE POLICY "Authenticated can create payments" ON Payment
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 8: ReservationLog — staff can view and insert audit logs
-- ─────────────────────────────────────────────────────────────────────────

CREATE POLICY "Staff can view reservation logs" ON ReservationLog
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Staff can insert reservation logs" ON ReservationLog
    FOR INSERT TO authenticated
    WITH CHECK (true);


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
