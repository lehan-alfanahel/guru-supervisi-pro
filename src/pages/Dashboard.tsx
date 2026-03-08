import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSchool, getTeachers, School, Teacher } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  School2, Users, ClipboardList, LogOut, MessageSquare,
  ExternalLink, CheckCircle2, XCircle, ChevronDown, ChevronUp, BookOpen, TrendingUp
} from "lucide-react";
import { AdminBottomNav } from "@/components/AdminBottomNav";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const ADMIN_FIELDS = [
  { key: "calendar_link", label: "Kalender Pendidikan", icon: "📅" },
  { key: "annual_program_link", label: "Program Tahunan", icon: "📋" },
  { key: "assessment_use_link", label: "Pemanfaatan Hasil Asesmen Diagnostik", icon: "📊" },
  { key: "learning_flow_link", label: "Alur Tujuan Pembelajaran", icon: "🎯" },
  { key: "teaching_module_link", label: "Modul Ajar", icon: "📖" },
  { key: "teaching_material_link", label: "Bahan Ajar / Buku Guru & Siswa", icon: "📚" },
  { key: "schedule_link", label: "Jadwal Pelajaran", icon: "🗓️" },
  { key: "assessment_program_link", label: "Program Penilaian", icon: "✅" },
  { key: "grade_list_link", label: "Daftar Nilai / Hasil Asesmen", icon: "📝" },
  { key: "daily_agenda_link", label: "Agenda Harian", icon: "📌" },
  { key: "attendance_link", label: "Absensi Murid", icon: "👥" },
];

function formatSemesterClass(val: string | null | undefined): string {
  if (!val) return "";
  if (val.toLowerCase().startsWith("semester")) return val;
  if (val.includes("/")) {
    const [sem, kelas] = val.split("/").map((s) => s.trim());
    return `Semester ${sem} / Kelas ${kelas}`;
  }
  return val;
}

const SUPERVISION_KEYS = [
  "kalender_pendidikan","program_tahunan","program_semester","alur_tujuan_pembelajaran",
  "modul_ajar","jadwal_tatap_muka","agenda_mengajar","daftar_nilai","kktp",
  "absensi_siswa","buku_pegangan_guru","buku_teks_siswa",
];
const SCORE_MAX_DASH = SUPERVISION_KEYS.length * 2;

function calcPct(s: any) {
  const score = SUPERVISION_KEYS.reduce((sum, k) => sum + (Number(s[k]) || 0), 0);
  return Math.round((score / SCORE_MAX_DASH) * 100);
}

export default function Dashboard() {
  const [school, setSchool] = useState<School | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [supervisions, setSupervisions] = useState<any[]>([]);
  const [adminRecords, setAdminRecords] = useState<any[]>([]);
  const [coachingRecords, setCoachingRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [expandedAdmin, setExpandedAdmin] = useState<string | null>(null);
  const [expandedCoaching, setExpandedCoaching] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    setUserEmail(user.email || "");
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    if (!user) return;
    try {
      const schoolData = await getSchool(user.id);
      if (!schoolData) { navigate("/setup-school"); return; }
      setSchool(schoolData);

      const [teachersData, { data: supervisionsData }, { data: adminData }, { data: teachersList }, { data: coachingData }] = await Promise.all([
        getTeachers(schoolData.id),
        supabase.from("supervisions").select("*, teachers(name, nip)")
          .eq("school_id", schoolData.id)
          .order("supervision_date", { ascending: false }),
        supabase.from("teaching_administration")
          .select("*")
          .eq("school_id", schoolData.id)
          .order("created_at", { ascending: false }),
        supabase.from("teachers")
          .select("id, name, nip, rank")
          .eq("school_id", schoolData.id),
        supabase.from("coaching_sessions")
          .select("*, teachers(name, nip)")
          .eq("school_id", schoolData.id)
          .order("coaching_date", { ascending: false }),
      ]);

      setTeachers(teachersData);
      setSupervisions(supervisionsData || []);
      setCoachingRecords(coachingData || []);

      // Enrich admin records with teacher data
      const teacherMap = (teachersList || []).reduce((acc: Record<string, any>, t: any) => {
        acc[t.id] = t;
        return acc;
      }, {});
      const enrichedAdmin = (adminData || []).map((r: any) => ({
        ...r,
        teachers: teacherMap[r.teacher_id] || null,
      }));
      setAdminRecords(enrichedAdmin);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Berhasil keluar", description: "Anda telah keluar dari aplikasi" });
    navigate("/auth");
  };

  const calculateCompleteness = (record: any) => {
    const filled = ADMIN_FIELDS.filter(f => record[f.key]).length;
    return Math.round((filled / ADMIN_FIELDS.length) * 100);
  };

  // Build chart data: per-teacher supervision progress (up to 5 teachers, last 6 supervisions each)
  const chartData = (() => {
    // Collect all unique dates (sorted asc)
    const allDates = [...new Set(supervisions.map((s) => s.supervision_date))].sort();
    const last6Dates = allDates.slice(-6);

    const teacherNames: Record<string, string> = {};
    supervisions.forEach((s) => {
      if (s.teachers?.name) teacherNames[s.teacher_id] = s.teachers.name;
    });

    // Top 5 teachers by supervision count
    const teacherCounts: Record<string, number> = {};
    supervisions.forEach((s) => { teacherCounts[s.teacher_id] = (teacherCounts[s.teacher_id] || 0) + 1; });
    const top5 = Object.entries(teacherCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    return last6Dates.map((date) => {
      const row: Record<string, any> = { date: format(new Date(date + "T00:00:00"), "dd/MM") };
      top5.forEach((tid) => {
        const sup = supervisions.find((s) => s.supervision_date === date && s.teacher_id === tid);
        row[teacherNames[tid] || tid] = sup ? calcPct(sup) : null;
      });
      return row;
    });
  })();

  const chartTeachers = [...new Set(supervisions.map((s) => s.teachers?.name).filter(Boolean))].slice(0, 5) as string[];
  const CHART_COLORS = ["hsl(210,85%,35%)", "hsl(25,100%,55%)", "hsl(150,60%,45%)", "hsl(270,60%,55%)", "hsl(0,70%,55%)"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <School2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">SUPERVISI DIGITAL GURU</h1>
                <p className="text-sm opacity-90">{school?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{school?.principal_name}</p>
                <p className="text-xs opacity-75">{userEmail}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setLogoutDialogOpen(true)} className="hover:bg-white/10">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Total Guru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{teachers.length}</p>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4" /> Total Supervisi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-secondary">{supervisions.length}</p>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> Instrumen Terisi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-accent">{adminRecords.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart: Perkembangan Nilai Supervisi */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Perkembangan Nilai Supervisi
              </CardTitle>
              <Badge variant="outline">{supervisions.length} data</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Persentase nilai supervisi administrasi per guru (6 sesi terakhir)</p>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Belum ada data supervisi untuk ditampilkan</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={40} />
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, ""]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {chartTeachers.map((name, i) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4, fill: CHART_COLORS[i % CHART_COLORS.length] }}
                      activeDot={{ r: 6 }}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Instrumen Administrasi Guru (Google Drive Links) */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Instrumen Administrasi Guru
              </CardTitle>
              <Badge variant="secondary">{adminRecords.length} data</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Hasil isian instrumen administrasi oleh guru (link Google Drive)</p>
          </CardHeader>
          <CardContent>
            {adminRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Belum ada guru yang mengisi instrumen administrasi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {adminRecords.map((record) => {
                  const pct = calculateCompleteness(record);
                  const isExpanded = expandedAdmin === record.id;
                  const filledCount = ADMIN_FIELDS.filter(f => record[f.key]).length;

                  return (
                    <div key={record.id} className="border rounded-xl overflow-hidden">
                      {/* Card Header */}
                      <div className="p-4 bg-muted/20">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm">{record.teachers?.name}</p>
                              <Badge
                                variant={pct === 100 ? "default" : pct >= 60 ? "secondary" : "destructive"}
                                className="text-xs"
                              >
                                {pct}% Lengkap
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">NIP: {record.teachers?.nip}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span>{formatSemesterClass(record.semester_class) || record.semester_class} · {record.teaching_hours} jam/minggu</span>
                              <span>{format(new Date(record.created_at), "dd MMM yyyy")}</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="px-2 flex-shrink-0"
                            onClick={() => setExpandedAdmin(isExpanded ? null : record.id)}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </div>

                        {/* Progress */}
                        <div className="mt-3 space-y-1">
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground">{filledCount} dari {ADMIN_FIELDS.length} komponen terisi</p>
                        </div>
                      </div>

                      {/* Expanded: Full link list */}
                      {isExpanded && (
                        <div className="divide-y">
                          {ADMIN_FIELDS.map((f, i) => {
                            const val = record[f.key];
                            return (
                              <div key={f.key} className="flex items-start gap-3 px-4 py-3">
                                <span className="text-xs text-muted-foreground w-5 flex-shrink-0 mt-0.5">{i + 1}.</span>
                                {val
                                  ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                  : <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-medium ${val ? "text-foreground" : "text-muted-foreground"}`}>
                                    {f.icon} {f.label}
                                  </p>
                                  {val ? (
                                    <a
                                      href={String(val)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5 max-w-full"
                                    >
                                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate">{String(val)}</span>
                                    </a>
                                  ) : (
                                    <p className="text-xs text-muted-foreground mt-0.5">Belum diisi</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coaching Terbaru */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-secondary" />
                Coaching Terbaru
              </CardTitle>
              <Badge variant="secondary">{coachingRecords.length} sesi</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Rekap sesi coaching guru yang telah dilakukan</p>
          </CardHeader>
          <CardContent>
            {coachingRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Belum ada sesi coaching yang dicatat</p>
              </div>
            ) : (
              <div className="space-y-3">
                {coachingRecords.map((record) => {
                  const isExpanded = expandedCoaching === record.id;
                  return (
                    <div key={record.id} className="border rounded-xl overflow-hidden">
                      <div className="p-4 bg-muted/20">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm">{record.teachers?.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {format(new Date(record.coaching_date + "T00:00:00"), "dd MMM yyyy")}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">NIP: {record.teachers?.nip}</p>
                            <p className="text-xs font-medium text-foreground mt-1 line-clamp-1">{record.topic}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="px-2 flex-shrink-0"
                            onClick={() => setExpandedCoaching(isExpanded ? null : record.id)}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="divide-y px-4 py-3 space-y-3 text-xs">
                          {record.findings && (
                            <div>
                              <p className="font-semibold text-muted-foreground mb-1">Temuan</p>
                              <p className="text-foreground">{record.findings}</p>
                            </div>
                          )}
                          {record.recommendations && (
                            <div className="pt-3">
                              <p className="font-semibold text-muted-foreground mb-1">Rekomendasi</p>
                              <p className="text-foreground">{record.recommendations}</p>
                            </div>
                          )}
                          {record.follow_up && (
                            <div className="pt-3">
                              <p className="font-semibold text-muted-foreground mb-1">Tindak Lanjut</p>
                              <p className="text-foreground">{record.follow_up}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-secondary hover:text-secondary hover:bg-secondary/5"
                  onClick={() => navigate("/coaching")}
                >
                  Lihat semua coaching
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Supervisions */}
        {supervisions.length > 0 && (
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Supervisi Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supervisions.slice(0, 5).map((supervision) => (
                  <div key={supervision.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{supervision.teachers?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(supervision.supervision_date).toLocaleDateString("id-ID", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => navigate("/supervisions")}>
                      Lihat
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <AdminBottomNav />

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
            <AlertDialogDescription>Apakah Anda yakin ingin keluar dari aplikasi?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut}>Keluar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
