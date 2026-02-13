-- ============================================================================
--  HOTEL RESERVATION SYSTEM — MIGRATION SCRIPT
--  DATAMA2 Finals Project — Group 1
--  Run AFTER you already have 01_schema.sql, 02_rls_policies.sql, 03_seed_data.sql
-- ============================================================================
--
--  HOW TO USE:
--    1. Go to Supabase Dashboard → SQL Editor
--    2. Paste this entire file and click "Run"
--    3. It only ADDs new constraints / columns — your existing data is safe
--    4. Safe to run multiple times (drops before re-adding)
-- ============================================================================


-- ============================================================================
-- 1. GUEST — stricter constraints
-- ============================================================================

ALTER TABLE guest DROP CONSTRAINT IF EXISTS guest_fname_not_empty;
ALTER TABLE guest DROP CONSTRAINT IF EXISTS guest_lname_not_empty;
ALTER TABLE guest DROP CONSTRAINT IF EXISTS guest_phone_not_empty;
ALTER TABLE guest DROP CONSTRAINT IF EXISTS guest_phone_format;
ALTER TABLE guest DROP CONSTRAINT IF EXISTS guest_name_alpha;

ALTER TABLE guest ADD CONSTRAINT guest_fname_not_empty
    CHECK (TRIM(first_name) <> '');

ALTER TABLE guest ADD CONSTRAINT guest_lname_not_empty
    CHECK (TRIM(last_name) <> '');

ALTER TABLE guest ADD CONSTRAINT guest_phone_not_empty
    CHECK (TRIM(phone) <> '');

ALTER TABLE guest ADD CONSTRAINT guest_phone_format
    CHECK (phone ~ '^[+]?[0-9][0-9\s\-]{6,19}$');

ALTER TABLE guest ADD CONSTRAINT guest_name_alpha
    CHECK (
        first_name ~* '^[A-Za-z\s\-''\.]+$'
        AND last_name ~* '^[A-Za-z\s\-''\.]+$'
    );


-- ============================================================================
-- 2. ROOM — restrict Status, make Floor NOT NULL
-- ============================================================================

UPDATE room SET floor = 1 WHERE floor IS NULL;
ALTER TABLE room ALTER COLUMN floor SET NOT NULL;

ALTER TABLE room DROP CONSTRAINT IF EXISTS room_status_check;
ALTER TABLE room DROP CONSTRAINT IF EXISTS room_number_format;

ALTER TABLE room ADD CONSTRAINT room_status_check
    CHECK (status IN ('Available', 'Occupied', 'Maintenance'));

ALTER TABLE room ADD CONSTRAINT room_number_format
    CHECK (TRIM(room_number) <> '');


-- ============================================================================
-- 3. STAFF — make Shift/Status NOT NULL, restrict values, add email format
-- ============================================================================

UPDATE staff SET shift  = 'Day'    WHERE shift  IS NULL;
UPDATE staff SET status = 'Active' WHERE status IS NULL;

ALTER TABLE staff ALTER COLUMN shift  SET NOT NULL;
ALTER TABLE staff ALTER COLUMN status SET NOT NULL;
ALTER TABLE staff ALTER COLUMN shift  SET DEFAULT 'Day';
ALTER TABLE staff ALTER COLUMN status SET DEFAULT 'Active';

ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_fname_not_empty;
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_lname_not_empty;
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_email_format;
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_shift_check;
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_status_check;
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;

-- Drop the original unnamed role CHECK from 01_schema.sql (Postgres names it "staff_check")
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_check;

ALTER TABLE staff ADD CONSTRAINT staff_fname_not_empty
    CHECK (TRIM(first_name) <> '');

ALTER TABLE staff ADD CONSTRAINT staff_lname_not_empty
    CHECK (TRIM(last_name) <> '');

ALTER TABLE staff ADD CONSTRAINT staff_email_format
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE staff ADD CONSTRAINT staff_shift_check
    CHECK (shift IN ('Day', 'Night', 'Rotating'));

ALTER TABLE staff ADD CONSTRAINT staff_status_check
    CHECK (status IN ('Active', 'Inactive', 'OnLeave'));

-- Only 4 roles: Manager, Housekeeping, Accountant, ReservationAgent
ALTER TABLE staff ADD CONSTRAINT staff_role_check
    CHECK (role IN ('Manager', 'Housekeeping', 'Accountant', 'ReservationAgent'));


-- ============================================================================
-- 4. RESERVATIONGUEST — restrict Guest_Type
-- ============================================================================

ALTER TABLE reservationguest DROP CONSTRAINT IF EXISTS guest_type_check;

ALTER TABLE reservationguest ADD CONSTRAINT guest_type_check
    CHECK (guest_type IN ('Primary', 'Additional'));


-- ============================================================================
-- 5. PAYMENT — restrict Status
-- ============================================================================

ALTER TABLE payment DROP CONSTRAINT IF EXISTS payment_status_check;

ALTER TABLE payment ADD CONSTRAINT payment_status_check
    CHECK (status IN ('Pending', 'Paid', 'Refunded'));


-- ============================================================================
-- 6. RESERVATIONLOG — restrict Action and Status values
-- ============================================================================

ALTER TABLE reservationlog DROP CONSTRAINT IF EXISTS log_action_check;
ALTER TABLE reservationlog DROP CONSTRAINT IF EXISTS log_prev_status_check;
ALTER TABLE reservationlog DROP CONSTRAINT IF EXISTS log_new_status_check;
ALTER TABLE reservationlog DROP CONSTRAINT IF EXISTS log_action_not_empty;

ALTER TABLE reservationlog ADD CONSTRAINT log_action_check
    CHECK (action IN ('Approved', 'Rejected', 'CheckedIn', 'CheckedOut', 'Cancelled'));

ALTER TABLE reservationlog ADD CONSTRAINT log_prev_status_check
    CHECK (previous_status IS NULL OR previous_status IN ('Pending', 'Booked', 'CheckedIn', 'CheckedOut', 'Cancelled'));

ALTER TABLE reservationlog ADD CONSTRAINT log_new_status_check
    CHECK (new_status IN ('Pending', 'Booked', 'CheckedIn', 'CheckedOut', 'Cancelled'));

ALTER TABLE reservationlog ADD CONSTRAINT log_action_not_empty
    CHECK (TRIM(action) <> '');


-- ============================================================================
-- 7. NEW INDEXES (skip if already exist)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_payment_res   ON payment(reservation_id);
CREATE INDEX IF NOT EXISTS idx_resguest_res  ON reservationguest(reservation_id);
CREATE INDEX IF NOT EXISTS idx_staff_status  ON staff(status);


-- ============================================================================
-- 8. STAFF — Add Is_Owner column (original manager protection)
-- ============================================================================

-- Add the column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'staff' AND column_name = 'is_owner'
    ) THEN
        ALTER TABLE staff ADD COLUMN is_owner BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- Mark the original manager as owner (manager@hotel.com)
UPDATE staff SET is_owner = TRUE WHERE email = 'manager@hotel.com' AND role = 'Manager';


-- ============================================================================
-- 9. RLS — Allow managers to update staff records
-- ============================================================================

-- Drop if it already exists (safe re-run)
DROP POLICY IF EXISTS "Managers can update staff" ON Staff;

CREATE POLICY "Managers can update staff" ON Staff
    FOR UPDATE TO authenticated
    USING (
        auth.jwt()->>'email' IN (
            SELECT email FROM Staff WHERE role = 'Manager'
        )
    )
    WITH CHECK (
        auth.jwt()->>'email' IN (
            SELECT email FROM Staff WHERE role = 'Manager'
        )
    );


-- ============================================================================
-- DONE
-- ============================================================================
SELECT '✅ Migration applied — all constraints added' AS status;
