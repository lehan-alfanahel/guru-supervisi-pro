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
import { ArrowLeft, Plus, ChevronDown, ChevronUp, Pencil, Trash2, Printer, BookOpen, Calendar, LogOut } from "lucide-react";
import { AdminBottomNav } from "@/components/AdminBottomNav";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// ─── Sections Definition ─────────────────────────────────────────────────────
export const MODUL_AJAR_SECTIONS = [
  {
    section: "A", title: "Identitas Mata Pelajaran", type: "lengkap" as const,
    items: [
      { key: "m1", num: 1, label: "Terdapat: Nama penyusun, institusi, dan tahun disusunnya, kelas, alokasi waktu" },
    ],
  },
  {
    section: "B", title: "Kompetensi Awal dan Profil Pelajar Pancasila", type: "lengkap" as const,
    items: [
      { key: "m2", num: 2, label: "Kompetensi Awal" },
      { key: "m3", num: 3, label: "Profil Pelajar Pancasila" },
    ],
  },
  {
    section: "C", title: "Sarana dan Prasarana", type: "sesuai" as const,
    items: [
      { key: "m4", num: 4, label: "Kesesuaian dan ketepatan penggunaan fasilitas yang dibutuhkan untuk menunjang kegiatan pembelajaran" },
      { key: "m5", num: 5, label: "Kesesuaian dan ketepatan penggunaan materi dan sumber bahan ajar lain yang relevan yang digunakan dalam kegiatan pembelajaran" },
    ],
  },
  {
    section: "D", title: "Target Peserta Didik", type: "lengkap" as const,
    items: [],
  },
  {
    section: "E", title: "Model Pembelajaran", type: "lengkap" as const,
    items: [
      { key: "m6", num: 6, label: "Model pembelajaran tatap muka" },
      { key: "m7", num: 7, label: "Model pembelajaran blended" },
    ],
  },
  {
    section: "F", title: "Komponen Pembelajaran", type: "sesuai" as const,
    items: [
      { key: "m8", num: 8, label: "Ketepatan Tujuan Pembelajaran" },
      { key: "m9", num: 9, label: "Pemahaman Bermakna" },
      { key: "m10", num: 10, label: "Pertanyaan Pemantik" },
      { key: "m11", num: 11, label: "Persiapan Pembelajaran" },
    ],
  },
  {
    section: "G", title: "Skenario Pembelajaran", type: "sesuai" as const,
    items: [
      { key: "m12", num: 12, label: "Kegiatan pendahuluan: Motivasi dan Apersepsi" },
      {
        key: "m13", num: 13, label: "Kegiatan inti berisi:",
        subItems: [
          "a. Memfasilitasi kegiatan siswa untuk mengamati, mendengar dan menyimak",
          "b. Mendorong siswa untuk bertanya apa, mengapa dan bagaimana berbentuk perumusan masalah",
          "c. Membimbing siswa untuk mengumpulkan informasi/ eksplorasi dalam rangka menjawab pertanyaan",
          "d. Membimbing siswa untuk menyimpulkan/mensintesa data atau informasi yang terkumpul",
          "e. Memotivasi siswa untuk mengomunikasikan",
        ],
      },
      {
        key: "m14", num: 14, label: "Kegiatan penutup berisi: rangkuman, refleksi, dan tindaklanjut",
        subItems: [
          "a. Memfasilitasi dan membimbing siswa merangkum materi pelajaran",
          "b. Memfasilitasi dan membimbing siswa merefleksi kegiatan yang sudah dilaksanakan",
          "c. Memberikan umpan balik terhadap hasil pembelajaran",
        ],
      },
    ],
  },
  {
    section: "H", title: "Rancangan Penilaian Pembelajaran", type: "sesuai" as const,
    items: [
      { key: "m15", num: 15, label: "Kesesuaian bentuk, tehnik dan instrument dengan tujuan pembelajaran" },
      { key: "m16", num: 16, label: "Kesesuaian antara bentuk, tehnik dan instrument Penilaian Sikap" },
      { key: "m17", num: 17, label: "Kesesuaian antara bentuk, tehnik dan instrument Penilaian Pengetahuan" },
      { key: "m18", num: 18, label: "Kesesuaian antara bentuk, tehnik dan instrumen Penilaian Keterampilan" },
    ],
  },
  {
    section: "I", title: "Pembelajaran Remedial", type: "sesuai" as const,
    items: [
      { key: "m19", num: 19, label: "Merumuskan kegiatan pembelajaran remedial yang sesuai dengan karakteristik peserta didik, alokasi waktu, sarana, dan media pembelajaran" },
    ],
  },
  {
    section: "J", title: "Pembelajaran Pengayaan", type: "sesuai" as const,
    items: [
      { key: "m20", num: 20, label: "Merumuskan kegiatan pembelajaran pengayaan sesuai dengan karakteristik peserta didik, alokasi waktu, sarana dan media pembelajaran" },
    ],
  },
  {
    section: "K", title: "Lampiran", type: "lengkap" as const,
    items: [
      { key: "m21", num: 21, label: "Lembar Kerja Peserta Didik" },
      { key: "m22", num: 22, label: "Bahan Bacaan guru dan Peserta Didik" },
      { key: "m23", num: 23, label: "Glosarium" },
      { key: "m24", num: 24, label: "Daftar Pustaka" },
    ],
  },
];

export const MA_ALL_KEYS = MODUL_AJAR_SECTIONS.flatMap(s => s.items.map(i => i.key));
const MA_SCORE_MAX = MA_ALL_KEYS.length * 2; // 24 × 2 = 48

const SCORE_LABELS = {
  lengkap: { 0: "Tidak Ada", 1: "Kurang Lengkap", 2: "Sudah Lengkap" },
  sesuai: { 0: "Tidak Sesuai", 1: "Sesuai Sebagian", 2: "Sesuai Seluruhnya" },
};

type ScoreVal = 0 | 1 | 2;

function defaultScores(): Record<string, ScoreVal> {
  return Object.fromEntries(MA_ALL_KEYS.map(k => [k, 0 as ScoreVal]));
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

// ─── Score Table ─────────────────────────────────────────────────────────────
function MAScoreTable({ scores, remarks = {}, prefix = "", onChange, onRemarkChange }: {
  scores: Record<string, ScoreVal>;
  remarks?: Record<string, string>;
  prefix?: string;
  onChange: (key: string, val: ScoreVal) => void;
  onRemarkChange?: (key: string, val: string) => void;
}) {
  return (
    <div>
      {/* Mobile: card layout */}
      <div className="space-y-3 sm:hidden">
        {MODUL_AJAR_SECTIONS.map((sec) => sec.items.length > 0 && (
          <div key={sec.section}>
            <div className="px-3 py-2 bg-primary/10 rounded-t-lg">
              <p className="text-xs font-bold text-primary">{sec.section}. {sec.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">[{SCORE_LABELS[sec.type][0]} / {SCORE_LABELS[sec.type][1]} / {SCORE_LABELS[sec.type][2]}]</p>
            </div>
            <div className="border border-t-0 rounded-b-lg divide-y">
              {sec.items.map((item) => {
                const score = scores[item.key] ?? 0;
                const showRemark = score !== 2;
                const labels = SCORE_LABELS[sec.type];
                const scoreOpts: { val: ScoreVal; activeClass: string }[] = [
                  { val: 0, activeClass: "bg-destructive text-destructive-foreground border-destructive" },
                  { val: 1, activeClass: "bg-yellow-500 text-white border-yellow-500" },
                  { val: 2, activeClass: "bg-green-600 text-white border-green-600" },
                ];
                return (
                  <div key={item.key} className="p-3 space-y-2">
                    <p className="text-xs font-medium">{item.num}. {item.label}</p>
                    {"subItems" in item && (item as any).subItems?.length > 0 && (
                      <ul className="ml-3 space-y-0.5">
                        {(item as any).subItems.map((sub: string) => (
                          <li key={sub} className="text-[10px] text-muted-foreground italic">{sub}</li>
                        ))}
                      </ul>
                    )}
                    <div className="flex gap-1.5">
                      {scoreOpts.map(({ val, activeClass }) => (
                        <label key={val} className={`flex-1 flex items-center justify-center py-1.5 px-1 rounded border cursor-pointer text-[10px] font-medium transition-colors text-center leading-tight ${score === val ? activeClass : "bg-muted/30 text-muted-foreground border-border"}`}>
                          <input type="radio" name={`${prefix}${item.key}`} value={val} checked={score === val} onChange={() => onChange(item.key, val)} className="sr-only" />
                          {val}<br/>{labels[val]}
                        </label>
                      ))}
                    </div>
                    {showRemark && onRemarkChange && (
                      <input type="text" placeholder="Tulis keterangan..." value={remarks[item.key] || ""}
                        onChange={(e) => onRemarkChange(item.key, e.target.value)}
                        className="w-full text-xs border border-border rounded px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
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
        <table className="w-full text-sm min-w-[500px]">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-center border-b w-8 text-xs">No</th>
              <th className="p-2 text-left border-b text-xs">Komponen Modul Ajar</th>
              <th className="p-2 text-center border-b text-xs w-14">0</th>
              <th className="p-2 text-center border-b text-xs w-14">1</th>
              <th className="p-2 text-center border-b text-xs w-14">2</th>
              <th className="p-2 text-left border-b text-xs">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {MODUL_AJAR_SECTIONS.map((sec) => (
              <>
                <tr key={`sec-${sec.section}`} className="bg-primary/10">
                  <td colSpan={6} className="p-2 font-bold text-xs text-primary border-b">
                    {sec.section}. {sec.title}
                    {sec.items.length > 0 && (
                      <span className="ml-2 font-normal text-muted-foreground">
                        [{SCORE_LABELS[sec.type][0]} / {SCORE_LABELS[sec.type][1]} / {SCORE_LABELS[sec.type][2]}]
                      </span>
                    )}
                  </td>
                </tr>
                {sec.items.map((item, idx) => {
                  const score = scores[item.key] ?? 0;
                  const showRemark = score !== 2;
                  return (
                    <>
                      <tr key={item.key} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        <td className="p-2 text-center text-xs text-muted-foreground border-b">{item.num}</td>
                        <td className="p-2 text-xs border-b font-medium">{item.label}</td>
                        {([0, 1, 2] as ScoreVal[]).map((val) => (
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
                      {"subItems" in item && (item as any).subItems?.map((sub: string) => (
                        <tr key={sub} className="bg-muted/10">
                          <td className="border-b"></td>
                          <td className="pl-6 pr-2 py-1 text-[11px] text-muted-foreground border-b italic" colSpan={5}>{sub}</td>
                        </tr>
                      ))}
                    </>
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
export default function SupervisionModulAjar() {
  const [list, setList] = useState<any[]>([]);
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

      const [teachersData, { data: listData }] = await Promise.all([
        getTeachers(school.id),
        supabase
          .from("modul_ajar_supervisions" as any)
          .select("*, teachers(name, nip)")
          .eq("school_id", school.id)
          .order("supervision_date", { ascending: false }),
      ]);
      setTeachers(teachersData);
      setList(listData || []);
    } catch (error: any) {
      toast({ title: "Error", description: getUserFriendlyError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const rowToScores = (row: any): Record<string, ScoreVal> =>
    Object.fromEntries(
      MA_ALL_KEYS.map(k => {
        const v = Number(row[k]);
        return [k, (v === 0 || v === 1 || v === 2 ? v : 0) as ScoreVal];
      })
    );

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
        school_id: schoolId, teacher_id: form.teacher_id, created_by: user!.id,
        supervision_date: form.supervision_date, mata_pelajaran: form.mata_pelajaran,
        kelas_semester: form.kelas_semester, notes: form.notes, tindak_lanjut: form.tindak_lanjut,
        remarks: form.remarks,
        ...form.scores,
      };
      const { error } = await supabase.from("modul_ajar_supervisions" as any).insert(payload);
      if (error) throw error;
      toast({ title: "✅ Supervisi Modul Ajar berhasil disimpan!" });
      setDialogOpen(false); setForm(emptyForm()); loadData();
    } catch (err: any) {
      toast({ title: "Error", description: getUserFriendlyError(err), variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const openEdit = (row: any) => {
    setEditingId(row.id);
    setEditForm({
      teacher_id: row.teacher_id, supervision_date: row.supervision_date,
      mata_pelajaran: row.mata_pelajaran || "", kelas_semester: row.kelas_semester || "",
      notes: row.notes || "", tindak_lanjut: row.tindak_lanjut || "",
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
        supervision_date: editForm.supervision_date, mata_pelajaran: editForm.mata_pelajaran,
        kelas_semester: editForm.kelas_semester, notes: editForm.notes,
        tindak_lanjut: editForm.tindak_lanjut,
        remarks: editForm.remarks,
        ...editForm.scores,
      };
      const { error } = await supabase.from("modul_ajar_supervisions" as any).update(payload).eq("id", editingId);
      if (error) throw error;
      toast({ title: "✅ Supervisi Modul Ajar berhasil diperbarui!" });
      setEditDialogOpen(false); setEditingId(null); loadData();
    } catch (err: any) {
      toast({ title: "Error", description: getUserFriendlyError(err), variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const onDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("modul_ajar_supervisions" as any).delete().eq("id", deleteId);
    if (error) { toast({ title: "Gagal menghapus", variant: "destructive" }); return; }
    toast({ title: "🗑️ Data berhasil dihapus!" });
    setDeleteId(null); loadData();
  };

  const handlePrint = (row: any) => {
    const scores = rowToScores(row);
    const remarks = rowToRemarks(row);
    const total = calcTotal(scores);
    const pct = Math.round((total / MA_SCORE_MAX) * 100);
    const predikat = getPredikat(pct);
    const printDate = format(new Date(row.supervision_date + "T00:00:00"), "dd MMMM yyyy", { locale: idLocale });
    const cityName = schoolAddress.split(",")[0] || schoolName;

    let bodyRows = "";
    for (const sec of MODUL_AJAR_SECTIONS) {
      const labels = SCORE_LABELS[sec.type];
      bodyRows += `<tr><td colspan="6" style="background:#e8f4fd;font-weight:bold;padding:6px 8px;font-size:11px;">${sec.section}. ${sec.title}</td></tr>`;
      for (const item of sec.items) {
        const v = scores[item.key] ?? 0;
        const ket = remarks[item.key] || "";
        const subItemsHtml = "subItems" in item
          ? (item as any).subItems.map((s: string) => `<div style="color:#666;font-size:10px;margin-left:8px;margin-top:2px;">${s}</div>`).join("")
          : "";
        bodyRows += `<tr>
          <td style="text-align:center;padding:5px 8px;">${item.num}</td>
          <td style="padding:5px 8px;font-size:11px;">${item.label}${subItemsHtml}</td>
          <td style="text-align:center;">${v === 0 ? "✓" : ""}</td>
          <td style="text-align:center;">${v === 1 ? "✓" : ""}</td>
          <td style="text-align:center;">${v === 2 ? "✓" : ""}</td>
          <td style="font-size:10px;color:#555;">${ket}</td>
        </tr>`;
      }
    }

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html>
      <head>
        <title>Instrumen Supervisi Modul Ajar - ${row.teachers?.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; color: #333; font-size: 12px; }
          h1, h2 { text-align: center; margin: 3px 0; }
          h1 { font-size: 18px; font-weight: bold; }
          h2 { font-size: 17px; }
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
        <h2>Telaah Modul Ajar</h2>
        <br/>
        <table class="noborder">
          <tr><td style="width:160px;">Nama Sekolah</td><td>: ${schoolName}</td></tr>
          <tr><td>Nama Guru</td><td>: ${row.teachers?.name || ""}</td></tr>
          <tr><td>NIP Guru</td><td>: ${row.teachers?.nip || "-"}</td></tr>
          <tr><td>Mata Pelajaran</td><td>: ${row.mata_pelajaran || "............................."}</td></tr>
          <tr><td>Kelas/ Semester</td><td>: ${row.kelas_semester || "............................."}</td></tr>
          <tr><td>Tanggal Supervisi</td><td>: ${printDate}</td></tr>
        </table>
        <table>
          <thead>
            <tr>
              <th rowspan="2" style="width:4%;">No</th>
              <th rowspan="2">Komponen Modul Ajar</th>
              <th colspan="3">Hasil Telaah &amp; Skor</th>
              <th rowspan="2" style="width:18%;">Keterangan</th>
            </tr>
            <tr>
              <th style="width:9%;">0</th>
              <th style="width:9%;">1</th>
              <th style="width:9%;">2</th>
            </tr>
          </thead>
          <tbody>
            ${bodyRows}
            <tr>
              <td colspan="2" style="font-weight:bold;">Jumlah</td>
              <td class="center">${MA_ALL_KEYS.filter(k => scores[k] === 0).length}</td>
              <td class="center">${MA_ALL_KEYS.filter(k => scores[k] === 1).length}</td>
              <td class="center">${MA_ALL_KEYS.filter(k => scores[k] === 2).length}</td>
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
        <p style="font-size:11px;">Keterangan : Nilai Akhir = <u>Skor Perolehan</u> x 100 % &nbsp;&nbsp;&nbsp; Skor Maksimal (${MA_SCORE_MAX})</p>
        <br/>
        <table class="noborder" style="font-size:11px;">
          <tr><td style="width:30%;">Ketercapaian :</td><td>91% - 100% = Sangat Baik &nbsp;&nbsp;&nbsp; 71% - 80% = Cukup</td></tr>
          <tr><td></td><td>81% - 90% = Baik &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Dibawah 71% = Kurang</td></tr>
        </table>
        <br/>
        <table class="noborder">
          <tr><td style="width:140px;">Catatan</td><td>: ${row.notes || "........................................................................................."}</td></tr>
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

  const renderFormContent = (f: FormState, setF: (fn: (p: FormState) => FormState) => void, prefix: string) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Guru <span className="text-destructive">*</span></Label>
          <Select value={f.teacher_id} onValueChange={(v) => setF(p => ({ ...p, teacher_id: v }))}>
            <SelectTrigger className="text-left [&>span]:text-left [&>span]:truncate">
              <SelectValue placeholder="Pilih guru" />
            </SelectTrigger>
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
          <Label>Mata Pelajaran</Label>
          <Input placeholder="Contoh: Matematika" value={f.mata_pelajaran} onChange={(e) => setF(p => ({ ...p, mata_pelajaran: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Kelas - Semester</Label>
          <Input placeholder="Semester 1 - Kelas 5" value={f.kelas_semester} onChange={(e) => setF(p => ({ ...p, kelas_semester: e.target.value }))} />
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold mb-1">Komponen / Indikator Modul Ajar</p>
        <p className="text-xs text-muted-foreground mb-2">
          Lengkap: 2 = Sudah Lengkap / Sesuai Seluruhnya &nbsp;|&nbsp; 1 = Kurang Lengkap / Sesuai Sebagian &nbsp;|&nbsp; 0 = Tidak Ada / Tidak Sesuai &nbsp;·&nbsp; <span className="italic">Keterangan muncul jika nilai bukan 2</span>
        </p>
        <MAScoreTable
          scores={f.scores}
          remarks={f.remarks}
          prefix={prefix}
          onChange={(key, val) => setF(p => ({ ...p, scores: { ...p.scores, [key]: val } }))}
          onRemarkChange={(key, val) => setF(p => ({ ...p, remarks: { ...p.remarks, [key]: val } }))}
        />
        {(() => {
          const total = calcTotal(f.scores);
          const pct = Math.round((total / MA_SCORE_MAX) * 100);
          const pred = getPredikat(pct);
          return (
            <div className="mt-3 p-3 bg-muted/30 rounded-lg flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>Skor: <strong>{total}/{MA_SCORE_MAX}</strong></span>
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
      <header className="bg-primary text-primary-foreground border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="hover:bg-white/10 flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold">Supervisi Telaah Modul Ajar</h1>
              <p className="text-xs sm:text-sm opacity-90">{list.length} data</p>
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
        <DialogContent className="sm:max-w-2xl" onOpenAutoFocus={(e) => { e.preventDefault(); (document.querySelector('[type="date"]') as HTMLElement)?.focus(); }}>
          <DialogHeader>
            <DialogTitle>Instrumen Supervisi Telaah Modul Ajar</DialogTitle>
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
        <DialogContent className="sm:max-w-2xl" onOpenAutoFocus={(e) => { e.preventDefault(); (document.querySelector('[type="date"]') as HTMLElement)?.focus(); }}>
          <DialogHeader>
            <DialogTitle>Edit Supervisi Modul Ajar</DialogTitle>
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

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
        {list.length === 0 ? (
          <Card className="rounded-2xl border border-border shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6 space-y-4">
              <div className="text-muted-foreground/50">
                <BookOpen className="w-16 h-16" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-lg font-bold text-foreground">Belum ada data observasi</p>
                <p className="text-sm text-muted-foreground">Mulai buat instrumen supervisi telaah modul ajar</p>
              </div>
              <Button className="mt-2 px-8 py-2.5 rounded bg-primary text-primary-foreground font-semibold gap-2" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4" /> Buat Observasi
              </Button>
            </CardContent>
          </Card>
        ) : (
          list.map((row) => {
            const scores = rowToScores(row);
            const remarks = rowToRemarks(row);
            const total = calcTotal(scores);
            const pct = Math.round((total / MA_SCORE_MAX) * 100);
            const pred = getPredikat(pct);
            const isExpanded = expandedId === row.id;
            return (
              <Card key={row.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpandedId(isExpanded ? null : row.id)}>
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
                          <span className="font-medium text-foreground">{pct}% ({total}/{MA_SCORE_MAX})</span>
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
                      {MODUL_AJAR_SECTIONS.map((sec) => sec.items.length > 0 && (
                        <div key={sec.section}>
                          <p className="text-xs font-bold text-primary mb-1">{sec.section}. {sec.title}</p>
                          <div className="space-y-1">
                            {sec.items.map((item) => {
                              const v = scores[item.key] ?? 0;
                              const ket = remarks[item.key] || "";
                              const labels = SCORE_LABELS[sec.type];
                              const colorMap: Record<number, string> = { 2: "bg-green-500", 1: "bg-yellow-500", 0: "bg-destructive" };
                              return (
                                <div key={item.key} className="flex items-start justify-between gap-2 text-xs">
                                  <div className="flex-1">
                                    <span className="text-muted-foreground">{item.num}. {item.label}</span>
                                    {ket && <p className="text-[11px] text-muted-foreground italic mt-0.5">Ket: {ket}</p>}
                                  </div>
                                  <Badge className={`${colorMap[v]} text-white border-0 shrink-0 text-[10px]`}>{labels[v as 0 | 1 | 2]}</Badge>
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

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Supervisi Modul Ajar?</AlertDialogTitle>
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
