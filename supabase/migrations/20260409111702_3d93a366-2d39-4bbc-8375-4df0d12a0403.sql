
CREATE POLICY "Teachers can update their own teacher record"
ON public.teachers
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT ta.teacher_id
    FROM public.teacher_accounts ta
    WHERE ta.user_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT ta.teacher_id
    FROM public.teacher_accounts ta
    WHERE ta.user_id = auth.uid()
  )
);
