-- Add gender and address columns to teachers table
ALTER TABLE public.teachers 
ADD COLUMN gender TEXT CHECK (gender IN ('Laki-Laki', 'Perempuan')),
ADD COLUMN address TEXT;

-- Create teacher_accounts table to link teachers with auth users
CREATE TABLE public.teacher_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id)
);

-- Enable RLS on teacher_accounts
ALTER TABLE public.teacher_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for teacher_accounts
CREATE POLICY "Users can view teacher accounts from their school"
ON public.teacher_accounts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teachers t
    JOIN public.schools s ON t.school_id = s.id
    WHERE t.id = teacher_accounts.teacher_id
    AND s.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create teacher accounts for their school"
ON public.teacher_accounts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teachers t
    JOIN public.schools s ON t.school_id = s.id
    WHERE t.id = teacher_accounts.teacher_id
    AND s.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update teacher accounts from their school"
ON public.teacher_accounts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.teachers t
    JOIN public.schools s ON t.school_id = s.id
    WHERE t.id = teacher_accounts.teacher_id
    AND s.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete teacher accounts from their school"
ON public.teacher_accounts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.teachers t
    JOIN public.schools s ON t.school_id = s.id
    WHERE t.id = teacher_accounts.teacher_id
    AND s.owner_id = auth.uid()
  )
);

-- Add trigger for teacher_accounts updated_at
CREATE TRIGGER update_teacher_accounts_updated_at
BEFORE UPDATE ON public.teacher_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();