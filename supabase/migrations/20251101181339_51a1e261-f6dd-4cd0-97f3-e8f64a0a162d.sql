-- Add email column to teachers table
ALTER TABLE public.teachers 
ADD COLUMN email text;

-- Add comment for clarity
COMMENT ON COLUMN public.teachers.email IS 'Teacher email address';