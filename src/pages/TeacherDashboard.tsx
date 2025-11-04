import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherBottomNav } from "@/components/TeacherBottomNav";
import { TeacherHeader } from "@/components/TeacherHeader";
import { BookOpen, FileText, ClipboardList, GraduationCap, User, LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TeacherData {
  name: string;
  nip: string;
  rank: string;
  schoolName: string;
  administrationCount: number;
  email: string;
}

export default function TeacherDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

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
          id,
          email,
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

        // Get administration count
        const { count, error: countError } = await supabase
          .from("teaching_administration")
          .select("*", { count: "exact", head: true })
          .eq("teacher_account_id", teacherAccount.id);

        if (countError) throw countError;

        setTeacherData({
          name: teacher.name,
          nip: teacher.nip,
          rank: teacher.rank,
          schoolName: school.name,
          administrationCount: count || 0,
          email: teacherAccount.email,
        });
      }
    } catch (error) {
      console.error("Error loading teacher data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Berhasil",
        description: "Anda telah keluar dari akun",
      });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal keluar dari akun",
        variant: "destructive",
      });
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
      <TeacherHeader 
        teacherName={teacherData.name}
        schoolName={teacherData.schoolName}
      />

      <div className="p-4 space-y-4">
        {/* Stats Card */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Statistik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Data Administrasi</p>
                <p className="text-3xl font-bold text-primary">{teacherData.administrationCount}</p>
              </div>
              <ClipboardList className="w-12 h-12 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="shadow-[var(--shadow-card)]">
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

        {/* Quick Actions */}
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
            onClick={() => navigate("/teacher/account")}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <User className="w-12 h-12 text-primary" />
                <h3 className="font-semibold">Account</h3>
                <p className="text-sm text-muted-foreground">Informasi akun</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA to fill administration */}
        {teacherData.administrationCount === 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <h3 className="font-semibold">Belum ada data administrasi</h3>
                <p className="text-sm text-muted-foreground">
                  Lengkapi instrumen administrasi pembelajaran Anda sekarang
                </p>
                <Button 
                  onClick={() => navigate("/teacher/supervision")}
                  className="gap-1.5"
                >
                  <BookOpen className="w-4 h-4" />
                  Isi Administrasi
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <TeacherBottomNav />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari Akun?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan keluar dari akun guru. Anda perlu login kembali untuk mengakses aplikasi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
