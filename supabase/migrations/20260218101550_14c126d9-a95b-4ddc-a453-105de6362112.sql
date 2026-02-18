-- Allow anyone to view basic employer profile info (for job listings)
CREATE POLICY "Anyone can view employer profiles for jobs"
ON public.profiles
FOR SELECT
USING (role = 'employer');