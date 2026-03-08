import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { TeacherBottomNav } from "@/components/TeacherBottomNav";
import { TeacherHeader } from "@/components/TeacherHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  ClipboardList, Calendar, Printer, MessageSquare,
  Search, X, ChevronDown, ChevronUp, Eye,
} from "lucide-react";
import { OBSERVATION_SECTIONS, ALL_ITEM_KEYS } from "./SupervisionObservation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface SupervisionRecord {
  id: string;
  supervision_date: string;
  lesson_plan: boolean | null;
  syllabus: boolean | null;
  assessment_tools: boolean | null;
  teaching_materials: boolean | null;
  student_attendance: boolean | null;
  notes: string | null;
  type: "supervision";
}

interface CoachingRecord {
  id: string;
  coaching_date: string;
  topic: string;
  findings: string | null;
  recommendations: string | null;
  follow_up: string | null;
  type: "coaching";
}

interface ObservationRecord {
  id: string;
  observation_date: string;
  mata_pelajaran: string | null;
  materi_topik: string | null;
  scores: Record<string, number>;
  notes: string | null;
  tindak_lanjut: string | null;
  type: "observation";
}

type HistoryRecord = SupervisionRecord | CoachingRecord | ObservationRecord;

interface TeacherInfo {
  name: string;
  nip: string;
  rank: string;
  schoolName: string;
  principalName: string;
  teacherId: string;
}

const calculateCompleteness = (s: SupervisionRecord) => {
  const items = [s.lesson_plan, s.syllabus, s.assessment_tools, s.teaching_materials, s.student_attendance];
  return Math.round((items.filter(Boolean).length / 5) * 100);
};

function SupervisionCard({
  s,
  onPrint,
}: {
  s: SupervisionRecord;
  onPrint: (s: SupervisionRecord) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const completeness = calculateCompleteness(s);

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Supervisi Pembelajaran</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(s.supervision_date).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                completeness === 100
                  ? "default"
                  : completeness >= 60
                  ? "secondary"
                  : "destructive"
              }
            >
              {completeness}%
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Kelengkapan Perangkat</span>
            <span>{completeness}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className="bg-primary rounded-full h-1.5 transition-all"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>

        {expanded && (
          <div className="space-y-3 pt-1 border-t">
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { label: "RPP", val: s.lesson_plan },
                { label: "Silabus", val: s.syllabus },
                { label: "Penilaian", val: s.assessment_tools },
                { label: "Bahan Ajar", val: s.teaching_materials },
                { label: "Daftar Hadir", val: s.student_attendance },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-1 ${
                    item.val ? "text-green-600" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      item.val
                        ? "bg-green-600 border-green-600"
                        : "border-muted-foreground"
                    }`}
                  >
                    {item.val && (
                      <span className="text-white text-[9px]">✓</span>
                    )}
                  </div>
                  {item.label}
                </div>
              ))}
            </div>
            {s.notes && (
              <div className="p-2 bg-muted/50 rounded text-xs">
                <p className="font-medium text-muted-foreground mb-0.5">Catatan:</p>
                <p>{s.notes}</p>
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5 h-8 text-xs"
              onClick={() => onPrint(s)}
            >
              <Printer className="w-3 h-3" /> Cetak Instrumen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CoachingCard({ c }: { c: CoachingRecord }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-l-4 border-l-secondary">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold line-clamp-1">{c.topic}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(c.coaching_date).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">Coaching</Badge>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="space-y-2 pt-2 border-t text-sm">
            {c.findings && (
              <div className="p-2 bg-muted/50 rounded text-xs">
                <p className="font-medium text-muted-foreground mb-0.5">Temuan:</p>
                <p>{c.findings}</p>
              </div>
            )}
            {c.recommendations && (
              <div className="p-2 bg-muted/50 rounded text-xs">
                <p className="font-medium text-muted-foreground mb-0.5">Rekomendasi:</p>
                <p>{c.recommendations}</p>
              </div>
            )}
            {c.follow_up && (
              <div className="p-2 bg-muted/50 rounded text-xs">
                <p className="font-medium text-muted-foreground mb-0.5">Tindak Lanjut:</p>
                <p>{c.follow_up}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Observation Card
function ObservationCard({ obs }: { obs: ObservationRecord }) {
  const [expanded, setExpanded] = useState(false);
  const SCORE_MAX = ALL_ITEM_KEYS.length * 2;
  const total = ALL_ITEM_KEYS.reduce((s, k) => s + (Number(obs.scores[k]) || 0), 0);
  const pct = Math.round((total / SCORE_MAX) * 100);
  const colors = pct >= 91 ? "text-green-600" : pct >= 81 ? "text-primary" : pct >= 71 ? "text-yellow-600" : "text-destructive";
  const label = pct >= 91 ? "Sangat Baik" : pct >= 81 ? "Baik" : pct >= 71 ? "Cukup" : "Kurang";
  const bgColor = pct >= 91 ? "bg-green-500" : pct >= 81 ? "bg-primary" : pct >= 71 ? "bg-yellow-500" : "bg-destructive";

  return (
    <Card className="border-l-4 border-l-accent">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <Eye className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold">Supervisi Pelaksanaan Pembelajaran</p>
              {obs.mata_pelajaran && <p className="text-xs text-muted-foreground">Mapel: {obs.mata_pelajaran}</p>}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(obs.observation_date), "dd MMMM yyyy", { locale: idLocale })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${bgColor} text-white border-0 text-xs`}>{label}</Badge>
            <span className={`text-xs font-semibold ${colors}`}>{pct}%</span>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Nilai Akhir</span>
            <span>{total}/{SCORE_MAX} = {pct}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className={`${bgColor} rounded-full h-1.5 transition-all`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        {expanded && (
          <div className="space-y-2 pt-2 border-t text-xs">
            {OBSERVATION_SECTIONS.map((sec) => (
              <div key={sec.section}>
                <p className="font-bold text-primary mb-1">{sec.section}. {sec.title}</p>
                {sec.groups.map((grp) => (
                  <div key={grp.num} className="mb-2">
                    <p className="font-semibold pl-2 mb-1">{grp.num}. {grp.title}</p>
                    {grp.items.map((item) => {
                      const val = Number(obs.scores[item.key]) || 0;
                      const scoreColors = ["text-destructive", "text-yellow-600", "text-green-600"];
                      const scoreLabels = ["Tidak Ada", "Kurang Sesuai", "Sesuai"];
                      return (
                        <div key={item.key} className="flex items-start justify-between gap-2 pl-4 py-0.5">
                          <span className="text-muted-foreground flex-1">{item.label}</span>
                          <Badge variant="outline" className={`${scoreColors[val]} flex-shrink-0 text-[10px]`}>{scoreLabels[val]}</Badge>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
            {obs.notes && (
              <div className="p-2 bg-muted/50 rounded">
                <p className="font-medium text-muted-foreground mb-0.5">Catatan:</p>
                <p>{obs.notes}</p>
              </div>
            )}
            {obs.tindak_lanjut && (
              <div className="p-2 bg-muted/50 rounded">
                <p className="font-medium text-muted-foreground mb-0.5">Tindak Lanjut:</p>
                <p>{obs.tindak_lanjut}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TeacherHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [supervisions, setSupervisions] = useState<SupervisionRecord[]>([]);
  const [coachings, setCoachings] = useState<CoachingRecord[]>([]);
  const [observations, setObservations] = useState<ObservationRecord[]>([]);
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"semua" | "supervisi" | "observasi" | "coaching">("semua");
  const [searchDate, setSearchDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const { data: ta } = await supabase
        .from("teacher_accounts")
        .select("teachers(id, name, nip, rank, school_id)")
        .eq("user_id", user?.id)
        .single();

      if (!ta?.teachers) return;
      const teacher = Array.isArray(ta.teachers) ? ta.teachers[0] : ta.teachers;

      const [schoolRes, supsRes, coachRes, obsRes] = await Promise.all([
        supabase.from("schools").select("name, principal_name").eq("id", teacher.school_id).single(),
        supabase.from("supervisions").select("*").eq("teacher_id", teacher.id).order("supervision_date", { ascending: false }),
        supabase.from("coaching_sessions").select("*").eq("teacher_id", teacher.id).order("coaching_date", { ascending: false }),
        supabase.from("supervision_observations").select("*").eq("teacher_id", teacher.id).order("observation_date", { ascending: false }),
      ]);

      setTeacherInfo({
        name: teacher.name,
        nip: teacher.nip,
        rank: teacher.rank,
        schoolName: schoolRes.data?.name || "",
        principalName: schoolRes.data?.principal_name || "",
        teacherId: teacher.id,
      });

      setSupervisions((supsRes.data || []).map((s) => ({ ...s, type: "supervision" as const })));
      setCoachings((coachRes.data || []).map((c) => ({ ...c, type: "coaching" as const })));
      setObservations((obsRes.data || []).map((o) => ({ ...o, scores: (o.scores as Record<string, number>) || {}, type: "observation" as const })));
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRecordDate = (r: HistoryRecord) => {
    if (r.type === "supervision") return r.supervision_date;
    if (r.type === "coaching") return r.coaching_date;
    return r.observation_date;
  };

  const allRecords = useMemo((): HistoryRecord[] => {
    const mapped: HistoryRecord[] = [...supervisions, ...coachings, ...observations];
    return mapped.sort((a, b) => {
      const dateA = getRecordDate(a);
      const dateB = getRecordDate(b);
      return sortOrder === "desc" ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
    });
  }, [supervisions, coachings, observations, sortOrder]);

  const filtered = useMemo(() => {
    return allRecords.filter((r) => {
      const date = getRecordDate(r);
      const matchType =
        activeTab === "semua" ||
        (activeTab === "supervisi" && r.type === "supervision") ||
        (activeTab === "coaching" && r.type === "coaching") ||
        (activeTab === "observasi" && r.type === "observation");
      const matchDate = searchDate ? date.includes(searchDate) : true;
      return matchType && matchDate;
    });
  }, [allRecords, activeTab, searchDate]);

  const handlePrintSingle = (s: SupervisionRecord) => {
    const win = window.open("", "_blank");
    if (!win) return;
    const items = [
      { label: "RPP (Rencana Pelaksanaan Pembelajaran)", value: s.lesson_plan },
      { label: "Silabus", value: s.syllabus },
      { label: "Instrumen Penilaian", value: s.assessment_tools },
      { label: "Bahan Ajar", value: s.teaching_materials },
      { label: "Daftar Hadir Siswa", value: s.student_attendance },
    ];
    win.document.write(`
      <html>
        <head>
          <title>Instrumen Supervisi - ${teacherInfo?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 30px; color: #333; }
            h1, h2 { text-align: center; margin: 4px 0; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            td, th { padding: 8px 12px; border: 1px solid #ccc; font-size: 13px; }
            th { background: #f5f5f5; font-weight: bold; }
            .check { color: green; font-weight: bold; }
            .uncheck { color: red; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 13px; }
            .sign-box { text-align: center; }
            .sign-line { margin-top: 60px; border-top: 1px solid #333; padding-top: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INSTRUMEN SUPERVISI PEMBELAJARAN</h1>
            <h2>${teacherInfo?.schoolName}</h2>
          </div>
          <table>
            <tr><td style="width:35%;background:#f5f5f5;font-weight:bold;">Nama Guru</td><td>${teacherInfo?.name}</td></tr>
            <tr><td style="background:#f5f5f5;font-weight:bold;">NIP</td><td>${teacherInfo?.nip}</td></tr>
            <tr><td style="background:#f5f5f5;font-weight:bold;">Pangkat/Golongan</td><td>${teacherInfo?.rank}</td></tr>
            <tr><td style="background:#f5f5f5;font-weight:bold;">Tanggal Supervisi</td><td>${new Date(s.supervision_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</td></tr>
          </table>
          <br/>
          <table>
            <tr><th style="width:5%;">No</th><th>Komponen Supervisi</th><th style="width:15%;">Ada</th><th style="width:15%;">Tidak Ada</th></tr>
            ${items.map((item, i) => `
              <tr>
                <td style="text-align:center;">${i + 1}</td>
                <td>${item.label}</td>
                <td style="text-align:center;">${item.value ? '<span class="check">✓</span>' : ''}</td>
                <td style="text-align:center;">${!item.value ? '<span class="uncheck">✗</span>' : ''}</td>
              </tr>
            `).join("")}
          </table>
          ${s.notes ? `<div style="margin-top:16px;padding:10px;border:1px solid #ccc;border-radius:4px;"><strong>Catatan Observasi:</strong><br/>${s.notes}</div>` : ""}
          <div class="footer">
            <div class="sign-box">
              <p>Kepala Sekolah,</p>
              <div class="sign-line">${teacherInfo?.principalName}</div>
            </div>
            <div class="sign-box">
              <p>Guru,</p>
              <div class="sign-line">${teacherInfo?.name}</div>
            </div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const totalCount = supervisions.length + coachings.length + observations.length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <TeacherHeader teacherName={teacherInfo?.name || ""} schoolName={teacherInfo?.schoolName || ""} />

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Riwayat</h2>
            <p className="text-xs text-muted-foreground">
              {supervisions.length} supervisi · {observations.length} observasi · {coachings.length} coaching
            </p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8"
            onClick={() => setSortOrder((p) => (p === "desc" ? "asc" : "desc"))}>
            <Calendar className="w-3 h-3" />
            {sortOrder === "desc" ? "Terbaru" : "Terlama"}
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total", count: totalCount, color: "bg-muted" },
            { label: "Supervisi", count: supervisions.length, color: "bg-primary/10" },
            { label: "Observasi", count: observations.length, color: "bg-accent/20" },
            { label: "Coaching", count: coachings.length, color: "bg-secondary/30" },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.color} rounded-xl p-3 text-center`}>
              <p className="text-xl font-bold">{stat.count}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="semua" className="text-xs">
                Semua <Badge variant="secondary" className="ml-1 h-4 text-[10px] px-1">{totalCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="supervisi" className="text-xs">
                Supervisi <Badge variant="secondary" className="ml-1 h-4 text-[10px] px-1">{supervisions.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="observasi" className="text-xs">
                Observasi <Badge variant="secondary" className="ml-1 h-4 text-[10px] px-1">{observations.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="coaching" className="text-xs">
                Coaching <Badge variant="secondary" className="ml-1 h-4 text-[10px] px-1">{coachings.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="month" className="pl-9 pr-9" value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)} placeholder="Filter bulan/tahun" />
            {searchDate && (
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchDate("")}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Records */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-1">Tidak ada data</p>
              <p className="text-sm text-muted-foreground text-center">
                {totalCount === 0
                  ? "Data akan muncul setelah kepala sekolah melakukan supervisi atau coaching"
                  : "Tidak ada data yang cocok dengan filter"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((record) =>
              record.type === "supervision" ? (
                <SupervisionCard key={`sup-${record.id}`} s={record} onPrint={handlePrintSingle} />
              ) : record.type === "observation" ? (
                <ObservationCard key={`obs-${record.id}`} obs={record} />
              ) : (
                <CoachingCard key={`coach-${record.id}`} c={record} />
              )
            )}
          </div>
        )}
      </div>

      <TeacherBottomNav />
    </div>
  );
}
