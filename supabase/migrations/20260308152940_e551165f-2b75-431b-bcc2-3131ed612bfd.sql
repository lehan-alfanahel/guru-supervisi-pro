CREATE POLICY "School owners can view all teaching administration"
  ON public.teaching_administration
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id = teaching_administration.school_id
        AND schools.owner_id = auth.uid()
    )
  );