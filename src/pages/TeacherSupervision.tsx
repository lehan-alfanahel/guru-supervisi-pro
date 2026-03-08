import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherBottomNav } from "@/components/TeacherBottomNav";
import { TeacherHeader } from "@/components/TeacherHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Printer, CheckCircle2, XCircle, Clock, BookOpen,
  Link2, PlusCircle, ChevronDown, ChevronUp, ClipboardList, ExternalLink
} from "lucide-react";
import { ATP_SECTIONS, ATP_ALL_KEYS } from "@/pages/SupervisionATP";

interface TeacherInfo {
  id: string;
  name: string;
  nip: string;
  rank: string;
  schoolId: string;
  schoolName: string;
  schoolAddress: string;
  teacherAccountId: string;
  principalName: string;
  principalNip: string;
}

interface AdministrationData {
  id: string;
  teaching_hours: string;
  semester_class: string;
  calendar_link: string;
  annual_program_link: string;
  assessment_use_link: string;
  learning_flow_link: string;
  teaching_module_link: string;
  teaching_material_link: string;
  schedule_link: string;
  assessment_program_link: string;
  grade_list_link: string;
  daily_agenda_link: string;
  attendance_link: string;
  created_at: string;
}

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

const SUPERVISION_COMPONENTS = [
  { key: "kalender_pendidikan", label: "Kalender Pendidikan" },
  { key: "program_tahunan", label: "Program Tahunan" },
  { key: "program_semester", label: "Program Semester" },
  { key: "alur_tujuan_pembelajaran", label: "Alur Tujuan Pembelajaran" },
  { key: "modul_ajar", label: "Modul Ajar" },
  { key: "jadwal_tatap_muka", label: "Jadwal Tatap Muka" },
  { key: "agenda_mengajar", label: "Agenda Mengajar" },
  { key: "daftar_nilai", label: "Daftar Nilai" },
  { key: "kktp", label: "KKTP" },
  { key: "absensi_siswa", label: "Absensi Siswa" },
  { key: "buku_pegangan_guru", label: "Buku Pegangan Guru" },
  { key: "buku_teks_siswa", label: "Buku Teks Siswa" },
];
const SCORE_MAX = SUPERVISION_COMPONENTS.length * 2;

function getPredikat(pct: number) {
  if (pct >= 91) return { label: "Sangat Baik", color: "bg-green-500" };
  if (pct >= 81) return { label: "Baik", color: "bg-primary" };
  if (pct >= 71) return { label: "Cukup", color: "bg-yellow-500" };
  return { label: "Kurang", color: "bg-destructive" };
}

export default function TeacherSupervision() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Teaching Administration (Google Drive links)
  const [administrationRecords, setAdministrationRecords] = useState<AdministrationData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedAdminRecord, setExpandedAdminRecord] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    teachingHours: "", semesterClass: "",
    calendarLink: "", annualProgramLink: "", assessmentUseLink: "",
    learningFlowLink: "", teachingModuleLink: "", teachingMaterialLink: "",
    scheduleLink: "", assessmentProgramLink: "", gradeListLink: "",
    dailyAgendaLink: "", attendanceLink: "",
  });

  // Supervisions from principal
  const [supervisions, setSupervisions] = useState<any[]>([]);
  const [expandedSupId, setExpandedSupId] = useState<string | null>(null);
  // ATP Supervisions from principal
  const [atpSupervisions, setAtpSupervisions] = useState<any[]>([]);
  const [expandedAtpId, setExpandedAtpId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const { data: teacherAccount, error: accountError } = await supabase
        .from("teacher_accounts")
        .select("id, teachers(id, name, nip, rank, school_id)")
        .eq("user_id", user?.id)
        .single();

      if (accountError) throw accountError;
      if (!teacherAccount?.teachers) return;

      const teacher = Array.isArray(teacherAccount.teachers)
        ? teacherAccount.teachers[0]
        : teacherAccount.teachers;

      const { data: school } = await supabase
        .from("schools")
        .select("name, address, principal_name, principal_nip")
        .eq("id", teacher.school_id)
        .single();

      setTeacherInfo({
        id: teacher.id,
        name: teacher.name,
        nip: teacher.nip,
        rank: teacher.rank,
        schoolId: teacher.school_id,
        schoolName: school?.name || "",
        schoolAddress: (school as any)?.address || "",
        teacherAccountId: teacherAccount.id,
        principalName: school?.principal_name || "",
        principalNip: school?.principal_nip || "",
      });

      const [{ data: records }, { data: sups }, { data: atpData }] = await Promise.all([
        supabase.from("teaching_administration").select("*")
          .eq("teacher_account_id", teacherAccount.id)
          .order("created_at", { ascending: false }),
        supabase.from("supervisions").select("*")
          .eq("teacher_id", teacher.id)
          .order("supervision_date", { ascending: false }),
        supabase.from("atp_supervisions" as any).select("*")
          .eq("teacher_id", teacher.id)
          .order("supervision_date", { ascending: false }),
      ]);

      setAdministrationRecords(records || []);
      setSupervisions(sups || []);
      setAtpSupervisions(atpData || []);
      if (!records || records.length === 0) setShowForm(true);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherInfo) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("teaching_administration").insert({
        school_id: teacherInfo.schoolId,
        teacher_id: teacherInfo.id,
        teacher_account_id: teacherInfo.teacherAccountId,
        teaching_hours: formData.teachingHours,
        semester_class: formData.semesterClass,
        calendar_link: formData.calendarLink,
        annual_program_link: formData.annualProgramLink,
        assessment_use_link: formData.assessmentUseLink,
        learning_flow_link: formData.learningFlowLink,
        teaching_module_link: formData.teachingModuleLink,
        teaching_material_link: formData.teachingMaterialLink,
        schedule_link: formData.scheduleLink,
        assessment_program_link: formData.assessmentProgramLink,
        grade_list_link: formData.gradeListLink,
        daily_agenda_link: formData.dailyAgendaLink,
        attendance_link: formData.attendanceLink,
      });
      if (error) throw error;
      toast({ title: "✅ Data berhasil disimpan!", description: "Instrumen administrasi telah tersimpan." });
      setFormData({
        teachingHours: "", semesterClass: "", calendarLink: "", annualProgramLink: "",
        assessmentUseLink: "", learningFlowLink: "", teachingModuleLink: "", teachingMaterialLink: "",
        scheduleLink: "", assessmentProgramLink: "", gradeListLink: "", dailyAgendaLink: "", attendanceLink: "",
      });
      setShowForm(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateCompleteness = (record: AdministrationData) => {
    const filled = ADMIN_FIELDS.filter(f => record[f.key as keyof AdministrationData]).length;
    return Math.round((filled / ADMIN_FIELDS.length) * 100);
  };

  const calculateSupScore = (s: any) =>
    SUPERVISION_COMPONENTS.reduce((sum, c) => sum + (Number(s[c.key]) || 0), 0);

  const handlePrintAdmin = (record: AdministrationData) => {
    if (!teacherInfo) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Rekap Administrasi - ${teacherInfo.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 30px; color: #333; }
            h1, h2 { text-align: center; margin: 4px 0; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            td, th { padding: 8px 12px; border: 1px solid #ccc; font-size: 13px; }
            th { background: #f5f5f5; font-weight: bold; }
            a { color: #0066cc; }
            .status-ada { color: green; font-weight: bold; }
            .status-tidak { color: red; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>REKAP ADMINISTRASI PEMBELAJARAN</h1>
            <h2>${teacherInfo.schoolName}</h2>
          </div>
          <table>
            <tr><td style="width:35%;background:#f5f5f5;font-weight:bold;">Nama Guru</td><td>${teacherInfo.name}</td></tr>
            <tr><td style="background:#f5f5f5;font-weight:bold;">NIP</td><td>${teacherInfo.nip}</td></tr>
            <tr><td style="background:#f5f5f5;font-weight:bold;">Pangkat/Golongan</td><td>${teacherInfo.rank}</td></tr>
            <tr><td style="background:#f5f5f5;font-weight:bold;">Semester/Kelas</td><td>${record.semester_class || "-"}</td></tr>
            <tr><td style="background:#f5f5f5;font-weight:bold;">Jam Tatap Muka</td><td>${record.teaching_hours || "-"}</td></tr>
            <tr><td style="background:#f5f5f5;font-weight:bold;">Tanggal Input</td><td>${format(new Date(record.created_at), "dd MMMM yyyy")}</td></tr>
          </table>
          <br/>
          <table>
            <tr><th style="width:5%;">No</th><th>Komponen Administrasi</th><th style="width:10%;">Status</th><th>Link</th></tr>
            ${ADMIN_FIELDS.map((f, i) => {
              const val = record[f.key as keyof AdministrationData];
              return `<tr>
                <td style="text-align:center;">${i + 1}</td>
                <td>${f.label}</td>
                <td class="${val ? 'status-ada' : 'status-tidak'}" style="text-align:center;">${val ? 'Ada' : 'Tidak Ada'}</td>
                <td>${val ? `<a href="${val}">${val}</a>` : '-'}</td>
              </tr>`;
            }).join("")}
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const handlePrintSupervision = (s: any) => {
    if (!teacherInfo) return;
    const score = calculateSupScore(s);
    const pct = Math.round((score / SCORE_MAX) * 100);
    const predikat = getPredikat(pct);
    const printDate = format(new Date(), "dd MMMM yyyy", { locale: idLocale });
    const cityName = (teacherInfo as any).schoolAddress
      ? (teacherInfo as any).schoolAddress.split(",")[0].trim()
      : "............";
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Instrumen Supervisi - ${teacherInfo.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 30px; color: #333; font-size: 13px; }
            h1, h2 { text-align: center; margin: 3px 0; }
            h1 { font-size: 14px; }
            h2 { font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            td, th { padding: 6px 10px; border: 1px solid #999; }
            th { background: #f0f0f0; text-align: center; font-size: 12px; }
            .center { text-align: center; }
            .predikat-box { display:inline; padding:2px 6px; border:1px solid #333; font-weight:bold; }
          </style>
        </head>
        <body>
          <h1>Instrumen Supervisi Akademik (Kurikulum Merdeka)</h1>
          <h2>Administrasi Pembelajaran</h2>
          <br/>
          <table style="border:none;">
            <tr><td style="border:none;width:200px;">Nama Sekolah</td><td style="border:none;">: ${teacherInfo.schoolName}</td></tr>
            <tr><td style="border:none;">Alamat Sekolah</td><td style="border:none;">: ${(teacherInfo as any).schoolAddress || "-"}</td></tr>
            <tr><td style="border:none;">Nama Guru</td><td style="border:none;">: ${teacherInfo.name}</td></tr>
            <tr><td style="border:none;">NIP Guru</td><td style="border:none;">: ${teacherInfo.nip}</td></tr>
            <tr><td style="border:none;">Mata Pelajaran</td><td style="border:none;">: ${s.mata_pelajaran || ""}</td></tr>
            <tr><td style="border:none;">Tanggal Supervisi</td><td style="border:none;">: ${format(new Date(s.supervision_date), "dd MMMM yyyy", { locale: idLocale })}</td></tr>
          </table>
          <table>
            <thead>
              <tr>
                <th rowspan="2" style="width:5%;">No</th>
                <th rowspan="2">Komponen Administrasi Pembelajaran</th>
                <th colspan="3">Kondisi</th>
                <th rowspan="2" style="width:20%;">Keterangan</th>
              </tr>
              <tr>
                <th style="width:8%;">Tidak Ada (0)</th>
                <th style="width:10%;">Ada tetapi tidak sesuai (1)</th>
                <th style="width:8%;">Ada dan sesuai (2)</th>
              </tr>
            </thead>
            <tbody>
              ${SUPERVISION_COMPONENTS.map((c, i) => {
                const val = Number(s[c.key]) || 0;
                return `<tr>
                  <td class="center">${i + 1}</td>
                  <td>${c.label}</td>
                  <td class="center">${val === 0 ? "✓" : ""}</td>
                  <td class="center">${val === 1 ? "✓" : ""}</td>
                  <td class="center">${val === 2 ? "✓" : ""}</td>
                  <td></td>
                </tr>`;
              }).join("")}
              <tr><td colspan="2" style="font-weight:bold;">Skor Total</td><td class="center" colspan="3" style="font-weight:bold;">${score}</td><td></td></tr>
              <tr><td colspan="2" style="font-weight:bold;">Ketercapaian</td><td class="center" colspan="3" style="font-weight:bold;">${pct}% — <span class="predikat-box">${predikat.label}</span></td><td></td></tr>
            </tbody>
          </table>
          <p style="font-size:12px;">Keterangan : Nilai Akhir = Skor Perolehan / ${SCORE_MAX} x 100%</p>
          <br/>
          <table style="border:none;width:100%;font-size:12px;">
            <tr><td style="border:none;width:30%;">Ketercapaian :</td><td style="border:none;">91% - 100% = Sangat Baik &nbsp;&nbsp;&nbsp; 71% - 80% = Cukup</td></tr>
            <tr><td style="border:none;"></td><td style="border:none;">81% - 90% = Baik &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Dibawah 71% = Kurang</td></tr>
          </table>
          <br/>
          <table style="border:none;">
            <tr><td style="border:none;">Catatan</td><td style="border:none;">: ${s.notes || "..................................................................................."}</td></tr>
            <tr><td style="border:none;">Tindak Lanjut</td><td style="border:none;">: ${s.tindak_lanjut || "..................................................................................."}</td></tr>
          </table>
          <br/><br/>
          <table style="border:none;width:100%;">
            <tr>
              <td style="border:none;width:50%;"></td>
              <td style="border:none;text-align:center;">${cityName}, ${printDate}</td>
            </tr>
            <tr>
              <td style="border:none;text-align:center;">Guru yang di Supervisi,</td>
              <td style="border:none;text-align:center;">Kepala Sekolah/ Tim Supervisi,</td>
            </tr>
            <tr>
              <td style="border:none;text-align:center;"><br/><br/><br/><br/>
                <u>${teacherInfo.name}</u><br/>NIP. ${teacherInfo.nip}
              </td>
              <td style="border:none;text-align:center;"><br/><br/><br/><br/>
                <u>${teacherInfo.principalName}</u><br/>NIP. ${teacherInfo.principalNip}
              </td>
            </tr>
          </table>
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

  if (!teacherInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Data tidak ditemukan</CardTitle></CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <TeacherHeader teacherName={teacherInfo.name} schoolName={teacherInfo.schoolName} />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Teacher Info */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Nama Guru</p>
                <p className="font-medium">{teacherInfo.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">NIP</p>
                <p className="font-medium">{teacherInfo.nip}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pangkat/Golongan</p>
                <p className="font-medium">{teacherInfo.rank}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sekolah</p>
                <p className="font-medium truncate">{teacherInfo.schoolName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="administrasi">
          <TabsList className="w-full">
            <TabsTrigger value="administrasi" className="flex-1 text-xs">
              Administrasi
            </TabsTrigger>
            <TabsTrigger value="supervisi" className="flex-1 text-xs">
              Supervisi
              {supervisions.length > 0 && (
                <Badge className="ml-1.5 bg-primary/20 text-primary border-0 text-xs">{supervisions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="atp" className="flex-1 text-xs">
              ATP
            </TabsTrigger>
          </TabsList>

          {/* ── TAB 1: INSTRUMEN ADMINISTRASI (Google Drive Links) ── */}
          <TabsContent value="administrasi" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Instrumen Administrasi</h2>
                <p className="text-xs text-muted-foreground">{administrationRecords.length} data tersimpan</p>
              </div>
              <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
                <PlusCircle className="w-4 h-4" />
                {showForm ? "Batal" : "Tambah Data"}
              </Button>
            </div>

            {/* Form */}
            {showForm && (
              <Card className="border-primary/30">
                <CardContent className="pt-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="teachingHours" className="text-sm">Jam Tatap Muka</Label>
                        <Input id="teachingHours" placeholder="Contoh: 24"
                          value={formData.teachingHours}
                          onChange={(e) => setFormData({ ...formData, teachingHours: e.target.value })}
                          required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="semesterClass" className="text-sm">Semester/Kelas</Label>
                        <Input id="semesterClass" placeholder="Smt 1 / Kelas 5"
                          value={formData.semesterClass}
                          onChange={(e) => setFormData({ ...formData, semesterClass: e.target.value })}
                          required />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">Link Google Drive per Komponen</p>
                      </div>
                      {[
                        { id: "calendarLink", label: ADMIN_FIELDS[0].label, icon: ADMIN_FIELDS[0].icon, key: "calendarLink" },
                        { id: "annualProgramLink", label: ADMIN_FIELDS[1].label, icon: ADMIN_FIELDS[1].icon, key: "annualProgramLink" },
                        { id: "assessmentUseLink", label: ADMIN_FIELDS[2].label, icon: ADMIN_FIELDS[2].icon, key: "assessmentUseLink" },
                        { id: "learningFlowLink", label: ADMIN_FIELDS[3].label, icon: ADMIN_FIELDS[3].icon, key: "learningFlowLink" },
                        { id: "teachingModuleLink", label: ADMIN_FIELDS[4].label, icon: ADMIN_FIELDS[4].icon, key: "teachingModuleLink" },
                        { id: "teachingMaterialLink", label: ADMIN_FIELDS[5].label, icon: ADMIN_FIELDS[5].icon, key: "teachingMaterialLink" },
                        { id: "scheduleLink", label: ADMIN_FIELDS[6].label, icon: ADMIN_FIELDS[6].icon, key: "scheduleLink" },
                        { id: "assessmentProgramLink", label: ADMIN_FIELDS[7].label, icon: ADMIN_FIELDS[7].icon, key: "assessmentProgramLink" },
                        { id: "gradeListLink", label: ADMIN_FIELDS[8].label, icon: ADMIN_FIELDS[8].icon, key: "gradeListLink" },
                        { id: "dailyAgendaLink", label: ADMIN_FIELDS[9].label, icon: ADMIN_FIELDS[9].icon, key: "dailyAgendaLink" },
                        { id: "attendanceLink", label: ADMIN_FIELDS[10].label, icon: ADMIN_FIELDS[10].icon, key: "attendanceLink" },
                      ].map((field) => (
                        <div key={field.id} className="space-y-1.5">
                          <Label htmlFor={field.id} className="text-xs text-muted-foreground">
                            {field.icon} {field.label}
                          </Label>
                          <Input
                            id={field.id}
                            type="url"
                            placeholder="https://drive.google.com/..."
                            value={formData[field.key as keyof typeof formData]}
                            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                            required
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Batal</Button>
                      <Button type="submit" className="flex-1" disabled={submitting}>
                        {submitting ? "Menyimpan..." : "SIMPAN DATA"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Records */}
            {administrationRecords.length > 0 ? (
              <div className="space-y-3">
                {administrationRecords.map((record, index) => {
                  const pct = calculateCompleteness(record);
                  const isExpanded = expandedAdminRecord === record.id;
                  return (
                    <Card key={record.id} className="shadow-[var(--shadow-card)]">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant={pct === 100 ? "default" : pct >= 60 ? "secondary" : "destructive"} className="text-xs">
                                {pct}% Lengkap
                              </Badge>
                              {index === 0 && <Badge variant="outline" className="text-xs">Terbaru</Badge>}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                              <Clock className="w-3 h-3" />
                              {format(new Date(record.created_at), "dd MMM yyyy, HH:mm")}
                            </div>
                            <p className="text-sm font-medium mt-1">
                              {record.semester_class} · {record.teaching_hours} jam/minggu
                            </p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handlePrintAdmin(record)}>
                              <Printer className="w-3 h-3" /> Cetak
                            </Button>
                            <Button size="sm" variant="ghost" className="px-2" onClick={() => setExpandedAdminRecord(isExpanded ? null : record.id)}>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {ADMIN_FIELDS.filter(f => record[f.key as keyof AdministrationData]).length} dari {ADMIN_FIELDS.length} komponen terisi
                          </p>
                        </div>

                        {!isExpanded && (
                          <div className="grid grid-cols-2 gap-1 mt-3">
                            {ADMIN_FIELDS.slice(0, 6).map(f => {
                              const val = record[f.key as keyof AdministrationData];
                              return (
                                <div key={f.key} className={`flex items-center gap-1.5 text-xs ${val ? "text-green-700" : "text-muted-foreground"}`}>
                                  {val
                                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                    : <XCircle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                                  <span className="truncate">{f.label.split(" ").slice(0, 2).join(" ")}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {isExpanded && (
                          <div className="mt-3 space-y-1.5 border-t pt-3">
                            {ADMIN_FIELDS.map((f, i) => {
                              const val = record[f.key as keyof AdministrationData];
                              return (
                                <div key={f.key} className="flex items-start gap-2 text-sm">
                                  <span className="text-xs text-muted-foreground w-5 flex-shrink-0 mt-0.5">{i + 1}.</span>
                                  {val
                                    ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    : <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-medium ${val ? "text-foreground" : "text-muted-foreground"}`}>{f.label}</p>
                                    {val && (
                                      <a href={String(val)} target="_blank" rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline truncate flex items-center gap-1">
                                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{String(val)}</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : !showForm ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold mb-1">Belum ada data administrasi</p>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Lengkapi instrumen administrasi pembelajaran Anda
                  </p>
                  <Button onClick={() => setShowForm(true)} className="gap-1.5">
                    <PlusCircle className="w-4 h-4" /> Isi Sekarang
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          {/* ── TAB 2: HASIL SUPERVISI DARI KEPALA SEKOLAH ── */}
          <TabsContent value="supervisi" className="space-y-4 mt-4">
            <div>
              <h2 className="text-base font-bold">Hasil Supervisi</h2>
              <p className="text-xs text-muted-foreground">{supervisions.length} penilaian dari kepala sekolah</p>
            </div>

            {supervisions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ClipboardList className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold mb-1">Belum ada hasil supervisi</p>
                  <p className="text-sm text-muted-foreground text-center">
                    Data akan muncul setelah kepala sekolah melakukan penilaian
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {supervisions.map((s, index) => {
                  const score = calculateSupScore(s);
                  const pct = Math.round((score / SCORE_MAX) * 100);
                  const predikat = getPredikat(pct);
                  const isExpanded = expandedSupId === s.id;
                  const componentColors = ["text-destructive", "text-yellow-600", "text-green-600"];
                  const componentLabels = ["Tidak Ada", "Ada, tdk sesuai", "Ada & sesuai"];

                  return (
                    <Card key={s.id} className="shadow-[var(--shadow-card)]">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`${predikat.color} text-white border-0 text-xs`}>{predikat.label}</Badge>
                              {index === 0 && <Badge variant="outline" className="text-xs">Terbaru</Badge>}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                              <Clock className="w-3 h-3" />
                              {format(new Date(s.supervision_date), "dd MMMM yyyy")}
                            </div>
                            {s.mata_pelajaran && (
                              <p className="text-sm font-medium mt-1">Mapel: {s.mata_pelajaran}</p>
                            )}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handlePrintSupervision(s)}>
                              <Printer className="w-3 h-3" /> Cetak
                            </Button>
                            <Button size="sm" variant="ghost" className="px-2" onClick={() => setExpandedSupId(isExpanded ? null : s.id)}>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Skor {score}/{SCORE_MAX}</span>
                            <span className="font-semibold">{pct}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className={`${predikat.color} rounded-full h-2 transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 border-t pt-3 space-y-1.5">
                            {SUPERVISION_COMPONENTS.map((c, i) => {
                              const val = Number(s[c.key]) || 0;
                              return (
                                <div key={c.key} className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">{i + 1}. {c.label}</span>
                                  <Badge variant="outline" className={`text-xs ${componentColors[val]}`}>
                                    {val} — {componentLabels[val]}
                                  </Badge>
                                </div>
                              );
                            })}
                            {s.notes && (
                              <div className="pt-2 border-t">
                                <p className="text-xs font-medium text-muted-foreground">Catatan:</p>
                                <p className="text-sm">{s.notes}</p>
                              </div>
                            )}
                            {s.tindak_lanjut && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Tindak Lanjut:</p>
                                <p className="text-sm">{s.tindak_lanjut}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <TeacherBottomNav />
    </div>
  );
}
