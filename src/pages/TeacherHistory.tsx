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

type HistoryRecord = SupervisionRecord | CoachingRecord;

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

export default function TeacherHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [supervisions, setSupervisions] = useState<SupervisionRecord[]>([]);
  const [coachings, setCoachings] = useState<CoachingRecord[]>([]);
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"semua" | "supervisi" | "coaching">("semua");
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

      const [schoolRes, supsRes, coachRes] = await Promise.all([
        supabase
          .from("schools")
          .select("name, principal_name")
          .eq("id", teacher.school_id)
          .single(),
        supabase
          .from("supervisions")
          .select("*")
          .eq("teacher_id", teacher.id)
          .order("supervision_date", { ascending: false }),
        supabase
          .from("coaching_sessions")
          .select("*")
          .eq("teacher_id", teacher.id)
          .order("coaching_date", { ascending: false }),
      ]);

      setTeacherInfo({
        name: teacher.name,
        nip: teacher.nip,
        rank: teacher.rank,
        schoolName: schoolRes.data?.name || "",
        principalName: schoolRes.data?.principal_name || "",
        teacherId: teacher.id,
      });

      setSupervisions(
        (supsRes.data || []).map((s) => ({ ...s, type: "supervision" as const }))
      );
      setCoachings(
        (coachRes.data || []).map((c) => ({ ...c, type: "coaching" as const }))
      );
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  const allRecords = useMemo((): HistoryRecord[] => {
    const mapped: HistoryRecord[] = [
      ...supervisions,
      ...coachings,
    ];
    return mapped.sort((a, b) => {
      const dateA = a.type === "supervision" ? a.supervision_date : a.coaching_date;
      const dateB = b.type === "supervision" ? b.supervision_date : b.coaching_date;
      return sortOrder === "desc"
        ? dateB.localeCompare(dateA)
        : dateA.localeCompare(dateB);
    });
  }, [supervisions, coachings, sortOrder]);

  const filtered = useMemo(() => {
    return allRecords.filter((r) => {
      const date = r.type === "supervision" ? r.supervision_date : r.coaching_date;
      const matchType =
        activeTab === "semua" ||
        (activeTab === "supervisi" && r.type === "supervision") ||
        (activeTab === "coaching" && r.type === "coaching");
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

  const totalCount = supervisions.length + coachings.length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <TeacherHeader
        teacherName={teacherInfo?.name || ""}
        schoolName={teacherInfo?.schoolName || ""}
      />

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Riwayat</h2>
            <p className="text-xs text-muted-foreground">
              {supervisions.length} supervisi · {coachings.length} coaching
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8"
            onClick={() => setSortOrder((p) => (p === "desc" ? "asc" : "desc"))}
          >
            <Calendar className="w-3 h-3" />
            {sortOrder === "desc" ? "Terbaru" : "Terlama"}
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Total", count: totalCount, color: "bg-muted" },
            { label: "Supervisi", count: supervisions.length, color: "bg-primary/10" },
            { label: "Coaching", count: coachings.length, color: "bg-secondary/30" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.color} rounded-xl p-3 text-center`}
            >
              <p className="text-2xl font-bold">{stat.count}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="semua">
                Semua
                <Badge variant="secondary" className="ml-1.5 h-4 text-[10px] px-1">
                  {totalCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="supervisi">
                Supervisi
                <Badge variant="secondary" className="ml-1.5 h-4 text-[10px] px-1">
                  {supervisions.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="coaching">
                Coaching
                <Badge variant="secondary" className="ml-1.5 h-4 text-[10px] px-1">
                  {coachings.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="month"
              className="pl-9 pr-9"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              placeholder="Filter bulan/tahun"
            />
            {searchDate && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchDate("")}
              >
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
                <SupervisionCard
                  key={`sup-${record.id}`}
                  s={record}
                  onPrint={handlePrintSingle}
                />
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
