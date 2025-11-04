-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Teachers can view their own school" ON public.schools;
DROP POLICY IF EXISTS "Teachers can view their own teacher record" ON public.teachers;
DROP POLICY IF EXISTS "Teachers can view their own teacher account" ON public.teacher_accounts;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_teacher_school_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.school_id
  FROM public.teacher_accounts ta
  JOIN public.teachers t ON ta.teacher_id = t.id
  WHERE ta.user_id = _user_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_account(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teacher_accounts
    WHERE user_id = _user_id
  );
$$;

-- Recreate policies using security definer functions
CREATE POLICY "Teachers can view their own school"
ON public.schools
FOR SELECT
TO authenticated
USING (
  id = public.get_teacher_school_id(auth.uid())
  OR owner_id = auth.uid()
);

CREATE POLICY "Teachers can view their own teacher record"
ON public.teachers
FOR SELECT
TO authenticated
USING (
  school_id = public.get_teacher_school_id(auth.uid())
  OR school_id IN (
    SELECT id FROM public.schools WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Teachers can view their own teacher account"
ON public.teacher_accounts
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);