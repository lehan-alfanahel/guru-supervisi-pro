-- Allow teachers to view their own school through the teacher_accounts relationship
CREATE POLICY "Teachers can view their own school"
ON public.schools
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.teacher_accounts ta
    JOIN public.teachers t ON ta.teacher_id = t.id
    WHERE ta.user_id = auth.uid()
      AND t.school_id = schools.id
  )
);

-- Allow teachers to view their own teacher record
CREATE POLICY "Teachers can view their own teacher record"
ON public.teachers
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT teacher_id
    FROM public.teacher_accounts
    WHERE user_id = auth.uid()
  )
);

-- Allow teachers to view their own teacher account record
CREATE POLICY "Teachers can view their own teacher account"
ON public.teacher_accounts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());