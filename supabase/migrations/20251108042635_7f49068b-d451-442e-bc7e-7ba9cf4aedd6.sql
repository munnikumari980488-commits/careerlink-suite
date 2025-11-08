-- Add assignment fields to applications table
ALTER TABLE applications 
ADD COLUMN assignment_name text,
ADD COLUMN assignment_link text;