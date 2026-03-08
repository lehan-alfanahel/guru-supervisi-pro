-- Tabel modul_ajar_supervisions
CREATE TABLE public.modul_ajar_supervisions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  created_by uuid NOT NULL,
  supervision_date date NOT NULL DEFAULT CURRENT_DATE,
  kelas_semester text,
  mata_pelajaran text,
  notes text,
  tindak_lanjut text,
  m1 integer NOT NULL DEFAULT 0,
  m2 integer NOT NULL DEFAULT 0,
  m3 integer NOT NULL DEFAULT 0,
  m4 integer NOT NULL DEFAULT 0,
  m5 integer NOT NULL DEFAULT 0,
  m6 integer NOT NULL DEFAULT 0,
  m7 integer NOT NULL DEFAULT 0,
  m8 integer NOT NULL DEFAULT 0,
  m9 integer NOT NULL DEFAULT 0,
  m10 integer NOT NULL DEFAULT 0,
  m11 integer NOT NULL DEFAULT 0,
  m12 integer NOT NULL DEFAULT 0,
  m13 integer NOT NULL DEFAULT 0,
  m14 integer NOT NULL DEFAULT 0,
  m15 integer NOT NULL DEFAULT 0,
  m16 integer NOT NULL DEFAULT 0,
  m17 integer NOT NULL DEFAULT 0,
  m18 integer NOT NULL DEFAULT 0,
  m19 integer NOT NULL DEFAULT 0,
  m20 integer NOT NULL DEFAULT 0,
  m21 integer NOT NULL DEFAULT 0,
  m22 integer NOT NULL DEFAULT 0,
  m23 integer NOT NULL DEFAULT 0,
  m24 integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.modul_ajar_supervisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School owners can view modul ajar supervisions"
  ON public.modul_ajar_supervisions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.schools WHERE schools.id = modul_ajar_supervisions.school_id AND schools.owner_id = auth.uid()));

CREATE POLICY "School owners can create modul ajar supervisions"
  ON public.modul_ajar_supervisions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.schools WHERE schools.id = modul_ajar_supervisions.school_id AND schools.owner_id = auth.uid()) AND created_by = auth.uid());

CREATE POLICY "School owners can update modul ajar supervisions"
  ON public.modul_ajar_supervisions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.schools WHERE schools.id = modul_ajar_supervisions.school_id AND schools.owner_id = auth.uid()));

CREATE POLICY "School owners can delete modul ajar supervisions"
  ON public.modul_ajar_supervisions FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.schools WHERE schools.id = modul_ajar_supervisions.school_id AND schools.owner_id = auth.uid()));

CREATE POLICY "Teachers can view their own modul ajar supervisions"
  ON public.modul_ajar_supervisions FOR SELECT
  USING (teacher_id IN (SELECT ta.teacher_id FROM public.teacher_accounts ta WHERE ta.user_id = auth.uid()));

-- Trigger updated_at
CREATE TRIGGER update_modul_ajar_supervisions_updated_at
  BEFORE UPDATE ON public.modul_ajar_supervisions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notifikasi guru saat ada supervisi modul ajar baru
CREATE OR REPLACE FUNCTION public.notify_teacher_on_modul_ajar_supervision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id UUID;
BEGIN
  SELECT ta.user_id INTO v_user_id FROM public.teacher_accounts ta WHERE ta.teacher_id = NEW.teacher_id LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (v_user_id, 'modul_ajar_supervision', 'Supervisi Telaah Modul Ajar',
      'Kepala sekolah telah melakukan supervisi telaah modul ajar pada ' || TO_CHAR(NEW.supervision_date, 'DD Mon YYYY'), NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_modul_ajar_supervision
  AFTER INSERT ON public.modul_ajar_supervisions
  FOR EACH ROW EXECUTE FUNCTION public.notify_teacher_on_modul_ajar_supervision();