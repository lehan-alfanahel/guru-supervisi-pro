import { supabase } from "@/integrations/supabase/client";
import { getUserFriendlyError } from "./errorHandler";

export type TeacherRank = 'Tidak Ada' | 'III.A' | 'III.B' | 'III.C' | 'III.D' | 'IV.A' | 'IV.B' | 'IV.C' | 'IV.D' | 'IX';
export type EmploymentType = 'PNS' | 'PPPK' | 'Guru Honorer';

export interface School {
  id: string;
  owner_id: string;
  name: string;
  npsn?: string;
  address?: string;
  phone?: string;
  principal_name: string;
  principal_nip: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  school_id: string;
  name: string;
  nip: string;
  email: string;
  rank: TeacherRank;
  employment_type: EmploymentType;
  created_at: string;
  updated_at: string;
}

export interface Supervision {
  id: string;
  school_id: string;
  teacher_id: string;
  supervision_date: string;
  lesson_plan: boolean;
  syllabus: boolean;
  assessment_tools: boolean;
  teaching_materials: boolean;
  student_attendance: boolean;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// School operations
export async function getSchool(userId: string) {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle();
  
  if (error) throw new Error(getUserFriendlyError(error));
  return data as School | null;
}

export async function createSchool(schoolData: Omit<School, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('schools')
    .insert(schoolData)
    .select()
    .single();
  
  if (error) throw new Error(getUserFriendlyError(error));
  return data as School;
}

export async function updateSchool(id: string, updates: Partial<School>) {
  const { data, error } = await supabase
    .from('schools')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw new Error(getUserFriendlyError(error));
  return data as School;
}

// Teacher operations
export async function getTeachers(schoolId: string) {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });
  
  if (error) throw new Error(getUserFriendlyError(error));
  return data as Teacher[];
}

export async function createTeacher(teacherData: Omit<Teacher, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('teachers')
    .insert(teacherData)
    .select()
    .single();
  
  if (error) throw new Error(getUserFriendlyError(error));
  return data as Teacher;
}

export async function updateTeacher(id: string, updates: Partial<Teacher>) {
  const { data, error } = await supabase
    .from('teachers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw new Error(getUserFriendlyError(error));
  return data as Teacher;
}

export async function deleteTeacher(id: string) {
  const { error } = await supabase
    .from('teachers')
    .delete()
    .eq('id', id);
  
  if (error) throw new Error(getUserFriendlyError(error));
}

// Supervision operations
export async function getSupervisions(schoolId: string) {
  const { data, error } = await supabase
    .from('supervisions')
    .select(`
      *,
      teachers (
        name,
        nip
      )
    `)
    .eq('school_id', schoolId)
    .order('supervision_date', { ascending: false });
  
  if (error) throw new Error(getUserFriendlyError(error));
  return data;
}

export async function createSupervision(supervisionData: Omit<Supervision, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('supervisions')
    .insert(supervisionData)
    .select()
    .single();
  
  if (error) throw new Error(getUserFriendlyError(error));
  return data as Supervision;
}

export async function updateSupervision(id: string, updates: Partial<Supervision>) {
  const { data, error } = await supabase
    .from('supervisions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw new Error(getUserFriendlyError(error));
  return data as Supervision;
}

export async function deleteSupervision(id: string) {
  const { error } = await supabase
    .from('supervisions')
    .delete()
    .eq('id', id);
  
  if (error) throw new Error(getUserFriendlyError(error));
}
