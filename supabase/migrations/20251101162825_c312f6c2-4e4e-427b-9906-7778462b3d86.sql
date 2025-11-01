-- Create enum for teacher ranks
CREATE TYPE public.teacher_rank AS ENUM ('III.A', 'III.B', 'III.C', 'III.D', 'IV.A', 'IV.B', 'IV.C', 'IV.D', 'IX');

-- Create enum for employment types
CREATE TYPE public.employment_type AS ENUM ('PNS', 'PPPK', 'Guru Honorer');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin');

-- Create schools table
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  npsn TEXT,
  address TEXT,
  phone TEXT,
  principal_name TEXT NOT NULL,
  principal_nip TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(owner_id)
);

-- Enable RLS on schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Schools policies
CREATE POLICY "Users can view their own school"
  ON public.schools FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own school"
  ON public.schools FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own school"
  ON public.schools FOR UPDATE
  USING (auth.uid() = owner_id);

-- Create teachers table
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nip TEXT NOT NULL,
  rank teacher_rank NOT NULL,
  employment_type employment_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on teachers
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Teachers policies: users can only access teachers from their own school
CREATE POLICY "Users can view teachers from their school"
  ON public.teachers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id = teachers.school_id
      AND schools.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create teachers for their school"
  ON public.teachers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id = teachers.school_id
      AND schools.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update teachers from their school"
  ON public.teachers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id = teachers.school_id
      AND schools.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete teachers from their school"
  ON public.teachers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id = teachers.school_id
      AND schools.owner_id = auth.uid()
    )
  );

-- Create supervisions table
CREATE TABLE public.supervisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  supervision_date DATE NOT NULL DEFAULT CURRENT_DATE,
  lesson_plan BOOLEAN DEFAULT false,
  syllabus BOOLEAN DEFAULT false,
  assessment_tools BOOLEAN DEFAULT false,
  teaching_materials BOOLEAN DEFAULT false,
  student_attendance BOOLEAN DEFAULT false,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on supervisions
ALTER TABLE public.supervisions ENABLE ROW LEVEL SECURITY;

-- Supervisions policies
CREATE POLICY "Users can view supervisions from their school"
  ON public.supervisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id = supervisions.school_id
      AND schools.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create supervisions for their school"
  ON public.supervisions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id = supervisions.school_id
      AND schools.owner_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update supervisions from their school"
  ON public.supervisions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id = supervisions.school_id
      AND schools.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete supervisions from their school"
  ON public.supervisions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id = supervisions.school_id
      AND schools.owner_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supervisions_updated_at
  BEFORE UPDATE ON public.supervisions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();