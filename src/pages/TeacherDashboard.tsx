import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherBottomNav } from "@/components/TeacherBottomNav";
import { BookOpen, FileText, ClipboardList } from "lucide-react";

interface TeacherData {
  name: string;
  nip: string;
  rank: string;
  schoolName: string;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    loadTeacherData();
  }, [user, navigate]);

  const loadTeacherData = async () => {
    try {
      // Get teacher account
      const { data: teacherAccount, error: accountError } = await supabase
        .from("teacher_accounts")
        .select(`
          *,
          teachers (
            id,
            name,
            nip,
            rank,
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

        // Get school data
        const { data: school, error: schoolError } = await supabase
          .from("schools")
          .select("name")
          .eq("id", teacher.school_id)
          .single();

        if (schoolError) throw schoolError;

        setTeacherData({
          name: teacher.name,
          nip: teacher.nip,
          rank: teacher.rank,
          schoolName: school.name,
        });
      }
    } catch (error) {
      console.error("Error loading teacher data:", error);
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

  if (!teacherData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Akun Belum Terdaftar</CardTitle>
            <CardDescription>
              Akun Anda belum terhubung dengan data guru. Silakan hubungi administrator sekolah.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-primary text-primary-foreground p-6">
        <h1 className="text-2xl font-bold mb-2">Beranda</h1>
        <p className="text-sm opacity-90">Selamat datang, {teacherData.name}</p>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Guru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Nama Sekolah</p>
              <p className="font-medium">{teacherData.schoolName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nama Guru</p>
              <p className="font-medium">{teacherData.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">NIP</p>
              <p className="font-medium">{teacherData.nip}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pangkat/Golongan</p>
              <p className="font-medium">{teacherData.rank}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/teacher/supervision")}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <BookOpen className="w-12 h-12 text-primary" />
                <h3 className="font-semibold">Administrasi</h3>
                <p className="text-sm text-muted-foreground">Kelola administrasi pembelajaran</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/teacher/profile")}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <FileText className="w-12 h-12 text-primary" />
                <h3 className="font-semibold">Profil</h3>
                <p className="text-sm text-muted-foreground">Lihat profil Anda</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/teacher/supervision")}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <ClipboardList className="w-12 h-12 text-primary" />
                <h3 className="font-semibold">Supervisi</h3>
                <p className="text-sm text-muted-foreground">Instrumen administrasi</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TeacherBottomNav />
    </div>
  );
}
