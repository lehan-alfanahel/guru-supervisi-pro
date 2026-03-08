
-- Create supervision_observations table for detailed classroom observation instrument
CREATE TABLE public.supervision_observations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  created_by uuid NOT NULL,
  observation_date date NOT NULL DEFAULT CURRENT_DATE,
  mata_pelajaran text,
  materi_topik text,
  scores jsonb NOT NULL DEFAULT '{}',
  notes text,
  tindak_lanjut text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT supervision_observations_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT supervision_observations_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id)
);

-- Enable RLS
ALTER TABLE public.supervision_observations ENABLE ROW LEVEL SECURITY;

-- Principal can create observations
CREATE POLICY "School owners can create observations"
  ON public.supervision_observations FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.schools WHERE schools.id = supervision_observations.school_id AND schools.owner_id = auth.uid())
    AND created_by = auth.uid()
  );

-- Principal can view observations
CREATE POLICY "School owners can view observations"
  ON public.supervision_observations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.schools WHERE schools.id = supervision_observations.school_id AND schools.owner_id = auth.uid())
  );

-- Principal can update observations
CREATE POLICY "School owners can update observations"
  ON public.supervision_observations FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.schools WHERE schools.id = supervision_observations.school_id AND schools.owner_id = auth.uid())
  );

-- Principal can delete observations
CREATE POLICY "School owners can delete observations"
  ON public.supervision_observations FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.schools WHERE schools.id = supervision_observations.school_id AND schools.owner_id = auth.uid())
  );

-- Teachers can view their own observations
CREATE POLICY "Teachers can view their own observations"
  ON public.supervision_observations FOR SELECT
  USING (
    teacher_id IN (SELECT ta.teacher_id FROM public.teacher_accounts ta WHERE ta.user_id = auth.uid())
  );

-- Trigger for updated_at
CREATE TRIGGER update_supervision_observations_updated_at
  BEFORE UPDATE ON public.supervision_observations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notify teacher on new observation
CREATE OR REPLACE FUNCTION public.notify_teacher_on_observation()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT ta.user_id INTO v_user_id
  FROM public.teacher_accounts ta
  WHERE ta.teacher_id = NEW.teacher_id
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      v_user_id,
      'observation',
      'Hasil Observasi Supervisi',
      'Kepala sekolah telah mengisi instrumen supervisi pelaksanaan pembelajaran pada ' || TO_CHAR(NEW.observation_date, 'DD Mon YYYY'),
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_new_observation
  AFTER INSERT ON public.supervision_observations
  FOR EACH ROW EXECUTE FUNCTION public.notify_teacher_on_observation();
