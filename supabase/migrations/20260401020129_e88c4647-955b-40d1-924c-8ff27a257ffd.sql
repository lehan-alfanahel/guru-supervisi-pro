ALTER TABLE public.modul_ajar_supervisions
  ADD CONSTRAINT modul_ajar_supervisions_school_id_fkey
    FOREIGN KEY (school_id) REFERENCES public.schools(id),
  ADD CONSTRAINT modul_ajar_supervisions_teacher_id_fkey
    FOREIGN KEY (teacher_id) REFERENCES public.teachers(id);