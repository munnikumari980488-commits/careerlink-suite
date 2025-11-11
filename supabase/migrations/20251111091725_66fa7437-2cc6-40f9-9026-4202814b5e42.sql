-- Update the check constraint to match the application statuses used in code
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE applications ADD CONSTRAINT applications_status_check 
CHECK (status IN ('applied', 'shortlisted', 'assignment', 'technical_interview', 'hr_interview', 'verification', 'hired', 'rejected'));