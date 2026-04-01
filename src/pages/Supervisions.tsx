import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSchool, getTeachers, Teacher } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { getUserFriendlyError } from "@/lib/errorHandler";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, ClipboardList, Calendar, Printer, ChevronDown, ChevronUp, Pencil, Trash2, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AdminBottomNav } from "@/components/AdminBottomNav";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

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

const SCORE_MAX = SUPERVISION_COMPONENTS.length * 2; // 24

type ScoreValue = 0 | 1 | 2;

interface FormState {
  teacher_id: string;
  supervision_date: string;
  mata_pelajaran: string;
  notes: string;
  tindak_lanjut: string;
  scores: Record<string, ScoreValue>;
  remarks: Record<string, string>;
}

function getPredikat(pct: number) {
  if (pct >= 91) return { label: "Sangat Baik", color: "bg-green-500" };
  if (pct >= 81) return { label: "Baik", color: "bg-primary" };
  if (pct >= 71) return { label: "Cukup", color: "bg-yellow-500" };
  return { label: "Kurang", color: "bg-destructive" };
}

const defaultScores: Record<string, ScoreValue> = Object.fromEntries(
  SUPERVISION_COMPONENTS.map((c) => [c.key, 0])
);

export default function Supervisions() {
  const [supervisions, setSupervisions] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [principalName, setPrincipalName] = useState("");
  const [principalNip, setPrincipalNip] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<FormState>({
    teacher_id: "",
    supervision_date: new Date().toISOString().split("T")[0],
    mata_pelajaran: "",
    notes: "",
    tindak_lanjut: "",
    scores: { ...defaultScores },
    remarks: {},
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [teacherAdminLinks, setTeacherAdminLinks] = useState<Record<string, string>>({});
  const [loadingLinks, setLoadingLinks] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const [form, setForm] = useState<FormState>({
    teacher_id: "",
    supervision_date: new Date().toISOString().split("T")[0],
    mata_pelajaran: "",
    notes: "",
    tindak_lanjut: "",
    scores: { ...defaultScores },
    remarks: {},
  });

  useEffect(() => {
    if (!user?.id) { navigate("/auth"); return; }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadData = async () => {
    if (!user) return;
    try {
      const school = await getSchool(user.id);
      if (!school) { navigate("/setup-school"); return; }
      setSchoolId(school.id);
      setSchoolName(school.name);
      setSchoolAddress((school as any).address || "");
      setPrincipalName(school.principal_name);
      setPrincipalNip(school.principal_nip);

      const [teachersData, { data: supervisionsData }] = await Promise.all([
        getTeachers(school.id),
        supabase
          .from("supervisions")
          .select("*, teachers(name, nip, rank)")
          .eq("school_id", school.id)
          .order("supervision_date", { ascending: false }),
      ]);
      setTeachers(teachersData);
      setSupervisions(supervisionsData || []);
    } catch (error: any) {
      toast({ title: "Error", description: getUserFriendlyError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      teacher_id: "",
      supervision_date: new Date().toISOString().split("T")[0],
      mata_pelajaran: "",
      notes: "",
      tindak_lanjut: "",
      scores: { ...defaultScores },
      remarks: {},
    });
  };

  // Map komponen key -> field di teaching_administration
  const COMPONENT_LINK_MAP: Record<string, string> = {
    kalender_pendidikan: "calendar_link",
    program_tahunan: "annual_program_link",
    program_semester: "assessment_use_link",
    alur_tujuan_pembelajaran: "learning_flow_link",
    modul_ajar: "teaching_module_link",
    jadwal_tatap_muka: "schedule_link",
    agenda_mengajar: "daily_agenda_link",
    daftar_nilai: "grade_list_link",
    kktp: "assessment_program_link",
    absensi_siswa: "attendance_link",
    buku_pegangan_guru: "teaching_material_link",
    buku_teks_siswa: "teaching_material_link",
  };

  const fetchTeacherLinks = useCallback(async (teacherId: string) => {
    if (!teacherId) { setTeacherAdminLinks({}); return; }
    setLoadingLinks(true);
    try {
      const { data } = await supabase
        .from("teaching_administration")
        .select("*")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        const links: Record<string, string> = {};
        for (const [compKey, fieldKey] of Object.entries(COMPONENT_LINK_MAP)) {
          const val = (data as any)[fieldKey];
          if (val) links[compKey] = val;
        }
        setTeacherAdminLinks(links);
      } else {
        setTeacherAdminLinks({});
      }
    } finally {
      setLoadingLinks(false);
    }
  }, []);

  const handleScoreChange = (key: string, val: ScoreValue) => {
    setForm((prev) => ({ ...prev, scores: { ...prev.scores, [key]: val } }));
  };

  const calculateScore = (supervision: any) =>
    SUPERVISION_COMPONENTS.reduce((sum, c) => sum + (Number(supervision[c.key]) || 0), 0);

  const calculatePct = (supervision: any) =>
    Math.round((calculateScore(supervision) / SCORE_MAX) * 100);

  const openEdit = (s: any) => {
    setEditingId(s.id);
    setEditForm({
      teacher_id: s.teacher_id,
      supervision_date: s.supervision_date,
      mata_pelajaran: s.mata_pelajaran || "",
      notes: s.notes || "",
      tindak_lanjut: s.tindak_lanjut || "",
      scores: Object.fromEntries(
        SUPERVISION_COMPONENTS.map((c) => [c.key, (Number(s[c.key]) || 0) as ScoreValue])
      ),
      remarks: (s.remarks as Record<string, string>) || {},
    });
    setEditDialogOpen(true);
  };

  const handleEditScoreChange = (key: string, val: ScoreValue) => {
    setEditForm((prev) => ({ ...prev, scores: { ...prev.scores, [key]: val } }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teacher_id) return;
    setSubmitting(true);
    try {
      const payload: any = {
        school_id: schoolId,
        teacher_id: form.teacher_id,
        supervision_date: form.supervision_date,
        mata_pelajaran: form.mata_pelajaran,
        notes: form.notes,
        tindak_lanjut: form.tindak_lanjut,
        remarks: form.remarks,
        created_by: user!.id,
        ...form.scores,
      };
      const { error } = await supabase.from("supervisions").insert(payload);
      if (error) throw error;
      toast({ title: "✅ Supervisi berhasil disimpan!" });
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: getUserFriendlyError(error), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);
    try {
      const payload: any = {
        supervision_date: editForm.supervision_date,
        mata_pelajaran: editForm.mata_pelajaran,
        notes: editForm.notes,
        tindak_lanjut: editForm.tindak_lanjut,
        remarks: editForm.remarks,
        ...editForm.scores,
      };
      const { error } = await supabase.from("supervisions").update(payload).eq("id", editingId);
      if (error) throw error;
      toast({ title: "✅ Supervisi berhasil diperbarui!" });
      setEditDialogOpen(false);
      setEditingId(null);
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: getUserFriendlyError(error), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("supervisions").delete().eq("id", deleteId);
      if (error) throw error;
      toast({ title: "🗑️ Supervisi berhasil dihapus!" });
      setDeleteId(null);
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: getUserFriendlyError(error), variant: "destructive" });
    }
  };

  const formatPrintDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMMM yyyy", { locale: idLocale });
    } catch {
      return dateStr;
    }
  };

  const handlePrintSingle = (s: any) => {
    const score = calculateScore(s);
    const pct = Math.round((score / SCORE_MAX) * 100);
    const predikat = getPredikat(pct);
    const printDate = formatPrintDate(new Date().toISOString());
    const cityName = schoolAddress ? schoolAddress.split(",")[0].trim() : "............";
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Instrumen Supervisi - ${s.teachers?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 30px; color: #333; font-size: 13px; }
            h1, h2 { text-align: center; margin: 3px 0; }
            h1 { font-size: 18px; }
            h2 { font-size: 17px; }
            .info-table { width: 100%; margin-bottom: 14px; }
            .info-table td { padding: 3px 6px; }
            .info-table td:first-child { width: 200px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            td, th { padding: 6px 10px; border: 1px solid #999; }
            th { background: #f0f0f0; text-align: center; font-size: 12px; }
            .center { text-align: center; }
            .score-cell { text-align: center; font-weight: bold; }
            .predikat-box { display:inline-block; padding:2px 8px; border:1px solid #333; font-weight:bold; }
          </style>
        </head>
        <body>
          <h1>Instrumen Supervisi Akademik (Kurikulum Merdeka)</h1>
          <h2>Administrasi Pembelajaran</h2>
          <br/>
          <table class="info-table" style="border:none;">
            <tr><td>Nama Sekolah</td><td>: ${schoolName}</td></tr>
            <tr><td>Nama Guru</td><td>: ${s.teachers?.name || ""}</td></tr>
            <tr><td>NIP Guru</td><td>: ${s.teachers?.nip || "-"}</td></tr>
            <tr><td>Tanggal Supervisi</td><td>: ${formatPrintDate(s.supervision_date)}</td></tr>
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
                <th style="width:8%;">Ada tetapi tidak sesuai (1)</th>
                <th style="width:8%;">Ada dan sesuai (2)</th>
              </tr>
            </thead>
            <tbody>
              ${SUPERVISION_COMPONENTS.map((c, i) => {
                const val = Number(s[c.key]) || 0;
                const remark = (s.remarks as Record<string, string>)?.[c.key] || "";
                return `<tr>
                  <td class="center">${i + 1}</td>
                  <td>${c.label}</td>
                  <td class="center">${val === 0 ? "✓" : ""}</td>
                  <td class="center">${val === 1 ? "✓" : ""}</td>
                  <td class="center">${val === 2 ? "✓" : ""}</td>
                  <td>${remark}</td>
                </tr>`;
              }).join("")}
              <tr>
                <td colspan="2" style="font-weight:bold;">Jumlah</td>
                <td class="center">${SUPERVISION_COMPONENTS.filter(c => Number(s[c.key]) === 0).length}</td>
                <td class="center">${SUPERVISION_COMPONENTS.filter(c => Number(s[c.key]) === 1).length}</td>
                <td class="center">${SUPERVISION_COMPONENTS.filter(c => Number(s[c.key]) === 2).length}</td>
                <td></td>
              </tr>
              <tr>
                <td colspan="2" style="font-weight:bold;">Skor Total</td>
                <td class="center score-cell" colspan="3">${score}</td>
                <td></td>
              </tr>
              <tr>
                <td colspan="2" style="font-weight:bold;">Ketercapaian</td>
                <td class="center score-cell" colspan="3">${pct}% — <span class="predikat-box">${predikat.label}</span></td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <p style="font-size:12px;">Keterangan : Nilai Akhir = <u>Skor Perolehan</u> x 100 % &nbsp;&nbsp;&nbsp; Skor Maksimal (${SCORE_MAX})</p>
          <br/>
          <table style="border:none;width:100%;font-size:12px;">
            <tr><td style="border:none;width:30%;">Ketercapaian :</td><td style="border:none;">91% - 100% = Sangat Baik &nbsp;&nbsp;&nbsp; 71% - 80% = Cukup</td></tr>
            <tr><td style="border:none;"></td><td style="border:none;">81% - 90% = Baik &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Dibawah 71% = Kurang</td></tr>
          </table>
          <br/>
          <table style="border:none;">
            <tr>
              <td style="border:none;">Catatan</td>
              <td style="border:none;">: ${s.notes || "..................................................................................."}</td>
            </tr>
            <tr>
              <td style="border:none;">Tindak Lanjut</td>
              <td style="border:none;">: ${s.tindak_lanjut || "..................................................................................."}</td>
            </tr>
          </table>
          <br/><br/>
          <table style="border:none;width:100%;">
            <tr>
              <td style="border:none;width:50%;"></td>
              <td style="border:none;text-align:center;">
                ${cityName}, ${printDate}
              </td>
            </tr>
            <tr>
              <td style="border:none;text-align:center;">Guru yang di Supervisi,</td>
              <td style="border:none;text-align:center;">Kepala Sekolah / Tim Supervisi,</td>
            </tr>
            <tr>
              <td style="border:none;text-align:center;"><br/><br/><br/><br/>
                <u>${s.teachers?.name || ""}</u><br/>
                NIP. ${s.teachers?.nip || ""}
              </td>
              <td style="border:none;text-align:center;"><br/><br/><br/><br/>
                <u>${principalName}</u><br/>
                NIP. ${principalNip}
              </td>
            </tr>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  if (loading && supervisions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const ScoreTable = ({
    scores,
    onChange,
    prefix = "",
    showLinks = false,
    remarks,
    onRemarkChange,
  }: {
    scores: Record<string, ScoreValue>;
    onChange: (key: string, val: ScoreValue) => void;
    prefix?: string;
    showLinks?: boolean;
    remarks?: Record<string, string>;
    onRemarkChange?: (key: string, val: string) => void;
  }) => (
    <div>
      <p className="text-sm font-semibold mb-2">Komponen Administrasi Pembelajaran</p>
      <p className="text-xs text-muted-foreground mb-3">
        0 = Tidak Ada &nbsp;|&nbsp; 1 = Ada tetapi tidak sesuai &nbsp;|&nbsp; 2 = Ada dan sesuai
      </p>
      {showLinks && Object.keys(teacherAdminLinks).length > 0 && (
        <div className="mb-3 p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-xs font-semibold text-primary mb-1">
            📎 Link Google Drive isian guru tersedia — klik ikon di kolom Link untuk membuka
          </p>
        </div>
      )}
      {showLinks && !loadingLinks && Object.keys(teacherAdminLinks).length === 0 && form.teacher_id && (
        <div className="mb-3 p-2.5 bg-muted/40 border rounded-lg">
          <p className="text-xs text-muted-foreground">ℹ️ Guru ini belum mengisi instrumen administrasi.</p>
        </div>
      )}
      {/* Mobile: card layout */}
      <div className="space-y-2 sm:hidden">
        {SUPERVISION_COMPONENTS.map((c, i) => {
          const score = scores[c.key];
          const showRemark = score !== 2;
          return (
            <div key={c.key} className="border rounded-lg p-3 bg-background space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium flex-1">{i + 1}. {c.label}</p>
                {showLinks && teacherAdminLinks[c.key] && (
                  <a href={teacherAdminLinks[c.key]} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 text-primary hover:bg-primary/20 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                {([0, 1, 2] as ScoreValue[]).map((val) => {
                  const labels = ["Tidak Ada", "Tidak Sesuai", "Sesuai"];
                  const activeColors = ["bg-destructive text-destructive-foreground", "bg-yellow-500 text-white", "bg-green-600 text-white"];
                  const isActive = score === val;
                  return (
                    <label key={val} className={`flex-1 flex items-center justify-center gap-1.5 p-2 rounded-md border cursor-pointer text-xs font-medium transition-colors ${isActive ? activeColors[val] : "bg-muted/30 text-muted-foreground border-border"}`}>
                      <input type="radio" name={`${prefix}${c.key}`} value={val} checked={isActive} onChange={() => onChange(c.key, val)} className="sr-only" />
                      {val} — {labels[val]}
                    </label>
                  );
                })}
              </div>
              {showRemark && onRemarkChange && (
                <input type="text" placeholder="Tulis keterangan..." value={remarks?.[c.key] || ""}
                  onChange={(e) => onRemarkChange(c.key, e.target.value)}
                  className="w-full text-xs border border-border rounded px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
              )}
            </div>
          );
        })}
      </div>
      {/* Desktop: table layout */}
      <div className="hidden sm:block border rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[400px]">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left border-b w-8">No</th>
              <th className="p-2 text-left border-b">Komponen</th>
              <th className="p-2 text-center border-b w-10">0</th>
              <th className="p-2 text-center border-b w-10">1</th>
              <th className="p-2 text-center border-b w-10">2</th>
              {showLinks && <th className="p-2 text-center border-b w-14 text-xs">Link</th>}
              <th className="p-2 text-left border-b text-xs min-w-[120px]">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {SUPERVISION_COMPONENTS.map((c, i) => {
              const score = scores[c.key];
              const showRemark = score !== 2;
              return (
                <tr key={c.key} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="p-2 text-center text-muted-foreground border-b text-xs">{i + 1}</td>
                  <td className="p-2 border-b text-xs">{c.label}</td>
                  {([0, 1, 2] as ScoreValue[]).map((val) => (
                    <td key={val} className="p-2 text-center border-b">
                      <input type="radio" name={`${prefix}${c.key}`} value={val} checked={scores[c.key] === val} onChange={() => onChange(c.key, val)} className="accent-primary w-4 h-4 cursor-pointer" />
                    </td>
                  ))}
                  {showLinks && (
                    <td className="p-2 text-center border-b">
                      {teacherAdminLinks[c.key] ? (
                        <a href={teacherAdminLinks[c.key]} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </a>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                  )}
                  <td className="p-2 border-b">
                    {showRemark && onRemarkChange ? (
                      <input type="text" placeholder="Tulis keterangan..." value={remarks?.[c.key] || ""}
                        onChange={(e) => onRemarkChange(c.key, e.target.value)}
                        className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                    ) : <span className="text-xs text-muted-foreground">{remarks?.[c.key] || "—"}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(() => {
        const total = Object.values(scores).reduce((s, v) => s + v, 0);
        const pct = Math.round((total / SCORE_MAX) * 100);
        const predikat = getPredikat(pct);
        return (
          <div className="mt-3 p-3 bg-muted/30 rounded-lg flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>Skor: <strong>{total}/{SCORE_MAX}</strong></span>
            <span>Nilai: <strong>{pct}%</strong></span>
            <Badge className={`${predikat.color} text-white border-0`}>{predikat.label}</Badge>
          </div>
        );
      })()}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-24">
      {/* Header */}
      <header className="bg-primary text-primary-foreground border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="hover:bg-white/10 flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold">Supervisi Administrasi</h1>
              <p className="text-xs sm:text-sm opacity-90">{supervisions.length} data</p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-1.5 flex-shrink-0">
                  <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Buat Observasi</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl" onOpenAutoFocus={(e) => { e.preventDefault(); (document.querySelector('[type="date"]') as HTMLElement)?.focus(); }}>
              <DialogHeader>
                <DialogTitle>Instrumen Supervisi Akademik</DialogTitle>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Guru <span className="text-destructive">*</span></Label>
                    <Select value={form.teacher_id} onValueChange={(v) => { setForm((p) => ({ ...p, teacher_id: v })); fetchTeacherLinks(v); }}>
                      <SelectTrigger><SelectValue placeholder="Pilih guru" /></SelectTrigger>
                      <SelectContent>
                        {teachers.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name} — {t.nip}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tanggal Supervisi</Label>
                    <Input type="date" value={form.supervision_date}
                      onChange={(e) => setForm((p) => ({ ...p, supervision_date: e.target.value }))} />
                  </div>
                </div>

                <ScoreTable
                  scores={form.scores}
                  onChange={handleScoreChange}
                  prefix="new_"
                  showLinks={true}
                  remarks={form.remarks}
                  onRemarkChange={(key, val) => setForm(p => ({ ...p, remarks: { ...p.remarks, [key]: val } }))}
                />

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label>Catatan</Label>
                    <Textarea placeholder="Catatan hasil observasi..." rows={2}
                      value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tindak Lanjut</Label>
                    <Textarea placeholder="Rencana tindak lanjut..." rows={2}
                      value={form.tindak_lanjut} onChange={(e) => setForm((p) => ({ ...p, tindak_lanjut: e.target.value }))} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Batal</Button>
                  <Button type="submit" className="flex-1" disabled={submitting || !form.teacher_id}>
                    {submitting ? "Menyimpan..." : "Simpan Supervisi"}
                  </Button>
                </div>
              </form>
            </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" className="hover:bg-white/10" onClick={() => setLogoutDialogOpen(true)}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingId(null); }}>
            <DialogContent className="sm:max-w-2xl" onOpenAutoFocus={(e) => { e.preventDefault(); (document.querySelector('[type="date"]') as HTMLElement)?.focus(); }}>
              <DialogHeader>
                <DialogTitle>Edit Supervisi</DialogTitle>
              </DialogHeader>
              <form onSubmit={onUpdate} className="space-y-5">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                     <Label>Tanggal Supervisi</Label>
                     <Input type="date" value={editForm.supervision_date}
                       onChange={(e) => setEditForm((p) => ({ ...p, supervision_date: e.target.value }))} />
                   </div>
                 </div>

                <ScoreTable
                  scores={editForm.scores}
                  onChange={handleEditScoreChange}
                  prefix="edit_"
                  remarks={editForm.remarks}
                  onRemarkChange={(key, val) => setEditForm(p => ({ ...p, remarks: { ...p.remarks, [key]: val } }))}
                />

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label>Catatan</Label>
                    <Textarea placeholder="Catatan hasil observasi..." rows={2}
                      value={editForm.notes} onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tindak Lanjut</Label>
                    <Textarea placeholder="Rencana tindak lanjut..." rows={2}
                      value={editForm.tindak_lanjut} onChange={(e) => setEditForm((p) => ({ ...p, tindak_lanjut: e.target.value }))} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setEditDialogOpen(false)}>Batal</Button>
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Supervisi?</AlertDialogTitle>
            <AlertDialogDescription>
              Data supervisi ini akan dihapus permanen dan tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onDelete}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-3 sm:p-4 space-y-3">
        {supervisions.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <ClipboardList className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2 text-center">Belum ada supervisi</p>
              <p className="text-sm text-muted-foreground mb-4 text-center">Mulai buat instrumen supervisi pertama</p>
              <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
                <Plus className="w-4 h-4" /> Buat Supervisi
              </Button>
            </div>
          </Card>
        ) : (
          supervisions.map((s) => {
            const score = calculateScore(s);
            const pct = calculatePct(s);
            const predikat = getPredikat(pct);
            const isExpanded = expandedId === s.id;
            return (
              <Card key={s.id} className="shadow-[var(--shadow-card)]">
                <CardContent className="p-3 sm:p-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm sm:text-base leading-tight">{s.teachers?.name}</h3>
                        <Badge className={`${predikat.color} text-white border-0 text-xs`}>{predikat.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">NIP: {s.teachers?.nip}</p>
                      {s.mata_pelajaran && <p className="text-xs text-muted-foreground">Mapel: {s.mata_pelajaran}</p>}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(s.supervision_date), "dd MMM yyyy")}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-8 px-2" onClick={() => openEdit(s)}>
                        <Pencil className="w-3 h-3" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-8 px-2" onClick={() => handlePrintSingle(s)}>
                        <Printer className="w-3 h-3" />
                        <span className="hidden sm:inline">Cetak</span>
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-8 px-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                        onClick={() => setDeleteId(s.id)}>
                        <Trash2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Hapus</span>
                      </Button>
                      <Button size="sm" variant="ghost" className="px-2 h-8"
                        onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Skor {score}/{SCORE_MAX}</span>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                    <div className="w-full bg-muted rounded h-2">
                      <div className={`${predikat.color} rounded h-2 transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="mt-3 border-t pt-3 space-y-2">
                      <div className="flex flex-col gap-1.5">
                        {SUPERVISION_COMPONENTS.map((c, i) => {
                          const val = Number(s[c.key]) || 0;
                          const colors = ["text-destructive", "text-yellow-600", "text-green-600"];
                          const labels = ["Tidak Ada", "Ada, tidak sesuai", "Ada dan sesuai"];
                          return (
                            <div key={c.key} className="flex items-center justify-between text-xs py-0.5 gap-2">
                              <span className="text-muted-foreground">{i + 1}. {c.label}</span>
                              <Badge variant="outline" className={`text-xs ${colors[val]} flex-shrink-0`}>{labels[val]}</Badge>
                            </div>
                          );
                        })}
                      </div>
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
          })
        )}
      </main>

      <AdminBottomNav />

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari Aplikasi?</AlertDialogTitle>
            <AlertDialogDescription>Apakah Anda yakin ingin keluar?</AlertDialogDescription>
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
