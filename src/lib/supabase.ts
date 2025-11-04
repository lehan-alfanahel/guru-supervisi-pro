import { supabase } from "@/integrations/supabase/client";
import { getUserFriendlyError } from "./errorHandler";

export type TeacherRank = 'Tidak Ada' | 'III.A' | 'III.B' | 'III.C' | 'III.D' | 'IV.A' | 'IV.B' | 'IV.C' | 'IV.D' | 'IX';
export type EmploymentType = 'PNS' | 'PPPK' | 'Guru Honorer';
export type Gender = 'Laki-Laki' | 'Perempuan';

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
  gender?: Gender;
  rank: TeacherRank;
  employment_type: EmploymentType;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherAccount {
  id: string;
  teacher_id: string;
  user_id: string;
  email: string;
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

// Teacher Account operations
export async function getTeacherAccounts(schoolId: string) {
  const { data, error } = await supabase
    .from('teacher_accounts')
    .select(`
      *,
      teachers (
        id,
        name,
        nip
      )
    `)
    .eq('teachers.school_id', schoolId)
    .order('created_at', { ascending: false });
  
  if (error) throw new Error(getUserFriendlyError(error));
  return data;
}

export async function createTeacherAccount(teacherId: string, email: string, password?: string) {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Session check:', { hasSession: !!sessionData?.session, error: sessionError });
    
    if (sessionError || !sessionData?.session) {
      console.error('Session error:', sessionError);
      throw new Error("Sesi autentikasi tidak ditemukan. Silakan login kembali.");
    }

    const accessToken = sessionData.session.access_token;
    console.log('Access token available:', !!accessToken);

    const { data, error } = await supabase.functions.invoke("create-teacher-account", {
      body: {
        email,
        password,
        teacherId,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('Edge function response:', { data, error });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }
    if (data?.error) {
      console.error('Data error:', data.error);
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error('createTeacherAccount error:', error);
    throw error;
  }
}

export async function deleteTeacherAccount(id: string) {
  const { error } = await supabase
    .from('teacher_accounts')
    .delete()
    .eq('id', id);
  
  if (error) throw new Error(getUserFriendlyError(error));
}
