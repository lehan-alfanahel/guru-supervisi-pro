import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSchool, getTeachers, Teacher } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { getUserFriendlyError } from "@/lib/errorHandler";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, ChevronDown, ChevronUp, Pencil, Trash2, Printer, ClipboardList, Calendar, LogOut } from "lucide-react";
import { AdminBottomNav } from "@/components/AdminBottomNav";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// ─── ATP Components Definition ────────────────────────────────────────────────
export const ATP_SECTIONS = [
  {
    section: "A",
    title: "Identitas ATP",
    items: [
      { key: "a1", num: 1, label: "Mencantumkan: nama sekolah, mata pelajaran, Kelas, Semester dan CP." },
    ],
  },
  {
    section: "B",
    title: "Peta Kompetensi dan Tujuan Pembelajaran",
    items: [
      { key: "b2", num: 2, label: "Peta Kompetensi sesuai fase usia / pembelajaran." },
      { key: "b3", num: 3, label: "Capaian Pembelajaran." },
      { key: "b4", num: 4, label: "Tujuan Pembelajaran." },
    ],
  },
  {
    section: "C",
    title: "Komponen ATP",
    items: [
      { key: "c5", num: 5, label: "ATP mencakup komponen kompetensi." },
      { key: "c6", num: 6, label: "ATP mencakup komponen konten." },
      { key: "c7", num: 7, label: "ATP mencakup komponen variasi." },
    ],
  },
  {
    section: "D",
    title: "Kriteria ATP",
    items: [
      { key: "d8", num: 8, label: "Menggambarkan urutan pengembangan kompetensi yang harus dikuasai peserta didik." },
      { key: "d9", num: 9, label: "Alur tujuan pembelajaran dalam satu fase menggambarkan cakupan dan tahapan pembelajaran yang linear dari awal hingga akhir fase." },
      { key: "d10", num: 10, label: "Alur tujuan pembelajaran pada keseluruhan fase menggambarkan cakupan dan tahapan pembelajaran yang menggambarkan tahapan perkembangan kompetensi antarfase dan jenjang." },
      { key: "d11", num: 11, label: "Identifikasi elemen dan atau sub elemen Profil Pelajar Pancasila yang sesuai dengan tujuan pembelajaran yang dirumuskan." },
      { key: "d12", num: 12, label: "Alur Tujuan Pembelajaran." },
    ],
  },
];

export const ATP_ALL_KEYS = ATP_SECTIONS.flatMap(s => s.items.map(i => i.key));
const ATP_SCORE_MAX = ATP_ALL_KEYS.length * 2; // 24

type ScoreVal = 0 | 1 | 2;

function defaultScores(): Record<string, ScoreVal> {
  return Object.fromEntries(ATP_ALL_KEYS.map(k => [k, 0 as ScoreVal]));
}

function calcTotal(scores: Record<string, ScoreVal>) {
  return Object.values(scores).reduce((s, v) => s + v, 0);
}

function getPredikat(pct: number) {
  if (pct >= 91) return { label: "Sangat Baik", color: "bg-green-500" };
  if (pct >= 81) return { label: "Baik", color: "bg-primary" };
  if (pct >= 71) return { label: "Cukup", color: "bg-yellow-500" };
  return { label: "Kurang", color: "bg-destructive" };
}

interface FormState {
  teacher_id: string;
  supervision_date: string;
  mata_pelajaran: string;
  kelas_semester: string;
  notes: string;
  tindak_lanjut: string;
  scores: Record<string, ScoreVal>;
  remarks: Record<string, string>;
}

function emptyForm(): FormState {
  return {
    teacher_id: "",
    supervision_date: new Date().toISOString().split("T")[0],
    mata_pelajaran: "",
    kelas_semester: "",
    notes: "",
    tindak_lanjut: "",
    scores: defaultScores(),
    remarks: {},
  };
}

// ─── Score Table Component ────────────────────────────────────────────────────
function ATPScoreTable({ scores, remarks = {}, prefix = "", onChange, onRemarkChange }: {
  scores: Record<string, ScoreVal>;
  remarks?: Record<string, string>;
  prefix?: string;
  onChange: (key: string, val: ScoreVal) => void;
  onRemarkChange?: (key: string, val: string) => void;
}) {
  const scoreOptions = [
    { val: 2 as ScoreVal, label: "Sesuai", activeClass: "bg-green-600 text-white border-green-600" },
    { val: 1 as ScoreVal, label: "Tdk Sesuai", activeClass: "bg-yellow-500 text-white border-yellow-500" },
    { val: 0 as ScoreVal, label: "Tidak Ada", activeClass: "bg-destructive text-destructive-foreground border-destructive" },
  ];
  return (
    <div>
      {/* Mobile: card layout */}
      <div className="space-y-3 sm:hidden">
        {ATP_SECTIONS.map((sec) => (
          <div key={sec.section}>
            <div className="px-3 py-2 bg-primary/10 rounded-t-lg">
              <p className="text-xs font-bold text-primary">{sec.section}. {sec.title}</p>
            </div>
            <div className="border border-t-0 rounded-b-lg divide-y">
              {sec.items.map((item) => {
                const score = scores[item.key] ?? 0;
                const showRemark = score !== 2;
                return (
                  <div key={item.key} className="p-3 space-y-2">
                    <p className="text-xs font-medium">{item.num}. {item.label}</p>
                    <div className="flex gap-1.5">
                      {scoreOptions.map(({ val, label, activeClass }) => (
                        <label key={val} className={`flex-1 flex items-center justify-center py-1.5 px-1 rounded border cursor-pointer text-[11px] font-medium transition-colors ${score === val ? activeClass : "bg-muted/30 text-muted-foreground border-border"}`}>
                          <input type="radio" name={`${prefix}${item.key}`} value={val} checked={score === val} onChange={() => onChange(item.key, val)} className="sr-only" />
                          {val} — {label}
                        </label>
                      ))}
                    </div>
                    {showRemark && onRemarkChange && (
                      <input type="text" placeholder="Tulis keterangan..." value={remarks[item.key] || ""}
                        onChange={(e) => onRemarkChange(item.key, e.target.value)}
                        className="w-full text-xs border border-border rounded px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                    )}
                    {!onRemarkChange && remarks[item.key] && (
                      <p className="text-xs text-muted-foreground italic">Ket: {remarks[item.key]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {/* Desktop: table layout */}
      <div className="hidden sm:block border rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-center border-b w-8 text-xs">No</th>
              <th className="p-2 text-left border-b text-xs">Komponen / Indikator</th>
              <th colSpan={3} className="p-2 text-center border-b text-xs">Penilaian</th>
              <th className="p-2 text-left border-b text-xs">Keterangan</th>
            </tr>
            <tr className="bg-muted/30">
              <th className="p-1 border-b" colSpan={2}></th>
              <th className="p-1 text-center border-b text-[10px] text-muted-foreground w-14">Sesuai<br/>(2)</th>
              <th className="p-1 text-center border-b text-[10px] text-muted-foreground w-16">Tidak Sesuai<br/>(1)</th>
              <th className="p-1 text-center border-b text-[10px] text-muted-foreground w-12">Tidak<br/>(0)</th>
              <th className="p-1 border-b"></th>
            </tr>
          </thead>
          <tbody>
            {ATP_SECTIONS.map((sec) => (
              <>
                <tr key={`sec-${sec.section}`} className="bg-primary/10">
                  <td colSpan={6} className="p-2 font-bold text-xs text-primary border-b">{sec.section}. {sec.title}</td>
                </tr>
                {sec.items.map((item, idx) => {
                  const score = scores[item.key] ?? 0;
                  const showRemark = score !== 2;
                  return (
                    <tr key={item.key} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="p-2 text-center text-xs text-muted-foreground border-b">{item.num}</td>
                      <td className="p-2 text-xs border-b">{item.label}</td>
                      {([2, 1, 0] as ScoreVal[]).map((val) => (
                        <td key={val} className="p-2 text-center border-b">
                          <input type="radio" name={`${prefix}${item.key}`} value={val} checked={score === val} onChange={() => onChange(item.key, val)} className="accent-primary w-4 h-4 cursor-pointer" />
                        </td>
                      ))}
                      <td className="p-2 border-b min-w-[120px]">
                        {showRemark && onRemarkChange ? (
                          <input type="text" placeholder="Tulis keterangan..." value={remarks[item.key] || ""}
                            onChange={(e) => onRemarkChange(item.key, e.target.value)}
                            className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                        ) : <span className="text-xs text-muted-foreground">{remarks[item.key] || "—"}</span>}
                      </td>
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SupervisionATP() {
  const [atpList, setAtpList] = useState<any[]>([]);
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editForm, setEditForm] = useState<FormState>(emptyForm());

  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

      const [teachersData, { data: atpData }] = await Promise.all([
        getTeachers(school.id),
        supabase
          .from("atp_supervisions" as any)
          .select("*, teachers(name, nip)")
          .eq("school_id", school.id)
          .order("supervision_date", { ascending: false }),
      ]);
      setTeachers(teachersData);
      setAtpList(atpData || []);
    } catch (error: any) {
      toast({ title: "Error", description: getUserFriendlyError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const rowToScores = (row: any): Record<string, ScoreVal> => {
    return Object.fromEntries(
      ATP_ALL_KEYS.map(k => {
        const v = Number(row[k]);
        return [k, (v === 0 || v === 1 || v === 2 ? v : 0) as ScoreVal];
      })
    );
  };

  const rowToRemarks = (row: any): Record<string, string> => {
    if (!row.remarks) return {};
    if (typeof row.remarks === "string") {
      try { return JSON.parse(row.remarks); } catch { return {}; }
    }
    return row.remarks as Record<string, string>;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teacher_id) { toast({ title: "Pilih guru terlebih dahulu", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const payload: any = {
        school_id: schoolId,
        teacher_id: form.teacher_id,
        created_by: user!.id,
        supervision_date: form.supervision_date,
        mata_pelajaran: form.mata_pelajaran,
        kelas_semester: form.kelas_semester,
        notes: form.notes,
        tindak_lanjut: form.tindak_lanjut,
        remarks: form.remarks,
        ...form.scores,
      };
      const { error } = await supabase.from("atp_supervisions" as any).insert(payload);
      if (error) throw error;
      toast({ title: "✅ Supervisi ATP berhasil disimpan!" });
      setDialogOpen(false);
      setForm(emptyForm());
      loadData();
    } catch (err: any) {
      toast({ title: "Error", description: getUserFriendlyError(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (row: any) => {
    setEditingId(row.id);
    setEditForm({
      teacher_id: row.teacher_id,
      supervision_date: row.supervision_date,
      mata_pelajaran: row.mata_pelajaran || "",
      kelas_semester: row.kelas_semester || "",
      notes: row.notes || "",
      tindak_lanjut: row.tindak_lanjut || "",
      scores: rowToScores(row),
      remarks: rowToRemarks(row),
    });
    setEditDialogOpen(true);
  };

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);
    try {
      const payload: any = {
        supervision_date: editForm.supervision_date,
        mata_pelajaran: editForm.mata_pelajaran,
        kelas_semester: editForm.kelas_semester,
        notes: editForm.notes,
        tindak_lanjut: editForm.tindak_lanjut,
        remarks: editForm.remarks,
        ...editForm.scores,
      };
      const { error } = await supabase.from("atp_supervisions" as any).update(payload).eq("id", editingId);
      if (error) throw error;
      toast({ title: "✅ Supervisi ATP berhasil diperbarui!" });
      setEditDialogOpen(false);
      setEditingId(null);
      loadData();
    } catch (err: any) {
      toast({ title: "Error", description: getUserFriendlyError(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("atp_supervisions" as any).delete().eq("id", deleteId);
    if (error) { toast({ title: "Gagal menghapus", variant: "destructive" }); return; }
    toast({ title: "🗑️ Data ATP berhasil dihapus!" });
    setDeleteId(null);
    loadData();
  };

  const handlePrint = (row: any) => {
    const scores = rowToScores(row);
    const remarks = rowToRemarks(row);
    const total = calcTotal(scores);
    const pct = Math.round((total / ATP_SCORE_MAX) * 100);
    const predikat = getPredikat(pct);
    const printDate = format(new Date(row.supervision_date + "T00:00:00"), "dd MMMM yyyy", { locale: idLocale });
    const cityName = schoolAddress.split(",")[0] || schoolName;

    let bodyRows = "";
    for (const sec of ATP_SECTIONS) {
      bodyRows += `<tr><td colspan="6" style="background:#e8f4fd;font-weight:bold;padding:6px 8px;font-size:11px;">${sec.section}. ${sec.title}</td></tr>`;
      for (const item of sec.items) {
        const v = scores[item.key] ?? 0;
        const ket = remarks[item.key] || "";
        bodyRows += `<tr>
          <td style="text-align:center;padding:5px 8px;">${item.num}</td>
          <td style="padding:5px 8px;font-size:11px;">${item.label}</td>
          <td style="text-align:center;">${v === 2 ? "✓" : ""}</td>
          <td style="text-align:center;">${v === 1 ? "✓" : ""}</td>
          <td style="text-align:center;">${v === 0 ? "✓" : ""}</td>
          <td style="font-size:10px;color:#555;">${ket}</td>
        </tr>`;
      }
    }

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html>
      <head>
        <title>Instrumen Supervisi ATP - ${row.teachers?.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; color: #333; font-size: 12px; }
          h1, h2 { text-align: center; margin: 3px 0; }
          h1 { font-size: 18px; }
          h2 { font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          td, th { padding: 5px 8px; border: 1px solid #999; }
          th { background: #f0f0f0; text-align: center; font-size: 11px; }
          .center { text-align: center; }
          .noborder td { border: none; padding: 3px 6px; }
          .predikat-box { display:inline; padding:2px 6px; border:1px solid #333; font-weight:bold; }
        </style>
      </head>
      <body>
        <h1>Instrumen Supervisi Akademik (Kurikulum Merdeka)</h1>
        <h2>Penelaahan Alur Tujuan Pembelajaran</h2>
        <br/>
        <table class="noborder">
          <tr><td style="width:160px;">Nama Sekolah</td><td>: ${schoolName}</td></tr>
          <tr><td>Nama Guru</td><td>: ${row.teachers?.name || ""}</td></tr>
          <tr><td>Kelas/ Semester</td><td>: ${row.kelas_semester || "............................."}</td></tr>
        </table>
        <table>
          <thead>
            <tr>
              <th rowspan="3" style="width:5%;">No</th>
              <th rowspan="3">Komponen/ Indikator</th>
              <th colspan="3">Penilaian</th>
              <th rowspan="3" style="width:18%;">Keterangan</th>
            </tr>
            <tr>
              <th colspan="2">Ya</th>
              <th rowspan="2">Tidak (0)</th>
            </tr>
            <tr>
              <th style="width:10%;">Sesuai (2)</th>
              <th style="width:12%;">Tidak Sesuai (1)</th>
            </tr>
          </thead>
          <tbody>
            ${bodyRows}
            <tr>
              <td colspan="2" style="font-weight:bold;">Jumlah</td>
              <td class="center">${ATP_ALL_KEYS.filter(k => scores[k] === 2).length}</td>
              <td class="center">${ATP_ALL_KEYS.filter(k => scores[k] === 1).length}</td>
              <td class="center">${ATP_ALL_KEYS.filter(k => scores[k] === 0).length}</td>
              <td></td>
            </tr>
            <tr>
              <td colspan="2" style="font-weight:bold;">Skor Total</td>
              <td class="center" colspan="3" style="font-weight:bold;">${total}</td>
              <td></td>
            </tr>
            <tr>
              <td colspan="2" style="font-weight:bold;">Nilai Akhir</td>
              <td class="center" colspan="3" style="font-weight:bold;">${pct}% — <span class="predikat-box">${predikat.label}</span></td>
              <td></td>
            </tr>
          </tbody>
        </table>
        <p style="font-size:11px;">Keterangan : Nilai Akhir = <u>Skor Perolehan</u> x 100 % &nbsp;&nbsp;&nbsp; Skor Maksimal (${ATP_SCORE_MAX})</p>
        <br/>
        <table class="noborder" style="font-size:11px;">
          <tr><td style="width:30%;">Ketercapaian :</td><td>91% - 100% = Sangat Baik &nbsp;&nbsp;&nbsp; 71% - 80% = Cukup</td></tr>
          <tr><td></td><td>81% - 90% = Baik &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Dibawah 71% = Kurang</td></tr>
        </table>
        <br/>
        <table class="noborder">
          <tr><td>Catatan</td><td>: ${row.notes || "........................................................................................."}</td></tr>
          <tr><td>Tindak Lanjut</td><td>: ${row.tindak_lanjut || "........................................................................................."}</td></tr>
        </table>
        <br/><br/>
        <table class="noborder" style="width:100%;">
          <tr>
            <td style="width:50%;"></td>
            <td style="text-align:center;">${cityName}, ${printDate}</td>
          </tr>
          <tr>
            <td style="text-align:center;">Guru yang di Supervisi,</td>
            <td style="text-align:center;">Kepala Sekolah / Tim Supervisi,</td>
          </tr>
          <tr>
            <td style="text-align:center;"><br/><br/><br/><br/>
              <u>${row.teachers?.name || ""}</u><br/>NIP. ${row.teachers?.nip || ""}
            </td>
            <td style="text-align:center;"><br/><br/><br/><br/>
              <u>${principalName}</u><br/>NIP. ${principalNip}
            </td>
          </tr>
        </table>
      </body>
    </html>`);
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

  const FormContent = ({ f, setF, prefix }: { f: FormState; setF: (fn: (p: FormState) => FormState) => void; prefix: string }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Guru <span className="text-destructive">*</span></Label>
          <Select value={f.teacher_id} onValueChange={(v) => setF(p => ({ ...p, teacher_id: v }))}>
            <SelectTrigger className="text-left [&>span]:text-left [&>span]:truncate"><SelectValue placeholder="Pilih guru" /></SelectTrigger>
            <SelectContent>
              {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} — {t.nip}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tanggal Supervisi</Label>
          <Input type="date" value={f.supervision_date} onChange={(e) => setF(p => ({ ...p, supervision_date: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Kelas - Semester</Label>
          <Input placeholder="Semester 1 - Kelas 5" value={f.kelas_semester} onChange={(e) => setF(p => ({ ...p, kelas_semester: e.target.value }))} />
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold mb-1">Komponen / Indikator ATP</p>
        <p className="text-xs text-muted-foreground mb-2">2 = Sesuai &nbsp;|&nbsp; 1 = Tidak Sesuai &nbsp;|&nbsp; 0 = Tidak Ada &nbsp;·&nbsp; <span className="italic">Kolom keterangan muncul jika nilai bukan 2</span></p>
        <ATPScoreTable
          scores={f.scores}
          remarks={f.remarks}
          prefix={prefix}
          onChange={(key, val) => setF(p => ({ ...p, scores: { ...p.scores, [key]: val } }))}
          onRemarkChange={(key, val) => setF(p => ({ ...p, remarks: { ...p.remarks, [key]: val } }))}
        />
        {(() => {
          const total = calcTotal(f.scores);
          const pct = Math.round((total / ATP_SCORE_MAX) * 100);
          const pred = getPredikat(pct);
          return (
            <div className="mt-3 p-3 bg-muted/30 rounded-lg flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>Skor: <strong>{total}/{ATP_SCORE_MAX}</strong></span>
              <span>Nilai: <strong>{pct}%</strong></span>
              <Badge className={`${pred.color} text-white border-0`}>{pred.label}</Badge>
            </div>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-1.5">
          <Label>Catatan</Label>
          <Textarea placeholder="Catatan supervisi..." rows={2} value={f.notes} onChange={(e) => setF(p => ({ ...p, notes: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Tindak Lanjut</Label>
          <Textarea placeholder="Rencana tindak lanjut..." rows={2} value={f.tindak_lanjut} onChange={(e) => setF(p => ({ ...p, tindak_lanjut: e.target.value }))} />
        </div>
      </div>
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
              <h1 className="text-base sm:text-lg font-bold">Supervisi ATP</h1>
              <p className="text-xs sm:text-sm opacity-90">{atpList.length} data</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-1.5 flex-shrink-0" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Buat Observasi</span>
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-white/10" onClick={() => setLogoutDialogOpen(true)}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => { e.preventDefault(); (document.querySelector('[type="date"]') as HTMLElement)?.focus(); }}>
          <DialogHeader>
            <DialogTitle>Instrumen Supervisi ATP</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-5">
            <FormContent f={form} setF={setForm as any} prefix="new_" />
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="flex-1" disabled={submitting || !form.teacher_id}>
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingId(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => { e.preventDefault(); (document.querySelector('[type="date"]') as HTMLElement)?.focus(); }}>
          <DialogHeader>
            <DialogTitle>Edit Supervisi ATP</DialogTitle>
          </DialogHeader>
          <form onSubmit={onUpdate} className="space-y-5">
            <FormContent f={editForm} setF={setEditForm as any} prefix="edit_" />
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Perbarui"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
        {atpList.length === 0 ? (
          <Card className="rounded-2xl border border-border shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6 space-y-4">
              <div className="text-muted-foreground/50">
                <ClipboardList className="w-16 h-16" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-lg font-bold text-foreground">Belum ada data observasi</p>
                <p className="text-sm text-muted-foreground">Mulai buat instrumen supervisi ATP penelaahan alur tujuan pembelajaran</p>
              </div>
              <Button
                className="mt-2 px-8 py-2.5 rounded bg-primary text-primary-foreground font-semibold gap-2"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="w-4 h-4" /> Buat Observasi
              </Button>
            </CardContent>
          </Card>
        ) : (
          atpList.map((row) => {
            const scores = rowToScores(row);
            const remarks = rowToRemarks(row);
            const total = calcTotal(scores);
            const pct = Math.round((total / ATP_SCORE_MAX) * 100);
            const pred = getPredikat(pct);
            const isExpanded = expandedId === row.id;
            return (
              <Card key={row.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : row.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate">{row.teachers?.name}</span>
                          <Badge className={`${pred.color} text-white border-0 text-xs`}>{pred.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(row.supervision_date), "dd MMM yyyy", { locale: idLocale })}
                          </span>
                          {row.mata_pelajaran && <span>{row.mata_pelajaran}</span>}
                          {row.kelas_semester && <span>{row.kelas_semester}</span>}
                          <span className="font-medium text-foreground">{pct}% ({total}/{ATP_SCORE_MAX})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handlePrint(row); }}>
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t px-4 pb-4 pt-3 space-y-3 bg-muted/10">
                      {ATP_SECTIONS.map((sec) => (
                        <div key={sec.section}>
                          <p className="text-xs font-bold text-primary mb-1">{sec.section}. {sec.title}</p>
                          <div className="space-y-1">
                            {sec.items.map((item) => {
                              const v = scores[item.key] ?? 0;
                              const ket = remarks[item.key] || "";
                              const labels: Record<number, { text: string; color: string }> = {
                                2: { text: "Sesuai", color: "bg-green-500" },
                                1: { text: "Tidak Sesuai", color: "bg-yellow-500" },
                                0: { text: "Tidak Ada", color: "bg-destructive" },
                              };
                              const badge = labels[v];
                              return (
                                <div key={item.key} className="flex items-start justify-between gap-2 text-xs">
                                  <div className="flex-1">
                                    <span className="text-muted-foreground">{item.num}. {item.label}</span>
                                    {ket && <p className="text-[11px] text-muted-foreground italic mt-0.5">Ket: {ket}</p>}
                                  </div>
                                  <Badge className={`${badge.color} text-white border-0 shrink-0 text-[10px]`}>{badge.text}</Badge>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      {(row.notes || row.tindak_lanjut) && (
                        <div className="pt-2 border-t space-y-1 text-xs">
                          {row.notes && <p><span className="font-medium">Catatan:</span> {row.notes}</p>}
                          {row.tindak_lanjut && <p><span className="font-medium">Tindak Lanjut:</span> {row.tindak_lanjut}</p>}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Supervisi ATP?</AlertDialogTitle>
            <AlertDialogDescription>Data ini akan dihapus permanen dan tidak dapat dipulihkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Logout Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Logout</AlertDialogTitle>
            <AlertDialogDescription>Apakah Anda yakin ingin keluar dari aplikasi?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setLogoutDialogOpen(false); signOut(); }} className="bg-destructive hover:bg-destructive/90">Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AdminBottomNav />
    </div>
  );
}
