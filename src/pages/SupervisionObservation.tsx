import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSchool, getTeachers, Teacher } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, ClipboardList, Calendar, Printer, ChevronDown, ChevronUp, Pencil, Trash2, LogOut } from "lucide-react";
import { AdminBottomNav } from "@/components/AdminBottomNav";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// ─── Instrument Definition ───────────────────────────────────────────────────

export const OBSERVATION_SECTIONS = [
  {
    section: "A", title: "Kegiatan Pendahuluan",
    groups: [
      { num: "1", title: "Orientasi", items: [
        { key: "a1a", label: "Guru menyiapkan fisik dan psikis peserta didik dengan menyapa dan memberi salam." },
        { key: "a1b", label: "Guru menyampaikan rencana kegiatan baik, individual, kerja kelompok, dan melakukan observasi." },
      ]},
      { num: "2", title: "Motivasi", items: [
        { key: "a2a", label: "Guru mengajukan pertanyaan yang menantang untuk memotivasi Peserta Didik." },
        { key: "a2b", label: "Guru menyampaikan manfaat materi pembelajaran." },
      ]},
      { num: "3", title: "Apersepsi", items: [
        { key: "a3a", label: "Guru menyampaikan kompetensi yang akan dicapai peserta didik." },
        { key: "a3b", label: "Guru mengaitkan materi dengan materi pembelajaran sebelumnya." },
        { key: "a3c", label: "Guru mendemonstrasikan sesuatu yang terkait dengan materi pembelajaran." },
      ]},
    ],
  },
  {
    section: "B", title: "Kegiatan Inti",
    groups: [
      { num: "1", title: "Penguasaan materi pembelajaran", items: [
        { key: "b1a", label: "Guru menyesuaikan materi dengan tujuan pembelajaran." },
        { key: "b1b", label: "Guru mengkaitkan materi dengan pengetahuan lain yang relevan, perkembangan iptek dan kehidupan nyata." },
        { key: "b1c", label: "Guru menyajikan pembahasan materi pembelajaran dengan tepat." },
        { key: "b1d", label: "Guru menyajikan materi secara sistematis (mudah ke kesulitan, dari konkrit ke abstrak)." },
      ]},
      { num: "2", title: "Penerapan strategi pembelajaran yang mendidik", items: [
        { key: "b2a", label: "Guru melaksanakan pembelajaran sesuai dengan kompetensi yang akan dicapai." },
        { key: "b2b", label: "Guru melaksanakan pembelajaran yang menumbuhkan partisipasi aktif peserta didik dalam mengajukan pertanyaan." },
        { key: "b2c", label: "Guru melaksanakan pembelajaran yang menumbuhkan partisipasi aktif peserta didik dalam mengemukakan pendapat." },
        { key: "b2d", label: "Guru melaksanakan pembelajaran yang mengembangkan keterampilan peserta didik sesuai dengan materi ajar." },
        { key: "b2e", label: "Guru melaksanakan pembelajaran yang bersifat kontekstual." },
        { key: "b2f", label: "Guru melaksanakan pembelajaran sesuai dengan alokasi waktu yang direncanakan." },
      ]},
      { num: "3", title: "Aktivitas Pembelajaran HOTS dan Kecakapan Abad 21 (4C)", items: [
        { key: "b3a", label: "Guru melaksanakan pembelajaran yang mengasah kemampuan Creativity peserta didik." },
        { key: "b3b", label: "Guru melaksanakan pembelajaran yang mengasah kemampuan Critical Thinking peserta didik." },
        { key: "b3c", label: "Guru melaksanakan pembelajaran yang mengasah kemampuan Communication peserta didik." },
        { key: "b3d", label: "Guru melaksanakan pembelajaran yang mengasah kemampuan Collaboration peserta didik." },
      ]},
      { num: "4", title: "Kualitas pembelajaran: manajemen kelas", items: [
        { key: "b4a", label: "Terciptanya suasana kelas yang kondusif untuk proses belajar mengajar (tanpa disrupsi yang mengalihkan perhatian dari aktivitas belajar)." },
        { key: "b4b", label: "Terlaksananya penerapan prinsip disiplin positif dalam menegakkan aturan kelas yang telah disepakati bersama." },
      ]},
      { num: "5", title: "Pemanfaatan sumber belajar/media pembelajaran", items: [
        { key: "b5a", label: "Guru menunjukkan keterampilan dalam penggunaan sumber belajar yang bervariasi." },
        { key: "b5b", label: "Guru menunjukkan keterampilan dalam penggunaan media pembelajaran." },
        { key: "b5c", label: "Guru melibatkan peserta didik dalam pemanfaatan sumber belajar." },
        { key: "b5d", label: "Guru melibatkan peserta didik dalam pemanfaatan media pembelajaran." },
        { key: "b5e", label: "Menghasilkan kesan yang menarik." },
      ]},
      { num: "6", title: "Penggunaan Bahasa yang benar dan tepat dalam pembelajaran", items: [
        { key: "b6a", label: "Menggunakan bahasa lisan secara jelas dan lancar." },
        { key: "b6b", label: "Menggunakan bahasa tulis yang baik dan benar." },
      ]},
    ],
  },
  {
    section: "C", title: "Kegiatan Penutup",
    groups: [
      { num: "1", title: "Proses rangkuman, refleksi, dan tindak lanjut", items: [
        { key: "c1a", label: "Guru memfasilitasi dan membimbing peserta didik merangkum materi pelajaran." },
        { key: "c1b", label: "Guru menunjukkan aktivitas belajar yang bertujuan meningkatkan pengetahuan dan keterampilan mengajar." },
        { key: "c1c", label: "Guru menunjukkan aktivitas untuk mengevaluasi dan merefleksikan praktik pengajaran yang telah diterapkan, terutama dari sisi dampaknya terhadap belajar murid." },
        { key: "c1d", label: "Terlaksananya penerapan cara, bahan, dan/atau pendekatan baru dalam praktik pengajaran, mulai dari perencanaan, pelaksanaan, sampai evaluasi pembelajaran." },
        { key: "c1e", label: "Guru melaksanakan tindak lanjut dengan memberikan arahan kepada murid untuk menutupi perbaikan dan pengayaan secara individu atau kelompok." },
      ]},
      { num: "2", title: "Pelaksanaan Penilaian Hasil Belajar", items: [
        { key: "c2a", label: "Guru melaksanakan Penilaian Sikap melalui observasi." },
        { key: "c2b", label: "Guru melaksanakan Penilaian Pengetahuan melalui tes lisan, tulisan." },
        { key: "c2c", label: "Guru melaksanakan Penilaian Keterampilan: penilaian kinerja, projek, produk atau portofolio." },
      ]},
    ],
  },
];

// All item keys (38 total)
export const ALL_ITEM_KEYS = OBSERVATION_SECTIONS.flatMap(s => s.groups.flatMap(g => g.items.map(i => i.key)));
const SCORE_MAX = ALL_ITEM_KEYS.length * 2; // 76

type ScoreVal = 0 | 1 | 2;

function defaultScores(): Record<string, ScoreVal> {
  return Object.fromEntries(ALL_ITEM_KEYS.map(k => [k, 0]));
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
  observation_date: string;
  mata_pelajaran: string;
  materi_topik: string;
  notes: string;
  tindak_lanjut: string;
  scores: Record<string, ScoreVal>;
}

const emptyForm = (): FormState => ({
  teacher_id: "",
  observation_date: new Date().toISOString().split("T")[0],
  mata_pelajaran: "",
  materi_topik: "",
  notes: "",
  tindak_lanjut: "",
  scores: defaultScores(),
});

// ─── Observation Form Scoring Table ──────────────────────────────────────────
function ObservationScoreTable({ scores, prefix = "", onChange }: {
  scores: Record<string, ScoreVal>;
  prefix?: string;
  onChange: (key: string, val: ScoreVal) => void;
}) {
  const scoreOpts: { val: ScoreVal; label: string; activeClass: string }[] = [
    { val: 2, label: "Sesuai", activeClass: "bg-green-600 text-white border-green-600" },
    { val: 1, label: "Kurang", activeClass: "bg-yellow-500 text-white border-yellow-500" },
    { val: 0, label: "Tidak Ada", activeClass: "bg-destructive text-destructive-foreground border-destructive" },
  ];
  return (
    <div>
      {/* Mobile: card layout */}
      <div className="space-y-3 sm:hidden">
        {OBSERVATION_SECTIONS.map((sec) => (
          <div key={sec.section}>
            <div className="px-3 py-2 bg-primary/10 rounded-t-lg">
              <p className="text-xs font-bold text-primary">{sec.section}. {sec.title}</p>
            </div>
            <div className="border border-t-0 rounded-b-lg divide-y">
              {sec.groups.map((grp) => (
                <div key={grp.num} className="divide-y">
                  <div className="px-3 py-2 bg-muted/30">
                    <p className="text-xs font-semibold text-foreground">{grp.num}. {grp.title}</p>
                  </div>
                  {grp.items.map((item) => {
                    const score = scores[item.key] ?? 0;
                    return (
                      <div key={item.key} className="p-3 space-y-2">
                        <p className="text-xs">{item.label}</p>
                        <div className="flex gap-1.5">
                          {scoreOpts.map(({ val, label, activeClass }) => (
                            <label key={val} className={`flex-1 flex items-center justify-center py-1.5 px-1 rounded border cursor-pointer text-[11px] font-medium transition-colors ${score === val ? activeClass : "bg-muted/30 text-muted-foreground border-border"}`}>
                              <input type="radio" name={`${prefix}${item.key}`} value={val} checked={score === val} onChange={() => onChange(item.key, val)} className="sr-only" />
                              {val} — {label}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Desktop: table layout */}
      <div className="hidden sm:block border rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[400px]">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left border-b w-7 text-xs">No</th>
              <th className="p-2 text-left border-b text-xs">Aspek yang Diamati</th>
              <th className="p-2 text-center border-b w-10 text-xs">2</th>
              <th className="p-2 text-center border-b w-10 text-xs">1</th>
              <th className="p-2 text-center border-b w-10 text-xs">0</th>
            </tr>
            <tr className="bg-muted/30">
              <th className="p-1 border-b" colSpan={2}></th>
              <th className="p-1 text-center border-b text-[10px] text-muted-foreground">Sesuai</th>
              <th className="p-1 text-center border-b text-[10px] text-muted-foreground">Kurang</th>
              <th className="p-1 text-center border-b text-[10px] text-muted-foreground">Tidak Ada</th>
            </tr>
          </thead>
          <tbody>
            {OBSERVATION_SECTIONS.map((sec) => {
              let rowNum = 0;
              return (
                <>
                  <tr key={`sec-${sec.section}`} className="bg-primary/10">
                    <td colSpan={5} className="p-2 font-bold text-xs text-primary border-b">{sec.section}. {sec.title}</td>
                  </tr>
                  {sec.groups.map((grp) => (
                    <>
                      <tr key={`grp-${grp.num}`} className="bg-muted/40">
                        <td colSpan={5} className="px-3 py-1.5 text-xs font-semibold text-foreground border-b">{grp.num}. {grp.title}</td>
                      </tr>
                      {grp.items.map((item) => {
                        rowNum++;
                        const score = scores[item.key] ?? 0;
                        return (
                          <tr key={item.key} className={rowNum % 2 === 0 ? "bg-muted/20" : "bg-background"}>
                            <td className="p-2 text-center text-xs text-muted-foreground border-b w-7">{rowNum}</td>
                            <td className="p-2 text-xs border-b">{item.label}</td>
                            {([2, 1, 0] as ScoreVal[]).map((val) => (
                              <td key={val} className="p-2 text-center border-b w-10">
                                <input type="radio" name={`${prefix}${item.key}`} value={val} checked={score === val} onChange={() => onChange(item.key, val)} className="accent-primary w-4 h-4 cursor-pointer" />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </>
                  ))}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SupervisionObservation() {
  const [observations, setObservations] = useState<any[]>([]);
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
      const schoolData = await getSchool(user.id);
      if (!schoolData) { navigate("/setup-school"); return; }
      setSchoolId(schoolData.id);
      setSchoolName(schoolData.name);
      setSchoolAddress(schoolData.address || "");
      setPrincipalName(schoolData.principal_name);
      setPrincipalNip(schoolData.principal_nip);

      const [teachersData, { data: obsData }] = await Promise.all([
        getTeachers(schoolData.id),
        supabase.from("supervision_observations")
          .select("*, teachers(name, nip)")
          .eq("school_id", schoolData.id)
          .order("observation_date", { ascending: false }),
      ]);
      setTeachers(teachersData);
      setObservations(obsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => setForm(emptyForm());

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teacher_id) { toast({ title: "Pilih guru terlebih dahulu", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("supervision_observations").insert({
        school_id: schoolId,
        teacher_id: form.teacher_id,
        created_by: user!.id,
        observation_date: form.observation_date,
        mata_pelajaran: form.mata_pelajaran,
        materi_topik: form.materi_topik,
        scores: form.scores,
        notes: form.notes,
        tindak_lanjut: form.tindak_lanjut,
      });
      if (error) throw error;
      toast({ title: "Berhasil disimpan" });
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      toast({ title: "Gagal menyimpan", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (obs: any) => {
    const s: Record<string, ScoreVal> = { ...defaultScores() };
    if (obs.scores && typeof obs.scores === "object") {
      for (const k of ALL_ITEM_KEYS) {
        const v = Number(obs.scores[k]);
        if (v === 0 || v === 1 || v === 2) s[k] = v as ScoreVal;
      }
    }
    setEditForm({
      teacher_id: obs.teacher_id,
      observation_date: obs.observation_date,
      mata_pelajaran: obs.mata_pelajaran || "",
      materi_topik: obs.materi_topik || "",
      notes: obs.notes || "",
      tindak_lanjut: obs.tindak_lanjut || "",
      scores: s,
    });
    setEditingId(obs.id);
    setEditDialogOpen(true);
  };

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("supervision_observations").update({
        teacher_id: editForm.teacher_id,
        observation_date: editForm.observation_date,
        mata_pelajaran: editForm.mata_pelajaran,
        materi_topik: editForm.materi_topik,
        scores: editForm.scores,
        notes: editForm.notes,
        tindak_lanjut: editForm.tindak_lanjut,
      }).eq("id", editingId);
      if (error) throw error;
      toast({ title: "Berhasil diperbarui" });
      setEditDialogOpen(false);
      setEditingId(null);
      loadData();
    } catch (err: any) {
      toast({ title: "Gagal memperbarui", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("supervision_observations").delete().eq("id", deleteId);
    if (error) { toast({ title: "Gagal menghapus", variant: "destructive" }); return; }
    toast({ title: "Data dihapus" });
    setDeleteId(null);
    loadData();
  };

  const handlePrint = (obs: any) => {
    const scores: Record<string, number> = obs.scores || {};
    const total = ALL_ITEM_KEYS.reduce((s, k) => s + (Number(scores[k]) || 0), 0);
    const pct = Math.round((total / SCORE_MAX) * 100);
    const predikat = getPredikat(pct);
    const printDate = format(new Date(), "dd MMMM yyyy", { locale: idLocale });
    const cityName = schoolAddress.split(",")[0] || schoolName;

    let rowHtml = "";
    let rowN = 0;
    for (const sec of OBSERVATION_SECTIONS) {
      rowHtml += `<tr><td colspan="6" style="background:#e8f4fd;font-weight:bold;padding:6px 8px;font-size:11px;">${sec.section}. ${sec.title}</td></tr>`;
      for (const grp of sec.groups) {
        rowHtml += `<tr><td colspan="6" style="background:#f5f5f5;padding:4px 10px;font-size:10px;font-weight:600;">${grp.num}. ${grp.title}</td></tr>`;
        for (const item of grp.items) {
          rowN++;
          const v = Number(scores[item.key]) || 0;
          rowHtml += `<tr>
            <td style="border:1px solid #ddd;padding:4px 6px;text-align:center;font-size:10px;">${rowN}</td>
            <td style="border:1px solid #ddd;padding:4px 6px;font-size:10px;">${item.label}</td>
            <td style="border:1px solid #ddd;text-align:center;font-size:13px;">${v === 2 ? "✓" : ""}</td>
            <td style="border:1px solid #ddd;text-align:center;font-size:13px;">${v === 1 ? "✓" : ""}</td>
            <td style="border:1px solid #ddd;text-align:center;font-size:13px;">${v === 0 ? "✓" : ""}</td>
            <td style="border:1px solid #ddd;padding:4px 6px;font-size:10px;"></td>
          </tr>`;
        }
      }
    }

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>Instrumen Supervisi Akademik</title>
      <style>
        body{font-family:Arial,sans-serif;font-size:11px;margin:20px;color:#000;}
        table{border-collapse:collapse;width:100%;}
        h2,h3{text-align:center;margin:4px 0;}
        h2{font-size:18px;}
        .info-table td{padding:2px 6px;font-size:11px;}
        @media print{body{margin:10mm;}}
      </style>
      </head><body>
        <h2>Instrumen Supervisi Akademik (Kurikulum Merdeka)</h2>
        <h3>Supervisi Pelaksanaan Pembelajaran</h3>
        <br/>
        <table class="info-table" style="border:none;margin-bottom:10px;">
          <tr><td style="width:140px;">Nama Sekolah</td><td>: ${schoolName}</td></tr>
          <tr><td>Nama Guru</td><td>: ${obs.teachers?.name || ""}</td></tr>
          <tr><td>NIP</td><td>: ${obs.teachers?.nip || ""}</td></tr>
          <tr><td>Mata Pelajaran</td><td>: ${obs.mata_pelajaran || ""}</td></tr>
          <tr><td>Materi/Topik/Tema</td><td>: ${obs.materi_topik || ""}</td></tr>
          <tr><td>Tanggal Supervisi</td><td>: ${format(new Date(obs.observation_date), "dd MMMM yyyy", { locale: idLocale })}</td></tr>
        </table>

        <table style="border-collapse:collapse;width:100%;">
          <thead>
            <tr style="background:#d5e8d4;">
              <th style="border:1px solid #ddd;padding:5px;width:30px;font-size:10px;">No</th>
              <th style="border:1px solid #ddd;padding:5px;font-size:10px;">Aspek yang diamati: Pelaksanaan Pembelajaran</th>
              <th style="border:1px solid #ddd;padding:5px;width:50px;font-size:10px;">Sudah Lengkap/ Sesuai (2)</th>
              <th style="border:1px solid #ddd;padding:5px;width:50px;font-size:10px;">Kurang Lengkap/ Sesuai (1)</th>
              <th style="border:1px solid #ddd;padding:5px;width:40px;font-size:10px;">Tidak (0)</th>
              <th style="border:1px solid #ddd;padding:5px;width:80px;font-size:10px;">Catatan</th>
            </tr>
          </thead>
          <tbody>${rowHtml}</tbody>
        </table>

        <br/>
        <table style="border:none;width:100%;margin-top:8px;">
          <tr>
            <td style="border:none;width:50%;">Jumlah: ${total}</td>
            <td style="border:none;">Skor Total: ${total} / ${SCORE_MAX}</td>
          </tr>
          <tr>
            <td style="border:none;" colspan="2">
              Nilai Akhir = ${total} / ${SCORE_MAX} × 100 = <strong>${pct}%</strong> &nbsp;
              Predikat: <strong>${predikat.label}</strong>
            </td>
          </tr>
        </table>

        <p style="font-size:10px;margin-top:6px;">
          Keterangan: Nilai Akhir = Skor Perolehan / Skor Maksimal (${SCORE_MAX}) × 100%<br/>
          Ketercapaian: 91–100% = Sangat Baik &nbsp;|&nbsp; 81–90% = Baik &nbsp;|&nbsp; 71–80% = Cukup &nbsp;|&nbsp; Di bawah 71% = Kurang
        </p>

        ${obs.notes ? `<p style="font-size:10px;margin-top:4px;"><strong>Catatan:</strong> ${obs.notes}</p>` : ""}
        ${obs.tindak_lanjut ? `<p style="font-size:10px;"><strong>Tindak Lanjut:</strong> ${obs.tindak_lanjut}</p>` : ""}

        <br/><br/>
        <table style="border:none;width:100%;">
          <tr>
            <td style="border:none;width:50%;"></td>
            <td style="border:none;text-align:center;">${cityName}, ${printDate}</td>
          </tr>
          <tr>
            <td style="border:none;text-align:center;">Guru yang di Supervisi,</td>
            <td style="border:none;text-align:center;">Kepala Sekolah / Tim Supervisi,</td>
          </tr>
          <tr>
            <td style="border:none;text-align:center;"><br/><br/><br/><br/>
              <u>${obs.teachers?.name || ""}</u><br/>NIP. ${obs.teachers?.nip || ""}
            </td>
            <td style="border:none;text-align:center;"><br/><br/><br/><br/>
              <u>${principalName}</u><br/>NIP. ${principalNip}
            </td>
          </tr>
        </table>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );

  const renderFormContent = (f: FormState, setF: (fn: (p: FormState) => FormState) => void, prefix: string) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Guru <span className="text-destructive">*</span></Label>
          <Select value={f.teacher_id} onValueChange={(v) => setF(p => ({ ...p, teacher_id: v }))}>
            <SelectTrigger><SelectValue placeholder="Pilih guru" /></SelectTrigger>
            <SelectContent>
              {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} — {t.nip}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tanggal Supervisi</Label>
          <Input type="date" value={f.observation_date} onChange={(e) => setF(p => ({ ...p, observation_date: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Mata Pelajaran</Label>
          <Input placeholder="Contoh: Matematika" value={f.mata_pelajaran} onChange={(e) => setF(p => ({ ...p, mata_pelajaran: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Materi / Topik / Tema</Label>
          <Input placeholder="Judul materi yang diajarkan" value={f.materi_topik} onChange={(e) => setF(p => ({ ...p, materi_topik: e.target.value }))} />
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold mb-1">Penilaian Komponen Pelaksanaan Pembelajaran</p>
        <p className="text-xs text-muted-foreground mb-2">2 = Sudah Lengkap/Sesuai &nbsp;|&nbsp; 1 = Kurang Lengkap/Sesuai &nbsp;|&nbsp; 0 = Tidak Ada</p>
        <ObservationScoreTable
          scores={f.scores}
          prefix={prefix}
          onChange={(key, val) => setF(p => ({ ...p, scores: { ...p.scores, [key]: val } }))}
        />
        {(() => {
          const total = calcTotal(f.scores);
          const pct = Math.round((total / SCORE_MAX) * 100);
          const pred = getPredikat(pct);
          return (
            <div className="mt-3 p-3 bg-muted/30 rounded-lg flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>Skor: <strong>{total}/{SCORE_MAX}</strong></span>
              <span>Nilai: <strong>{pct}%</strong></span>
              <Badge className={`${pred.color} text-white border-0`}>{pred.label}</Badge>
            </div>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-1.5">
          <Label>Catatan Observasi</Label>
          <Textarea placeholder="Catatan hasil observasi..." rows={2} value={f.notes} onChange={(e) => setF(p => ({ ...p, notes: e.target.value }))} />
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
              <h1 className="text-base sm:text-lg font-bold">Supervisi Pelaksanaan</h1>
              <p className="text-xs sm:text-sm opacity-90">{observations.length} data</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-1.5 flex-shrink-0">
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Buat Observasi</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Instrumen Supervisi Akademik (Kurikulum Merdeka)</DialogTitle>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-5">
                {renderFormContent(form, setForm, "new_")}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Batal</Button>
                  <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? "Menyimpan..." : "Simpan"}</Button>
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
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Instrumen Supervisi</DialogTitle>
          </DialogHeader>
          <form onSubmit={onUpdate} className="space-y-5">
            <FormContent f={editForm} setF={setEditForm} prefix="edit_" />
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? "Menyimpan..." : "Simpan Perubahan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Observasi?</AlertDialogTitle>
            <AlertDialogDescription>Data ini akan dihapus permanen dan tidak dapat dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-3 sm:p-4 space-y-3">
        {observations.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <ClipboardList className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2 text-center">Belum ada data observasi</p>
              <p className="text-sm text-muted-foreground mb-4 text-center">Mulai buat instrumen supervisi pelaksanaan pembelajaran</p>
              <Button onClick={() => setDialogOpen(true)} className="gap-1.5"><Plus className="w-4 h-4" /> Buat Observasi</Button>
            </div>
          </Card>
        ) : (
          observations.map((obs) => {
            const scores: Record<string, number> = obs.scores || {};
            const total = ALL_ITEM_KEYS.reduce((s, k) => s + (Number(scores[k]) || 0), 0);
            const pct = Math.round((total / SCORE_MAX) * 100);
            const predikat = getPredikat(pct);
            const isExpanded = expandedId === obs.id;

            return (
              <Card key={obs.id} className="shadow-[var(--shadow-card)]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm sm:text-base">{obs.teachers?.name}</h3>
                        <Badge className={`${predikat.color} text-white border-0 text-xs`}>{predikat.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">NIP: {obs.teachers?.nip}</p>
                      {obs.mata_pelajaran && <p className="text-xs text-muted-foreground">Mapel: {obs.mata_pelajaran}</p>}
                      {obs.materi_topik && <p className="text-xs text-muted-foreground">Materi: {obs.materi_topik}</p>}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(obs.observation_date), "dd MMM yyyy")}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-8 px-2" onClick={() => openEdit(obs)}>
                        <Pencil className="w-3 h-3" /><span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-8 px-2" onClick={() => handlePrint(obs)}>
                        <Printer className="w-3 h-3" /><span className="hidden sm:inline">Cetak</span>
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-8 px-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setDeleteId(obs.id)}>
                        <Trash2 className="w-3 h-3" /><span className="hidden sm:inline">Hapus</span>
                      </Button>
                      <Button size="sm" variant="ghost" className="px-2 h-8" onClick={() => setExpandedId(isExpanded ? null : obs.id)}>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Skor {total}/{SCORE_MAX}</span>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                    <div className="w-full bg-muted rounded h-2">
                      <div className={`${predikat.color} rounded h-2 transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="mt-3 border-t pt-3 space-y-3">
                      {OBSERVATION_SECTIONS.map((sec) => (
                        <div key={sec.section}>
                          <p className="text-xs font-bold text-primary mb-1">{sec.section}. {sec.title}</p>
                          {sec.groups.map((grp) => (
                            <div key={grp.num} className="mb-2">
                              <p className="text-xs font-semibold text-foreground mb-1 pl-2">{grp.num}. {grp.title}</p>
                              <div className="flex flex-col gap-1">
                                {grp.items.map((item, idx) => {
                                  const val = Number(scores[item.key]) || 0;
                                  const colors = ["text-destructive", "text-yellow-600", "text-green-600"];
                                  const labels = ["Tidak Ada", "Kurang Sesuai", "Sesuai"];
                                  return (
                                    <div key={item.key} className="flex items-start justify-between text-xs gap-2 pl-4">
                                      <span className="text-muted-foreground flex-1">{item.label}</span>
                                      <Badge variant="outline" className={`text-xs ${colors[val]} flex-shrink-0`}>{labels[val]}</Badge>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                      {obs.notes && (
                        <div className="border-t pt-2">
                          <p className="text-xs font-medium text-muted-foreground">Catatan:</p>
                          <p className="text-sm">{obs.notes}</p>
                        </div>
                      )}
                      {obs.tindak_lanjut && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Tindak Lanjut:</p>
                          <p className="text-sm">{obs.tindak_lanjut}</p>
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
    </div>
  );
}
