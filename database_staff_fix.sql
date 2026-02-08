
CREATE POLICY "Enable read access for own staff record" ON Staff
    FOR SELECT
    TO authenticated
    USING (auth.jwt()->>'email' = Email);


