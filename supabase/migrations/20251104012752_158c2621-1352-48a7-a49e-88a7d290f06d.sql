-- Create table for teacher administration data
CREATE TABLE public.teaching_administration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  teacher_account_id UUID NOT NULL,
  
  -- Manual input fields
  teaching_hours TEXT,
  semester_class TEXT,
  
  -- Google Drive links for administration components
  calendar_link TEXT,
  annual_program_link TEXT,
  assessment_use_link TEXT,
  learning_flow_link TEXT,
  teaching_module_link TEXT,
  teaching_material_link TEXT,
  schedule_link TEXT,
  assessment_program_link TEXT,
  grade_list_link TEXT,
  daily_agenda_link TEXT,
  attendance_link TEXT,
  
  status TEXT DEFAULT 'submitted',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teaching_administration ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own administration data
CREATE POLICY "Teachers can view their own administration"
ON public.teaching_administration
FOR SELECT
USING (
  teacher_account_id IN (
    SELECT id FROM teacher_accounts WHERE user_id = auth.uid()
  )
);

-- Teachers can create their own administration data
CREATE POLICY "Teachers can create their own administration"
ON public.teaching_administration
FOR INSERT
WITH CHECK (
  teacher_account_id IN (
    SELECT id FROM teacher_accounts WHERE user_id = auth.uid()
  )
);

-- Teachers can update their own administration data
CREATE POLICY "Teachers can update their own administration"
ON public.teaching_administration
FOR UPDATE
USING (
  teacher_account_id IN (
    SELECT id FROM teacher_accounts WHERE user_id = auth.uid()
  )
);

-- Teachers can delete their own administration data
CREATE POLICY "Teachers can delete their own administration"
ON public.teaching_administration
FOR DELETE
USING (
  teacher_account_id IN (
    SELECT id FROM teacher_accounts WHERE user_id = auth.uid()
  )
);

-- School owners can view all administration data from their school
CREATE POLICY "School owners can view all administration"
ON public.teaching_administration
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM schools
    WHERE schools.id = teaching_administration.school_id
    AND schools.owner_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_teaching_administration_updated_at
BEFORE UPDATE ON public.teaching_administration
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();