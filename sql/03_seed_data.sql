-- ============================================================================
--  HOTEL RESERVATION SYSTEM — SEED DATA
--  Run this AFTER 01_schema.sql and 02_rls_policies.sql
-- ============================================================================
--  Inserts demo data so the app has something to display.
--  Safe to skip in production — only needed for testing/demo.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────
-- Room Types (6 categories)
-- ─────────────────────────────────────────────────────────────────────────

INSERT INTO RoomType (Type_Name, Base_Rate, Description, Max_Occupancy) VALUES
    ('Single',   2500.00, 'Cozy room with single bed',              1),
    ('Double',   3500.00, 'Comfortable room with double bed',       2),
    ('Deluxe',   5000.00, 'Spacious room with premium amenities',   2),
    ('Suite',    8000.00, 'Luxury suite with separate living area',  4),
    ('Family',   6500.00, 'Large room ideal for families',           5),
    ('Economy',  1800.00, 'Budget-friendly accommodation',           2);


-- ─────────────────────────────────────────────────────────────────────────
-- Rooms (8 rooms across 6 floors)
-- ─────────────────────────────────────────────────────────────────────────

INSERT INTO Room (Room_Number, RoomType_ID, Status, Floor) VALUES
    ('101', 1, 'Available',   1),   -- Single
    ('102', 1, 'Available',   1),   -- Single
    ('201', 2, 'Available',   2),   -- Double
    ('202', 2, 'Maintenance', 2),   -- Double (under maintenance)
    ('301', 3, 'Available',   3),   -- Deluxe
    ('401', 4, 'Available',   4),   -- Suite
    ('501', 5, 'Available',   5),   -- Family
    ('601', 6, 'Available',   6);   -- Economy


-- ─────────────────────────────────────────────────────────────────────────
-- Staff (4 demo employees)
-- ─────────────────────────────────────────────────────────────────────────
-- NOTE: Each staff email must ALSO be registered in Supabase Auth
--       (Authentication → Users → Add User) for login to work.
--
--   Demo credentials:
--     housekeeping@hotel.com   / house123
--     accountant@hotel.com     / accountant123
--     manager@hotel.com        / manager123
--     reservation@hotel.com    / reservation123
--
--   Role-based access:
--     Housekeeping      → Rooms only
--     Accountant        → Dashboard only
--     Manager           → Full access (all pages)
--     ReservationAgent  → Dashboard, Reservations

INSERT INTO Staff (First_Name, Last_Name, Email, Role, Shift, Is_Owner) VALUES
    ('Diego', 'Cruz',   'housekeeping@hotel.com',  'Housekeeping',     'Day', FALSE),
    ('Ivy',   'Lopez',  'accountant@hotel.com',    'Accountant',       'Day', FALSE),
    ('Leah',  'Garcia', 'manager@hotel.com',       'Manager',          'Day', TRUE),
    ('Mark',  'Santos', 'reservation@hotel.com',   'ReservationAgent', 'Day', FALSE);


-- ─────────────────────────────────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────────────────────────────────
SELECT '✅ Seed data inserted successfully' AS status;
