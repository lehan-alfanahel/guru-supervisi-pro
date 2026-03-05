import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherBottomNav } from "@/components/TeacherBottomNav";
import { TeacherHeader } from "@/components/TeacherHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Calendar, Printer } from "lucide-react";

interface SupervisionRecord {
  id: string;
  supervision_date: string;
  lesson_plan: boolean;
  syllabus: boolean;
  assessment_tools: boolean;
  teaching_materials: boolean;
  student_attendance: boolean;
  notes: string | null;
}

interface TeacherInfo {
  name: string;
  nip: string;
  rank: string;
  schoolName: string;
  principalName: string;
  teacherId: string;
}

export default function TeacherHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [supervisions, setSupervisions] = useState<SupervisionRecord[]>([]);
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [loading, setLoading] = useState(true);

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

      const { data: school } = await supabase
        .from("schools")
        .select("name, principal_name")
        .eq("id", teacher.school_id)
        .single();

      setTeacherInfo({
        name: teacher.name,
        nip: teacher.nip,
        rank: teacher.rank,
        schoolName: school?.name || "",
        principalName: school?.principal_name || "",
        teacherId: teacher.id,
      });

      const { data: sups } = await supabase
        .from("supervisions")
        .select("*")
        .eq("teacher_id", teacher.id)
        .order("supervision_date", { ascending: false });

      setSupervisions(sups || []);
    } catch (error) {
      console.error("Error loading supervisions:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompleteness = (s: SupervisionRecord) => {
    const items = [s.lesson_plan, s.syllabus, s.assessment_tools, s.teaching_materials, s.student_attendance];
    return Math.round((items.filter(Boolean).length / 5) * 100);
  };

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

  return (
    <div className="min-h-screen bg-background pb-20">
      <TeacherHeader teacherName={teacherInfo?.name || ""} schoolName={teacherInfo?.schoolName || ""} />

      <div className="p-4 space-y-4">
        <div>
          <h2 className="text-xl font-bold">Riwayat Supervisi</h2>
          <p className="text-sm text-muted-foreground">{supervisions.length} data supervisi</p>
        </div>

        {supervisions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-1">Belum ada supervisi</p>
              <p className="text-sm text-muted-foreground text-center">Data supervisi akan muncul setelah kepala sekolah melakukan supervisi</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {supervisions.map(s => {
              const completeness = calculateCompleteness(s);
              return (
                <Card key={s.id} className="shadow-[var(--shadow-card)]">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {new Date(s.supervision_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={completeness === 100 ? "default" : completeness >= 60 ? "secondary" : "destructive"}>
                          {completeness}%
                        </Badge>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => handlePrintSingle(s)}>
                          <Printer className="w-3 h-3" /> Cetak
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Kelengkapan Perangkat</span>
                        <span>{completeness}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${completeness}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {[
                        { label: "RPP", val: s.lesson_plan },
                        { label: "Silabus", val: s.syllabus },
                        { label: "Penilaian", val: s.assessment_tools },
                        { label: "Bahan Ajar", val: s.teaching_materials },
                        { label: "Daftar Hadir", val: s.student_attendance },
                      ].map(item => (
                        <div key={item.label} className={`flex items-center gap-1 ${item.val ? "text-green-600" : "text-muted-foreground"}`}>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${item.val ? "bg-green-600 border-green-600" : "border-muted-foreground"}`}>
                            {item.val && <span className="text-white text-xs">✓</span>}
                          </div>
                          {item.label}
                        </div>
                      ))}
                    </div>

                    {s.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Catatan:</p>
                        <p className="text-sm">{s.notes}</p>
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
