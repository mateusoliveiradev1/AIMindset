-- Create validation functions for user_profiles
-- =====================================================

-- Email validation function
CREATE OR REPLACE FUNCTION validate_email(email_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if email contains @ and has valid format
    RETURN email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Name validation function
CREATE OR REPLACE FUNCTION validate_name(name_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if name is not empty and has at least 2 characters
    RETURN name_input IS NOT NULL AND LENGTH(TRIM(name_input)) >= 2;
END;
$$ LANGUAGE plpgsql;

-- Add check constraints to user_profiles table
ALTER TABLE user_profiles 
ADD CONSTRAINT check_email_format 
CHECK (validate_email(email));

ALTER TABLE user_profiles 
ADD CONSTRAINT check_name_format 
CHECK (validate_name(name));