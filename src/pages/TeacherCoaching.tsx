import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherBottomNav } from "@/components/TeacherBottomNav";
import { TeacherHeader } from "@/components/TeacherHeader";
import { Button } from "@/components/ui/button";
import { MessageSquare, Calendar, Printer } from "lucide-react";

interface CoachingSession {
  id: string;
  coaching_date: string;
  topic: string;
  findings: string | null;
  recommendations: string | null;
  follow_up: string | null;
}

interface TeacherInfo {
  name: string;
  nip: string;
  schoolName: string;
  principalName: string;
}

export default function TeacherCoaching() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { navigate("/auth"); return; }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadData = async () => {
    try {
      const { data: ta } = await supabase
        .from("teacher_accounts")
        .select("teachers(id, name, nip, school_id)")
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
        schoolName: school?.name || "",
        principalName: school?.principal_name || "",
      });

      const { data: coachingData } = await supabase
        .from("coaching_sessions")
        .select("*")
        .eq("teacher_id", teacher.id)
        .order("coaching_date", { ascending: false });

      setSessions(coachingData || []);
    } catch (error) {
      console.error("Error loading coaching:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (session: CoachingSession) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Laporan Coaching - ${teacherInfo?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 30px; color: #333; }
            h1 { font-size: 18px; text-align: center; }
            h2 { font-size: 15px; text-align: center; margin-top: 0; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            td { padding: 8px 12px; border: 1px solid #ccc; vertical-align: top; font-size: 13px; }
            .label { background: #f5f5f5; font-weight: bold; width: 35%; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 13px; }
            .sign-box { text-align: center; }
            .sign-line { margin-top: 60px; border-top: 1px solid #333; padding-top: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN COACHING GURU</h1>
            <h2>${teacherInfo?.schoolName}</h2>
          </div>
          <table>
            <tr><td class="label">Nama Guru</td><td>${teacherInfo?.name}</td></tr>
            <tr><td class="label">NIP</td><td>${teacherInfo?.nip}</td></tr>
            <tr><td class="label">Tanggal Coaching</td><td>${new Date(session.coaching_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</td></tr>
            <tr><td class="label">Topik Coaching</td><td>${session.topic}</td></tr>
            <tr><td class="label">Temuan / Observasi</td><td>${session.findings || "-"}</td></tr>
            <tr><td class="label">Rekomendasi</td><td>${session.recommendations || "-"}</td></tr>
            <tr><td class="label">Tindak Lanjut</td><td>${session.follow_up || "-"}</td></tr>
          </table>
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
          <h2 className="text-xl font-bold">Riwayat Coaching</h2>
          <p className="text-sm text-muted-foreground">Catatan coaching dari kepala sekolah</p>
        </div>

        {sessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-1">Belum ada sesi coaching</p>
              <p className="text-sm text-muted-foreground text-center">
                Sesi coaching akan muncul di sini setelah kepala sekolah membuat catatan coaching untuk Anda
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => (
              <Card key={session.id} className="shadow-[var(--shadow-card)]">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{session.topic}</CardTitle>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handlePrint(session)}>
                      <Printer className="w-3 h-3" /> Cetak
                    </Button>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(session.coaching_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {session.findings && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Temuan / Observasi</p>
                      <p className="text-sm">{session.findings}</p>
                    </div>
                  )}
                  {session.recommendations && (
                    <div className="rounded-lg bg-primary/5 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">Rekomendasi</p>
                      <p className="text-sm">{session.recommendations}</p>
                    </div>
                  )}
                  {session.follow_up && (
                    <div className="rounded-lg bg-secondary/5 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-secondary mb-1">Tindak Lanjut</p>
                      <p className="text-sm">{session.follow_up}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <TeacherBottomNav />
    </div>
  );
}
