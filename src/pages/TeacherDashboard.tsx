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
  latest: { date: string; score: number; scoreMax: number; predikat: string } | null;
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

interface AllSupervisionResults {
  administrasi: { date: string; pct: number; predikat: string; color: string }[];
  atp: { date: string; pct: number; predikat: string; color: string; mapel?: string }[];
  modulAjar: { date: string; pct: number; predikat: string; color: string; mapel?: string }[];
  observasi: { date: string; pct: number; predikat: string; color: string; mapel?: string }[];
}

function calcPredikat(pct: number) {
  if (pct >= 91) return { label: "Sangat Baik", color: "bg-green-500" };
  if (pct >= 81) return { label: "Baik", color: "bg-primary" };
  if (pct >= 71) return { label: "Cukup", color: "bg-yellow-500" };
  return { label: "Kurang", color: "bg-destructive" };
}

const SUPERVISION_COMPONENTS_KEYS = [
  "kalender_pendidikan","program_tahunan","program_semester","alur_tujuan_pembelajaran",
  "modul_ajar","jadwal_tatap_muka","agenda_mengajar","daftar_nilai","kktp",
  "absensi_siswa","buku_pegangan_guru","buku_teks_siswa",
];
const ATP_KEYS = ["a1","b2","b3","b4","c5","c6","c7","d8","d9","d10","d11","d12"];
const MA_KEYS = ["m1","m2","m3","m4","m5","m6","m7","m8","m9","m10","m11","m12","m13","m14","m15","m16","m17","m18","m19","m20","m21","m22","m23","m24"];

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
  const [allResults, setAllResults] = useState<AllSupervisionResults>({ administrasi: [], atp: [], modulAjar: [], observasi: [] });

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

      const [schoolRes, supervisionRes, coachingRes, adminRes, atpRes, maRes, obsRes] = await Promise.all([
        supabase.from("schools").select("name").eq("id", teacher.school_id).single(),
        supabase.from("supervisions").select("*")
          .eq("teacher_id", teacher.id).order("supervision_date", { ascending: false }),
        supabase.from("coaching_sessions").select("coaching_date, topic")
          .eq("teacher_id", teacher.id).order("coaching_date", { ascending: false }),
        supabase.from("teaching_administration").select("created_at")
          .eq("teacher_account_id", teacherAccount.id).order("created_at", { ascending: false }),
        supabase.from("atp_supervisions" as any).select("*")
          .eq("teacher_id", teacher.id).order("supervision_date", { ascending: false }),
        supabase.from("modul_ajar_supervisions" as any).select("*")
          .eq("teacher_id", teacher.id).order("supervision_date", { ascending: false }),
        supabase.from("supervision_observations").select("*")
          .eq("teacher_id", teacher.id).order("observation_date", { ascending: false }),
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

      // Supervision summary (administrasi)
      const sups = supervisionRes.data || [];
      let latestSup = null;
      if (sups.length > 0) {
        const s = sups[0];
        const score = SUPERVISION_COMPONENTS_KEYS.reduce((sum, k) => sum + (Number((s as any)[k]) || 0), 0);
        const pct = Math.round((score / (SUPERVISION_COMPONENTS_KEYS.length * 2)) * 100);
        const pred = calcPredikat(pct);
        latestSup = { date: s.supervision_date, score, scoreMax: SUPERVISION_COMPONENTS_KEYS.length * 2, predikat: pred.label };
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

      // All supervision results
      const adminResults = sups.map((s: any) => {
        const score = SUPERVISION_COMPONENTS_KEYS.reduce((sum, k) => sum + (Number(s[k]) || 0), 0);
        const pct = Math.round((score / (SUPERVISION_COMPONENTS_KEYS.length * 2)) * 100);
        const pred = calcPredikat(pct);
        return { date: s.supervision_date, pct, predikat: pred.label, color: pred.color, mapel: s.mata_pelajaran };
      });

      const atpList = (atpRes.data || []) as any[];
      const atpResults = atpList.map((r) => {
        const score = ATP_KEYS.reduce((sum, k) => sum + (Number(r[k]) || 0), 0);
        const pct = Math.round((score / (ATP_KEYS.length * 2)) * 100);
        const pred = calcPredikat(pct);
        return { date: r.supervision_date, pct, predikat: pred.label, color: pred.color, mapel: r.mata_pelajaran };
      });

      const maList = (maRes.data || []) as any[];
      const maResults = maList.map((r) => {
        const score = MA_KEYS.reduce((sum, k) => sum + (Number(r[k]) || 0), 0);
        const pct = Math.round((score / (MA_KEYS.length * 2)) * 100);
        const pred = calcPredikat(pct);
        return { date: r.supervision_date, pct, predikat: pred.label, color: pred.color, mapel: r.mata_pelajaran };
      });

      const obsList = (obsRes.data || []) as any[];
      const obsResults = obsList.map((r) => {
        const scores = r.scores as Record<string, number> || {};
        const score = Object.values(scores).reduce((s: number, v: any) => s + (Number(v) || 0), 0);
        const pct = Math.round((score / 76) * 100); // 38 items × 2
        const pred = calcPredikat(pct);
        return { date: r.observation_date, pct, predikat: pred.label, color: pred.color, mapel: r.mata_pelajaran };
      });

      setAllResults({ administrasi: adminResults, atp: atpResults, modulAjar: maResults, observasi: obsResults });
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
  const totalAllSupervisions = allResults.administrasi.length + allResults.atp.length + allResults.modulAjar.length + allResults.observasi.length;

  const SupervisionTypeCard = ({ title, items, emptyMsg, icon }: {
    title: string;
    items: { date: string; pct: number; predikat: string; color: string; mapel?: string }[];
    emptyMsg: string;
    icon: React.ReactNode;
  }) => (
    <div className="space-y-2">
      {title && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
          <Badge variant="outline" className="text-xs">{items.length}</Badge>
        </div>
      )}
      {items.length === 0 ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
          {icon}
          <span>{emptyMsg}</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.slice(0, 2).map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">{format(new Date(item.date + "T00:00:00"), "dd MMM yyyy")}</span>
                  {item.mapel && <span className="text-xs text-foreground font-medium truncate">· {item.mapel}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-bold">{item.pct}%</span>
                <Badge className={`${item.color} text-white border-0 text-[10px] px-1.5`}>{item.predikat}</Badge>
              </div>
            </div>
          ))}
          {items.length > 2 && (
            <p className="text-xs text-muted-foreground text-center">+{items.length - 2} penilaian lainnya</p>
          )}
        </div>
      )}
    </div>
  );

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
                <p className="text-xs text-muted-foreground">{teacherData.rank !== "Tidak Ada" && teacherData.rank !== "IX" ? `${teacherData.rank} · ` : ""}{teacherData.schoolName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-[var(--shadow-card)]">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{totalAllSupervisions}</p>
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

        {/* ── PENILAIAN KEPALA SEKOLAH ── */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold">Penilaian Kepala Sekolah</h2>
          </div>
          <Badge variant={totalAllSupervisions > 0 ? "default" : "secondary"} className="text-xs">
            {totalAllSupervisions} penilaian
          </Badge>
        </div>

        {totalAllSupervisions === 0 ? (
          <Card className="shadow-[var(--shadow-card)]">
            <CardContent className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <ClipboardList className="w-12 h-12 text-muted-foreground/50" />
              <div>
                <p className="font-semibold text-sm">Belum ada hasil supervisi</p>
                <p className="text-xs text-muted-foreground mt-1">Data akan muncul setelah kepala sekolah melakukan penilaian</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-0 shadow-[var(--shadow-card)] bg-gradient-to-br from-blue-50 to-blue-100/60">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-sm text-blue-800">Supervisi Administrasi</CardTitle>
                  <Badge className="ml-auto text-xs bg-blue-600 text-white border-0">{allResults.administrasi.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <SupervisionTypeCard
                  title=""
                  items={allResults.administrasi}
                  emptyMsg="Belum ada penilaian administrasi"
                  icon={<FileText className="w-3.5 h-3.5" />}
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-[var(--shadow-card)] bg-gradient-to-br from-violet-50 to-violet-100/60">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-violet-600" />
                  <CardTitle className="text-sm text-violet-800">Supervisi ATP</CardTitle>
                  <Badge className="ml-auto text-xs bg-violet-600 text-white border-0">{allResults.atp.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <SupervisionTypeCard
                  title=""
                  items={allResults.atp}
                  emptyMsg="Belum ada penilaian ATP"
                  icon={<ClipboardList className="w-3.5 h-3.5" />}
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-[var(--shadow-card)] bg-gradient-to-br from-emerald-50 to-emerald-100/60">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <CardTitle className="text-sm text-emerald-800">Telaah Modul Ajar</CardTitle>
                  <Badge className="ml-auto text-xs bg-emerald-600 text-white border-0">{allResults.modulAjar.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <SupervisionTypeCard
                  title=""
                  items={allResults.modulAjar}
                  emptyMsg="Belum ada telaah modul ajar"
                  icon={<BookOpen className="w-3.5 h-3.5" />}
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-[var(--shadow-card)] bg-gradient-to-br from-amber-50 to-amber-100/60">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <CardTitle className="text-sm text-amber-800">Supervisi Pelaksanaan Pembelajaran</CardTitle>
                  <Badge className="ml-auto text-xs bg-amber-600 text-white border-0">{allResults.observasi.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <SupervisionTypeCard
                  title=""
                  items={allResults.observasi}
                  emptyMsg="Belum ada observasi pelaksanaan"
                  icon={<Award className="w-3.5 h-3.5" />}
                />
              </CardContent>
            </Card>

            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={() => navigate("/teacher/supervision")}>
              <ClipboardList className="w-3.5 h-3.5" />
              Lihat Semua Detail Penilaian
            </Button>
          </>
        )}

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
              desc: totalAllSupervisions === 0
                ? "Belum ada supervisi"
                : `${totalAllSupervisions} supervisi tercatat`,
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
