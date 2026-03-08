
-- FIX 1: Drop the permissive WITH CHECK (true) INSERT policy on notifications.
-- SECURITY DEFINER triggers bypass RLS automatically — they do NOT need this policy.
DROP POLICY IF EXISTS "Allow insert for notification triggers" ON public.notifications;

-- FIX 2: Create a SECURITY DEFINER function to assign admin role on school creation.
-- This removes the circular dependency where a new user couldn't insert their own admin role.
CREATE OR REPLACE FUNCTION public.assign_admin_role_on_school_create()
RETURNS TRIGGER
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

-- FIX 2b: Create the trigger on schools AFTER INSERT
DROP TRIGGER IF EXISTS on_school_created_assign_admin ON public.schools;
CREATE TRIGGER on_school_created_assign_admin
  AFTER INSERT ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_role_on_school_create();
