import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherBottomNav } from "@/components/TeacherBottomNav";
import { TeacherHeader } from "@/components/TeacherHeader";
import { User, Mail, Building2, Hash, Award, Briefcase } from "lucide-react";

interface TeacherProfile {
  name: string;
  nip: string;
  email: string;
  rank: string;
  employment_type: string;
  gender?: string;
  address?: string;
  schoolName: string;
}

export default function TeacherProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      const { data: teacherAccount, error: accountError } = await supabase
        .from("teacher_accounts")
        .select(`
          email,
          teachers (
            name,
            nip,
            rank,
            employment_type,
            gender,
            address,
            school_id
          )
        `)
        .eq("user_id", user?.id)
        .single();

      if (accountError) throw accountError;

      if (teacherAccount && teacherAccount.teachers) {
        const teacher = Array.isArray(teacherAccount.teachers) 
          ? teacherAccount.teachers[0] 
          : teacherAccount.teachers;

        const { data: school, error: schoolError } = await supabase
          .from("schools")
          .select("name")
          .eq("id", teacher.school_id)
          .single();

        if (schoolError) throw schoolError;

        setProfile({
          name: teacher.name,
          nip: teacher.nip,
          email: teacherAccount.email,
          rank: teacher.rank,
          employment_type: teacher.employment_type,
          gender: teacher.gender,
          address: teacher.address,
          schoolName: school.name,
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Data tidak ditemukan</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TeacherHeader 
        teacherName={profile.name}
        schoolName={profile.schoolName}
      />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4">
        <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pribadi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Nama Lengkap</p>
                <p className="font-medium">{profile.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Hash className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">NIP</p>
                <p className="font-medium">{profile.nip}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
            </div>

            {profile.gender && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Jenis Kelamin</p>
                  <p className="font-medium">{profile.gender}</p>
                </div>
              </div>
            )}

            {profile.address && (
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Alamat</p>
                  <p className="font-medium">{profile.address}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Kepegawaian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Sekolah</p>
                <p className="font-medium">{profile.schoolName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Pangkat/Golongan</p>
                <p className="font-medium">{profile.rank}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Status Kepegawaian</p>
                <p className="font-medium">{profile.employment_type}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        </div>
      </main>

      <TeacherBottomNav />
    </div>
  );
}
