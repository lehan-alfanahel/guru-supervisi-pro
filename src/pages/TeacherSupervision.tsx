import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherBottomNav } from "@/components/TeacherBottomNav";
import { TeacherHeader } from "@/components/TeacherHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Printer, Clock, ChevronDown, ChevronUp, ClipboardList } from "lucide-react";

interface TeacherInfo {
  id: string;
  name: string;
  nip: string;
  rank: string;
  schoolId: string;
  schoolName: string;
  principalName: string;
  principalNip: string;
}

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

function getPredikat(pct: number) {
  if (pct >= 91) return { label: "Sangat Baik", color: "bg-green-500" };
  if (pct >= 81) return { label: "Baik", color: "bg-primary" };
  if (pct >= 71) return { label: "Cukup", color: "bg-yellow-500" };
  return { label: "Kurang", color: "bg-destructive" };
}

export default function TeacherSupervision() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [supervisions, setSupervisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

      const { data: school, error: schoolError } = await supabase
        .from("schools")
        .select("name, principal_name, principal_nip")
        .eq("id", teacher.school_id)
        .single();

      if (schoolError) throw schoolError;

      setTeacherInfo({
        id: teacher.id,
        name: teacher.name,
        nip: teacher.nip,
        rank: teacher.rank,
        schoolId: teacher.school_id,
        schoolName: school.name,
        principalName: school.principal_name,
        principalNip: school.principal_nip,
      });

      const { data: supervisionsData } = await supabase
        .from("supervisions")
        .select("*")
        .eq("teacher_id", teacher.id)
        .order("supervision_date", { ascending: false });

      setSupervisions(supervisionsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = (s: any) =>
    SUPERVISION_COMPONENTS.reduce((sum, c) => sum + (Number(s[c.key]) || 0), 0);

  const calculatePct = (s: any) => Math.round((calculateScore(s) / SCORE_MAX) * 100);

  const handlePrint = (s: any) => {
    if (!teacherInfo) return;
    const score = calculateScore(s);
    const pct = calculatePct(s);
    const predikat = getPredikat(pct);
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
            <tr><td style="border:none;width:180px;">Nama Sekolah</td><td style="border:none;">: ${teacherInfo.schoolName}</td></tr>
            <tr><td style="border:none;">Nama Guru</td><td style="border:none;">: ${teacherInfo.name}</td></tr>
            <tr><td style="border:none;">Mata Pelajaran</td><td style="border:none;">: ${s.mata_pelajaran || ""}</td></tr>
            <tr><td style="border:none;">Jumlah Jam Tatap Muka</td><td style="border:none;">: ${s.teaching_hours || ""}</td></tr>
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
              <tr>
                <td colspan="2" style="font-weight:bold;">Jumlah</td>
                <td class="center">${SUPERVISION_COMPONENTS.filter(c => Number(s[c.key]) === 0).length}</td>
                <td class="center">${SUPERVISION_COMPONENTS.filter(c => Number(s[c.key]) === 1).length}</td>
                <td class="center">${SUPERVISION_COMPONENTS.filter(c => Number(s[c.key]) === 2).length}</td>
                <td></td>
              </tr>
              <tr>
                <td colspan="2" style="font-weight:bold;">Skor Total</td>
                <td class="center" colspan="3" style="font-weight:bold;">${score}</td>
                <td></td>
              </tr>
              <tr>
                <td colspan="2" style="font-weight:bold;">Ketercapaian</td>
                <td class="center" colspan="3" style="font-weight:bold;">${pct}% — <span class="predikat-box">${predikat.label}</span></td>
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
              <td style="border:none;text-align:center;">............, .............................<br/><br/><br/></td>
            </tr>
            <tr>
              <td style="border:none;text-align:center;">Guru yang di Supervisi</td>
              <td style="border:none;text-align:center;">Kepala Sekolah/ Tim Supervisi</td>
            </tr>
            <tr>
              <td style="border:none;text-align:center;"><br/><br/><br/><br/>
                <u>${teacherInfo.name}</u>
              </td>
              <td style="border:none;text-align:center;"><br/><br/><br/><br/>
                <u>${teacherInfo.principalName}</u><br/>
                NIP. ${teacherInfo.principalNip}
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
        {/* Page Header */}
        <div>
          <h2 className="text-xl font-bold">Hasil Supervisi</h2>
          <p className="text-sm text-muted-foreground">{supervisions.length} data dari kepala sekolah</p>
        </div>

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

        {/* Supervision Records */}
        {supervisions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-1">Belum ada data supervisi</p>
              <p className="text-sm text-muted-foreground text-center">
                Data supervisi akan muncul setelah kepala sekolah melakukan penilaian
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Riwayat Supervisi
            </h3>
            {supervisions.map((s, index) => {
              const score = calculateScore(s);
              const pct = calculatePct(s);
              const predikat = getPredikat(pct);
              const isExpanded = expandedId === s.id;
              const componentLabels = ["Tidak Ada", "Ada, tdk sesuai", "Ada & sesuai"];
              const componentColors = ["text-destructive", "text-yellow-600", "text-green-600"];

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
                        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handlePrint(s)}>
                          <Printer className="w-3 h-3" /> Cetak
                        </Button>
                        <Button size="sm" variant="ghost" className="px-2" onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="space-y-1">
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
                          <div className="pt-2 border-t mt-2">
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
      </div>

      <TeacherBottomNav />
    </div>
  );
}
