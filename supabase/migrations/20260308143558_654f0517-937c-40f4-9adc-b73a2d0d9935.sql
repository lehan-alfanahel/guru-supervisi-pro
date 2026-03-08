
CREATE TABLE public.atp_supervisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  created_by UUID NOT NULL,
  supervision_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mata_pelajaran TEXT,
  kelas_semester TEXT,
  notes TEXT,
  tindak_lanjut TEXT,
  a1 INTEGER NOT NULL DEFAULT 0,
  b2 INTEGER NOT NULL DEFAULT 0,
  b3 INTEGER NOT NULL DEFAULT 0,
  b4 INTEGER NOT NULL DEFAULT 0,
  c5 INTEGER NOT NULL DEFAULT 0,
  c6 INTEGER NOT NULL DEFAULT 0,
  c7 INTEGER NOT NULL DEFAULT 0,
  d8 INTEGER NOT NULL DEFAULT 0,
  d9 INTEGER NOT NULL DEFAULT 0,
  d10 INTEGER NOT NULL DEFAULT 0,
  d11 INTEGER NOT NULL DEFAULT 0,
  d12 INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT atp_supervisions_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT atp_supervisions_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id)
);

ALTER TABLE public.atp_supervisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School owners can create ATP supervisions"
  ON public.atp_supervisions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.schools WHERE id = atp_supervisions.school_id AND owner_id = auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "School owners can view ATP supervisions"
  ON public.atp_supervisions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.schools WHERE id = atp_supervisions.school_id AND owner_id = auth.uid()));

CREATE POLICY "School owners can update ATP supervisions"
  ON public.atp_supervisions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.schools WHERE id = atp_supervisions.school_id AND owner_id = auth.uid()));

CREATE POLICY "School owners can delete ATP supervisions"
  ON public.atp_supervisions FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.schools WHERE id = atp_supervisions.school_id AND owner_id = auth.uid()));

CREATE POLICY "Teachers can view their own ATP supervisions"
  ON public.atp_supervisions FOR SELECT
  USING (teacher_id IN (
    SELECT ta.teacher_id FROM public.teacher_accounts ta WHERE ta.user_id = auth.uid()
  ));

CREATE TRIGGER update_atp_supervisions_updated_at
  BEFORE UPDATE ON public.atp_supervisions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.notify_teacher_on_atp_supervision()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id UUID;
BEGIN
  SELECT ta.user_id INTO v_user_id FROM public.teacher_accounts ta WHERE ta.teacher_id = NEW.teacher_id LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (v_user_id, 'atp_supervision', 'Supervisi ATP Baru',
      'Kepala sekolah telah melakukan supervisi penelaahan ATP pada ' || TO_CHAR(NEW.supervision_date, 'DD Mon YYYY'), NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_teacher_atp_supervision
  AFTER INSERT ON public.atp_supervisions
  FOR EACH ROW EXECUTE FUNCTION public.notify_teacher_on_atp_supervision();
