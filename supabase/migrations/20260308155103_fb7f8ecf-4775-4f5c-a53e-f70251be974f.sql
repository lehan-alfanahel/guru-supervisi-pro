
-- Function: notify school owner when teacher submits teaching administration
CREATE OR REPLACE FUNCTION public.notify_admin_on_teaching_administration()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_owner_id UUID;
  v_teacher_name TEXT;
BEGIN
  SELECT s.owner_id INTO v_owner_id
  FROM public.schools s
  WHERE s.id = NEW.school_id
  LIMIT 1;

  SELECT t.name INTO v_teacher_name
  FROM public.teachers t
  WHERE t.id = NEW.teacher_id
  LIMIT 1;

  IF v_owner_id IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        v_owner_id,
        'administration',
        'Instrumen Administrasi Baru',
        COALESCE(v_teacher_name, 'Guru') || ' telah mengisi instrumen administrasi pembelajaran',
        NEW.id
      );
    ELSIF TG_OP = 'UPDATE' THEN
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        v_owner_id,
        'administration_update',
        'Instrumen Administrasi Diperbarui',
        COALESCE(v_teacher_name, 'Guru') || ' telah memperbarui instrumen administrasi pembelajaran',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_admin_on_teaching_administration_insert
  AFTER INSERT ON public.teaching_administration
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_teaching_administration();

CREATE TRIGGER notify_admin_on_teaching_administration_update
  AFTER UPDATE ON public.teaching_administration
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_teaching_administration();
