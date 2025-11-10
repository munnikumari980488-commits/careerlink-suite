-- Allow employers to view candidate profiles for their job applications
CREATE POLICY "Employers can view candidate profiles for their jobs"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j ON j.id = a.job_id
    WHERE a.candidate_id = profiles.id
    AND j.employer_id = auth.uid()
  )
);