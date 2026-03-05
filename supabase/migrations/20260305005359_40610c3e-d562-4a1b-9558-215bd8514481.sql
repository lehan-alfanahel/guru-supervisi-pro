
-- Create coaching_sessions table
CREATE TABLE public.coaching_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  coaching_date DATE NOT NULL DEFAULT CURRENT_DATE,
  topic TEXT NOT NULL,
  findings TEXT,
  recommendations TEXT,
  follow_up TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT coaching_sessions_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE,
  CONSTRAINT coaching_sessions_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;

-- Admin (school owner) can view all coaching sessions in their school
CREATE POLICY "School owners can view coaching sessions"
  ON public.coaching_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.schools
    WHERE schools.id = coaching_sessions.school_id
    AND schools.owner_id = auth.uid()
  ));

-- Admin can create coaching sessions
CREATE POLICY "School owners can create coaching sessions"
  ON public.coaching_sessions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.schools
    WHERE schools.id = coaching_sessions.school_id
    AND schools.owner_id = auth.uid()
  ) AND created_by = auth.uid());

-- Admin can update coaching sessions
CREATE POLICY "School owners can update coaching sessions"
  ON public.coaching_sessions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.schools
    WHERE schools.id = coaching_sessions.school_id
    AND schools.owner_id = auth.uid()
  ));

-- Admin can delete coaching sessions
CREATE POLICY "School owners can delete coaching sessions"
  ON public.coaching_sessions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.schools
    WHERE schools.id = coaching_sessions.school_id
    AND schools.owner_id = auth.uid()
  ));

-- Teachers can view their own coaching sessions
CREATE POLICY "Teachers can view their coaching sessions"
  ON public.coaching_sessions FOR SELECT
  USING (teacher_id IN (
    SELECT ta.teacher_id FROM public.teacher_accounts ta
    WHERE ta.user_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_coaching_sessions_updated_at
  BEFORE UPDATE ON public.coaching_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
