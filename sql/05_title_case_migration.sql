-- ============================================================================
--  HOTEL RESERVATION SYSTEM — TITLE CASE CONSTRAINT
--  Run this on the LIVE Supabase database (SQL Editor → New Query → Run)
-- ============================================================================
--  Uses NOT VALID so it only applies to NEW inserts and updates,
--  without failing on existing rows.
-- ============================================================================

-- Drop old constraint
ALTER TABLE Guest DROP CONSTRAINT IF EXISTS guest_name_alpha;

-- Add Title Case constraint (NOT VALID = skip checking existing rows)
ALTER TABLE Guest ADD CONSTRAINT guest_name_alpha CHECK (
    First_Name ~ '^([A-Z][a-z''\.]+)([ \-][A-Z][a-z''\.]+)*$'
    AND Last_Name ~ '^([A-Z][a-z''\.]+)([ \-][A-Z][a-z''\.]+)*$'
) NOT VALID;

SELECT '✅ Title Case constraint applied (new rows only)' AS status;
