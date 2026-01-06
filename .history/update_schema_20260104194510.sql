-- Add status column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'status') THEN
        ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive'));
    END IF;
END $$;

-- Update existing users to have Active status if null
UPDATE users SET status = 'Active' WHERE status IS NULL;
