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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, ClipboardList, Calendar, Printer, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AdminBottomNav } from "@/components/AdminBottomNav";
import { format } from "date-fns";

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
  const [principalName, setPrincipalName] = useState("");
  const [principalNip, setPrincipalNip] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>({
    teacher_id: "",
    supervision_date: new Date().toISOString().split("T")[0],
    mata_pelajaran: "",
    notes: "",
    tindak_lanjut: "",
    scores: { ...defaultScores },
  });

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    if (!user) return;
    try {
      const school = await getSchool(user.id);
      if (!school) { navigate("/setup-school"); return; }
      setSchoolId(school.id);
      setSchoolName(school.name);
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
    });
  };

  const handleScoreChange = (key: string, val: ScoreValue) => {
    setForm((prev) => ({ ...prev, scores: { ...prev.scores, [key]: val } }));
  };

  const calculateScore = (supervision: any) => {
    const total = SUPERVISION_COMPONENTS.reduce(
      (sum, c) => sum + (Number(supervision[c.key]) || 0),
      0
    );
    return total;
  };

  const calculatePct = (supervision: any) => {
    const score = calculateScore(supervision);
    return Math.round((score / SCORE_MAX) * 100);
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

  const handlePrintSingle = (s: any) => {
    const score = calculateScore(s);
    const pct = Math.round((score / SCORE_MAX) * 100);
    const predikat = getPredikat(pct);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Instrumen Supervisi - ${s.teachers?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 30px; color: #333; font-size: 13px; }
            h1, h2 { text-align: center; margin: 3px 0; }
            h1 { font-size: 14px; }
            h2 { font-size: 13px; }
            .info-table { width: 100%; margin-bottom: 14px; }
            .info-table td { padding: 3px 6px; }
            .info-table td:first-child { width: 180px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            td, th { padding: 6px 10px; border: 1px solid #999; }
            th { background: #f0f0f0; text-align: center; font-size: 12px; }
            .center { text-align: center; }
            .score-cell { text-align: center; font-weight: bold; }
            .footer-row { display: flex; justify-content: space-between; margin-top: 16px; }
            .sign-block { width: 45%; text-align: center; }
            .sign-space { height: 60px; }
            .sign-line { border-top: 1px solid #333; margin-top: 4px; padding-top: 2px; font-size: 12px; }
            .summary-table { width: 100%; border-collapse: collapse; }
            .summary-table td { padding: 5px 10px; border: 1px solid #999; font-size: 12px; }
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
            <tr><td>Mata Pelajaran</td><td>: ${s.mata_pelajaran || ""}</td></tr>
            <tr><td>Jumlah Jam Tatap Muka</td><td>: ${s.teaching_hours || ""}</td></tr>
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
                return `<tr>
                  <td class="center">${i + 1}</td>
                  <td>${c.label}</td>
                  <td class="center">${val === 0 ? "✓" : ""}</td>
                  <td class="center">${val === 1 ? "✓" : ""}</td>
                  <td class="center">${val === 2 ? "✓" : ""}</td>
                  <td></td>
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
                ............, .............................<br/><br/><br/>
              </td>
            </tr>
            <tr>
              <td style="border:none;text-align:center;">Guru yang di Supervisi</td>
              <td style="border:none;text-align:center;">Kepala Sekolah/ Tim Supervisi</td>
            </tr>
            <tr>
              <td style="border:none;text-align:center;"><br/><br/><br/><br/>
                <u>${s.teachers?.name || ""}</u>
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

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      {/* Header */}
      <header className="bg-primary text-primary-foreground border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Supervisi</h1>
              <p className="text-sm opacity-90">{supervisions.length} data</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-1.5">
                <Plus className="w-4 h-4" /> Buat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Instrumen Supervisi Akademik</DialogTitle>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-5">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Guru <span className="text-destructive">*</span></Label>
                    <Select value={form.teacher_id} onValueChange={(v) => setForm((p) => ({ ...p, teacher_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih guru" />
                      </SelectTrigger>
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
                  <div className="space-y-1.5">
                    <Label>Mata Pelajaran</Label>
                    <Input placeholder="Contoh: Matematika" value={form.mata_pelajaran}
                      onChange={(e) => setForm((p) => ({ ...p, mata_pelajaran: e.target.value }))} />
                  </div>
                </div>

                {/* Scoring Table */}
                <div>
                  <p className="text-sm font-semibold mb-2">Komponen Administrasi Pembelajaran</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    0 = Tidak Ada &nbsp;|&nbsp; 1 = Ada tetapi tidak sesuai &nbsp;|&nbsp; 2 = Ada dan sesuai
                  </p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-2 text-left border-b w-8">No</th>
                          <th className="p-2 text-left border-b">Komponen</th>
                          <th className="p-2 text-center border-b w-12">0</th>
                          <th className="p-2 text-center border-b w-12">1</th>
                          <th className="p-2 text-center border-b w-12">2</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SUPERVISION_COMPONENTS.map((c, i) => (
                          <tr key={c.key} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                            <td className="p-2 text-center text-muted-foreground border-b">{i + 1}</td>
                            <td className="p-2 border-b">{c.label}</td>
                            {([0, 1, 2] as ScoreValue[]).map((val) => (
                              <td key={val} className="p-2 text-center border-b">
                                <input
                                  type="radio"
                                  name={c.key}
                                  value={val}
                                  checked={form.scores[c.key] === val}
                                  onChange={() => handleScoreChange(c.key, val)}
                                  className="accent-primary w-4 h-4 cursor-pointer"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Score summary */}
                  {(() => {
                    const total = Object.values(form.scores).reduce((s, v) => s + v, 0);
                    const pct = Math.round((total / SCORE_MAX) * 100);
                    const predikat = getPredikat(pct);
                    return (
                      <div className="mt-3 p-3 bg-muted/30 rounded-lg flex items-center justify-between text-sm">
                        <span>Skor: <strong>{total}/{SCORE_MAX}</strong></span>
                        <span>Nilai: <strong>{pct}%</strong></span>
                        <Badge className={`${predikat.color} text-white border-0`}>{predikat.label}</Badge>
                      </div>
                    );
                  })()}
                </div>

                {/* Catatan & Tindak Lanjut */}
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
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {supervisions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Belum ada supervisi</p>
              <p className="text-sm text-muted-foreground mb-4">Mulai buat instrumen supervisi pertama</p>
              <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
                <Plus className="w-4 h-4" /> Buat Supervisi
              </Button>
            </CardContent>
          </Card>
        ) : (
          supervisions.map((s) => {
            const score = calculateScore(s);
            const pct = calculatePct(s);
            const predikat = getPredikat(pct);
            const isExpanded = expandedId === s.id;
            return (
              <Card key={s.id} className="shadow-[var(--shadow-card)]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{s.teachers?.name}</h3>
                        <Badge className={`${predikat.color} text-white border-0 text-xs`}>{predikat.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">NIP: {s.teachers?.nip}</p>
                      {s.mata_pelajaran && <p className="text-xs text-muted-foreground">Mapel: {s.mata_pelajaran}</p>}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(s.supervision_date), "dd MMM yyyy")}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handlePrintSingle(s)}>
                        <Printer className="w-3 h-3" /> Cetak
                      </Button>
                      <Button size="sm" variant="ghost" className="px-2" onClick={() => setExpandedId(isExpanded ? null : s.id)}>
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
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className={`${predikat.color} rounded-full h-2 transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="mt-3 border-t pt-3 space-y-2">
                      <div className="grid grid-cols-1 gap-1">
                        {SUPERVISION_COMPONENTS.map((c, i) => {
                          const val = Number(s[c.key]) || 0;
                          const colors = ["text-destructive", "text-yellow-600", "text-green-600"];
                          const labels = ["Tidak Ada", "Ada, tidak sesuai", "Ada dan sesuai"];
                          return (
                            <div key={c.key} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{i + 1}. {c.label}</span>
                              <Badge variant="outline" className={`text-xs ${colors[val]}`}>{labels[val]}</Badge>
                            </div>
                          );
                        })}
                      </div>
                      {s.notes && (
                        <div className="pt-2">
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
    </div>
  );
}
