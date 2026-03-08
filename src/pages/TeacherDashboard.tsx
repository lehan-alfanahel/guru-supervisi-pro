import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherBottomNav } from "@/components/TeacherBottomNav";
import { TeacherHeader } from "@/components/TeacherHeader";
import {
  BookOpen, ClipboardList, History, MessageSquare, User,
  AlertCircle, Clock, Bell, ChevronRight, LogOut, Award, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { format } from "date-fns";

interface TeacherData {
  id: string;
  name: string;
  nip: string;
  rank: string;
  schoolName: string;
  teacherAccountId: string;
  email: string;
}

interface SupervisionSummary {
  total: number;
  latest: { date: string; completeness: number } | null;
}

interface CoachingSummary {
  total: number;
  latestTopic: string | null;
  latestDate: string | null;
}

interface AdminSummary {
  total: number;
  latestDate: string | null;
}

export default function TeacherDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [supervisionSummary, setSupervisionSummary] = useState<SupervisionSummary>({ total: 0, latest: null });
  const [coachingSummary, setCoachingSummary] = useState<CoachingSummary>({ total: 0, latestTopic: null, latestDate: null });
  const [adminSummary, setAdminSummary] = useState<AdminSummary>({ total: 0, latestDate: null });

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    loadAllData();
  }, [user, navigate]);

  const loadAllData = async () => {
    try {
      const { data: teacherAccount, error: accountError } = await supabase
        .from("teacher_accounts")
        .select(`id, email, teachers(id, name, nip, rank, school_id)`)
        .eq("user_id", user?.id)
        .single();

      if (accountError) throw accountError;
      if (!teacherAccount?.teachers) return;

      const teacher = Array.isArray(teacherAccount.teachers)
        ? teacherAccount.teachers[0]
        : teacherAccount.teachers;

      const [schoolRes, supervisionRes, coachingRes, adminRes] = await Promise.all([
        supabase.from("schools").select("name").eq("id", teacher.school_id).single(),
        supabase.from("supervisions").select("supervision_date, lesson_plan, syllabus, assessment_tools, teaching_materials, student_attendance")
          .eq("teacher_id", teacher.id).order("supervision_date", { ascending: false }),
        supabase.from("coaching_sessions").select("coaching_date, topic")
          .eq("teacher_id", teacher.id).order("coaching_date", { ascending: false }),
        supabase.from("teaching_administration").select("created_at")
          .eq("teacher_account_id", teacherAccount.id).order("created_at", { ascending: false }),
      ]);

      setTeacherData({
        id: teacher.id,
        name: teacher.name,
        nip: teacher.nip,
        rank: teacher.rank,
        schoolName: schoolRes.data?.name || "",
        teacherAccountId: teacherAccount.id,
        email: teacherAccount.email,
      });

      // Supervision summary
      const sups = supervisionRes.data || [];
      let latestSup = null;
      if (sups.length > 0) {
        const s = sups[0];
        const items = [s.lesson_plan, s.syllabus, s.assessment_tools, s.teaching_materials, s.student_attendance];
        latestSup = {
          date: s.supervision_date,
          completeness: Math.round((items.filter(Boolean).length / 5) * 100),
        };
      }
      setSupervisionSummary({ total: sups.length, latest: latestSup });

      // Coaching summary
      const coachings = coachingRes.data || [];
      setCoachingSummary({
        total: coachings.length,
        latestTopic: coachings[0]?.topic || null,
        latestDate: coachings[0]?.coaching_date || null,
      });

      // Admin summary
      const admins = adminRes.data || [];
      setAdminSummary({
        total: admins.length,
        latestDate: admins[0]?.created_at || null,
      });
    } catch (error) {
      console.error("Error loading teacher data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Berhasil", description: "Anda telah keluar dari akun" });
      navigate("/auth");
    } catch {
      toast({ title: "Error", description: "Gagal keluar dari akun", variant: "destructive" });
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
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Akun Anda belum terhubung dengan data guru. Silakan hubungi kepala sekolah.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const needsFillAdmin = adminSummary.total === 0;
  const hasNewCoaching = coachingSummary.total > 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <TeacherHeader teacherName={teacherData.name} schoolName={teacherData.schoolName} />

      <div className="p-4 space-y-4 max-w-lg mx-auto">

        {/* Notification / Alert Banner */}
        {needsFillAdmin && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-orange-700">Administrasi belum diisi</p>
              <p className="text-xs text-orange-600 mt-0.5">Lengkapi instrumen administrasi pembelajaran Anda</p>
            </div>
            <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100 text-xs flex-shrink-0"
              onClick={() => navigate("/teacher/supervision")}>
              Isi Sekarang
            </Button>
          </div>
        )}

        {hasNewCoaching && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-3">
            <Bell className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary">Ada catatan coaching</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{coachingSummary.latestTopic}</p>
            </div>
            <Button size="sm" variant="ghost" className="text-primary text-xs flex-shrink-0"
              onClick={() => navigate("/teacher/coaching")}>
              Lihat
            </Button>
          </div>
        )}

        {/* Teacher Info Card */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base truncate">{teacherData.name}</p>
                <p className="text-sm text-muted-foreground">NIP: {teacherData.nip}</p>
                <p className="text-xs text-muted-foreground">{teacherData.rank} · {teacherData.schoolName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-[var(--shadow-card)]">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{supervisionSummary.total}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Supervisi</p>
            </CardContent>
          </Card>
          <Card className="shadow-[var(--shadow-card)]">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{coachingSummary.total}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Coaching</p>
            </CardContent>
          </Card>
          <Card className="shadow-[var(--shadow-card)]">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{adminSummary.total}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Administrasi</p>
            </CardContent>
          </Card>
        </div>

        {/* Supervision Status Card */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Status Supervisi Terakhir</CardTitle>
              {supervisionSummary.latest && (
                <Badge variant={supervisionSummary.latest.completeness === 100 ? "default" : "secondary"}>
                  {supervisionSummary.latest.completeness}%
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {supervisionSummary.latest ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {format(new Date(supervisionSummary.latest.date), "dd MMM yyyy")}
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-primary rounded-full h-2.5 transition-all"
                    style={{ width: `${supervisionSummary.latest.completeness}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Kelengkapan perangkat: {supervisionSummary.latest.completeness}%
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                Belum ada data supervisi dari kepala sekolah
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">Menu Cepat</h3>

          {[
            {
              icon: <BookOpen className="w-5 h-5 text-primary" />,
              title: "Instrumen Administrasi",
              desc: adminSummary.total === 0
                ? "Belum ada data – tap untuk mengisi"
                : `${adminSummary.total} data tersimpan`,
              badge: adminSummary.total === 0 ? "Segera Isi" : null,
              badgeVariant: "destructive" as const,
              path: "/teacher/supervision",
              urgent: adminSummary.total === 0,
            },
            {
              icon: <History className="w-5 h-5 text-primary" />,
              title: "Riwayat Supervisi",
              desc: supervisionSummary.total === 0
                ? "Belum ada supervisi"
                : `${supervisionSummary.total} supervisi tercatat`,
              badge: null,
              path: "/teacher/history",
              urgent: false,
            },
            {
              icon: <MessageSquare className="w-5 h-5 text-primary" />,
              title: "Catatan Coaching",
              desc: coachingSummary.latestTopic
                ? `Terakhir: ${coachingSummary.latestTopic}`
                : "Belum ada catatan coaching",
              badge: coachingSummary.total > 0 ? String(coachingSummary.total) : null,
              badgeVariant: "default" as const,
              path: "/teacher/coaching",
              urgent: false,
            },
            {
              icon: <User className="w-5 h-5 text-primary" />,
              title: "Profil Guru",
              desc: `${teacherData.nip} · ${teacherData.rank}`,
              badge: null,
              path: "/teacher/profile",
              urgent: false,
            },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent transition-colors text-left ${
                item.urgent ? "border-orange-200 bg-orange-50/50" : "border-border"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                item.urgent ? "bg-orange-100" : "bg-primary/10"
              }`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{item.desc}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.badge && (
                  <Badge variant={item.badgeVariant || "default"} className="text-xs">
                    {item.badge}
                  </Badge>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setLogoutDialogOpen(true)}
        >
          <LogOut className="w-4 h-4" />
          Keluar dari Akun
        </Button>
      </div>

      <TeacherBottomNav />

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
