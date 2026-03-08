-- 1. Backfill role 'admin' untuk semua owner sekolah yang belum punya role
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT s.owner_id, 'admin'::public.app_role
FROM public.schools s
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = s.owner_id AND ur.role = 'admin'
);

-- 2. Pastikan trigger function sudah ada dan benar
CREATE OR REPLACE FUNCTION public.assign_admin_role_on_school_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.owner_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. Buat trigger pada tabel schools
DROP TRIGGER IF EXISTS on_school_created_assign_admin_role ON public.schools;

CREATE TRIGGER on_school_created_assign_admin_role
  AFTER INSERT ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_role_on_school_create();