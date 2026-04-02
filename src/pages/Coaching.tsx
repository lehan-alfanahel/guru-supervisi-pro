import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getSchool, getTeachers, Teacher } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, MessageSquare, Calendar, Printer, Trash2, LogOut } from "lucide-react";
import { AdminBottomNav } from "@/components/AdminBottomNav";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const coachingSchema = z.object({
  teacher_id: z.string().min(1, "Pilih guru"),
  coaching_date: z.string().min(1, "Tanggal harus diisi"),
  topic: z.string().min(1, "Topik harus diisi").max(500),
  findings: z.string().max(5000).optional(),
  recommendations: z.string().max(5000).optional(),
  follow_up: z.string().max(5000).optional(),
});

interface CoachingSession {
  id: string;
  coaching_date: string;
  topic: string;
  findings: string | null;
  recommendations: string | null;
  follow_up: string | null;
  created_at: string;
  teachers?: { name: string; nip: string };
}

export default function Coaching() {
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [principalName, setPrincipalName] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => { await signOut(); navigate("/auth"); };

  const { register, handleSubmit: handleFormSubmit, formState: { errors }, reset, control } =
    useForm<z.infer<typeof coachingSchema>>({
      resolver: zodResolver(coachingSchema),
      defaultValues: {
        teacher_id: "",
        coaching_date: new Date().toISOString().split("T")[0],
        topic: "",
        findings: "",
        recommendations: "",
        follow_up: "",
      },
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
      setPrincipalName(school.principal_name);

      const [teachersData, sessionsData] = await Promise.all([
        getTeachers(school.id),
        supabase
          .from("coaching_sessions")
          .select("*, teachers(name, nip)")
          .eq("school_id", school.id)
          .order("coaching_date", { ascending: false }),
      ]);

      setTeachers(teachersData);
      setSessions((sessionsData.data as CoachingSession[]) || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof coachingSchema>) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("coaching_sessions").insert({
        school_id: schoolId,
        teacher_id: data.teacher_id,
        coaching_date: data.coaching_date,
        topic: data.topic,
        findings: data.findings || null,
        recommendations: data.recommendations || null,
        follow_up: data.follow_up || null,
        created_by: user.id,
      });
      if (error) throw error;
      toast({ title: "Berhasil!", description: "Data coaching berhasil disimpan" });
      setDialogOpen(false);
      reset();
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const onDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("coaching_sessions").delete().eq("id", deleteId);
      if (error) throw error;
      toast({ title: "🗑️ Coaching berhasil dihapus!" });
      setDeleteId(null);
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handlePrintAll = () => {
    const printContent = document.getElementById("coaching-print-area");
    if (!printContent) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Laporan Coaching Guru - ${schoolName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            h1 { font-size: 18px; text-align: center; }
            h2 { font-size: 15px; text-align: center; margin-top: 0; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .session { border: 1px solid #ccc; border-radius: 6px; padding: 12px; margin-bottom: 16px; page-break-inside: avoid; }
            .session-title { font-weight: bold; font-size: 15px; margin-bottom: 6px; }
            .meta { color: #666; font-size: 12px; margin-bottom: 10px; }
            .section { margin-bottom: 8px; }
            .section-label { font-weight: bold; font-size: 12px; color: #444; }
            .section-content { font-size: 13px; margin-top: 2px; }
            @media print { body { margin: 10px; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const handlePrintSingle = (session: CoachingSession) => {
    const teacher = session.teachers;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Laporan Coaching - ${teacher?.name}</title>
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
            <h2>${schoolName}</h2>
          </div>
          <table>
            <tr><td class="label">Nama Guru</td><td>${teacher?.name || "-"}</td></tr>
            <tr><td class="label">NIP</td><td>${teacher?.nip || "-"}</td></tr>
            <tr><td class="label">Tanggal Coaching</td><td>${new Date(session.coaching_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</td></tr>
            <tr><td class="label">Topik Coaching</td><td>${session.topic}</td></tr>
            <tr><td class="label">Temuan/Observasi</td><td>${session.findings || "-"}</td></tr>
            <tr><td class="label">Rekomendasi</td><td>${session.recommendations || "-"}</td></tr>
            <tr><td class="label">Tindak Lanjut</td><td>${session.follow_up || "-"}</td></tr>
          </table>
          <div class="footer">
            <div class="sign-box">
              <p>Kepala Sekolah,</p>
              <div class="sign-line">${principalName}</div>
            </div>
            <div class="sign-box">
              <p>Guru Yang Dicoaching,</p>
              <div class="sign-line">${teacher?.name || ""}</div>
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
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <header className="bg-primary text-primary-foreground border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="hover:bg-white/10 flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold">Coaching Guru</h1>
              <p className="text-xs sm:text-sm opacity-90">{sessions.length} sesi coaching</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {sessions.length > 0 && (
              <Button size="sm" variant="ghost" className="hover:bg-white/10 gap-1.5" onClick={handlePrintAll}>
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Cetak Semua</span>
              </Button>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-1.5">
                  <Plus className="w-4 h-4" /> Buat Coaching
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Sesi Coaching Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Guru</Label>
                    <Controller name="teacher_id" control={control} render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Pilih guru" /></SelectTrigger>
                        <SelectContent>
                          {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name} - {t.nip}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )} />
                    {errors.teacher_id && <p className="text-sm text-destructive">{errors.teacher_id.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Coaching</Label>
                    <Input type="date" {...register("coaching_date")} />
                    {errors.coaching_date && <p className="text-sm text-destructive">{errors.coaching_date.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Topik Coaching</Label>
                    <Input placeholder="Contoh: Strategi Pembelajaran Diferensiasi" {...register("topic")} />
                    {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Temuan / Observasi</Label>
                    <Textarea placeholder="Tuliskan hasil temuan atau observasi..." rows={3} {...register("findings")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Rekomendasi</Label>
                    <Textarea placeholder="Tuliskan rekomendasi kepada guru..." rows={3} {...register("recommendations")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tindak Lanjut</Label>
                    <Textarea placeholder="Tuliskan rencana tindak lanjut..." rows={3} {...register("follow_up")} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Batal</Button>
                    <Button type="submit" className="flex-1">Simpan</Button>
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Sesi Coaching?</AlertDialogTitle>
            <AlertDialogDescription>
              Data coaching ini akan dihapus permanen dan tidak dapat dikembalikan.
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

      {/* Hidden print area */}
      <div id="coaching-print-area" style={{ display: "none" }}>
        <div style={{ textAlign: "center", marginBottom: "20px", borderBottom: "2px solid #333", paddingBottom: "10px" }}>
          <h1 style={{ margin: 0 }}>LAPORAN COACHING GURU</h1>
          <h2 style={{ margin: "4px 0 0" }}>{schoolName}</h2>
        </div>
        {sessions.map(s => (
          <div key={s.id} style={{ border: "1px solid #ccc", padding: "12px", marginBottom: "16px" }}>
            <div style={{ fontWeight: "bold", fontSize: "15px", marginBottom: "6px" }}>{s.teachers?.name} - NIP: {s.teachers?.nip}</div>
            <div style={{ color: "#666", fontSize: "12px", marginBottom: "10px" }}>Tanggal: {new Date(s.coaching_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} | Topik: {s.topic}</div>
            {s.findings && <div style={{ marginBottom: "8px" }}><span style={{ fontWeight: "bold", fontSize: "12px" }}>Temuan: </span><span style={{ fontSize: "13px" }}>{s.findings}</span></div>}
            {s.recommendations && <div style={{ marginBottom: "8px" }}><span style={{ fontWeight: "bold", fontSize: "12px" }}>Rekomendasi: </span><span style={{ fontSize: "13px" }}>{s.recommendations}</span></div>}
            {s.follow_up && <div style={{ marginBottom: "8px" }}><span style={{ fontWeight: "bold", fontSize: "12px" }}>Tindak Lanjut: </span><span style={{ fontSize: "13px" }}>{s.follow_up}</span></div>}
          </div>
        ))}
      </div>

      <main className="max-w-4xl mx-auto p-3 sm:p-4">
        {sessions.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2 text-center">Belum ada sesi coaching</p>
              <p className="text-sm text-muted-foreground mb-4 text-center">Buat sesi coaching pertama Anda</p>
              <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
                <Plus className="w-4 h-4" /> Buat Coaching
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-3">
            {sessions.map(session => (
              <Card key={session.id} className="shadow-[var(--shadow-card)]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base leading-tight">{session.teachers?.name}</h3>
                      <p className="text-xs text-muted-foreground">NIP: {session.teachers?.nip}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        {new Date(session.coaching_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-8 px-2" onClick={() => handlePrintSingle(session)}>
                        <Printer className="w-3 h-3" />
                        <span className="hidden sm:inline">Cetak</span>
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="gap-1 text-xs h-8 px-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                        onClick={() => setDeleteId(session.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Hapus</span>
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-primary/5 rounded-lg p-3">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Topik Coaching</p>
                      <p className="text-sm">{session.topic}</p>
                    </div>
                    {session.findings && (
                      <div className="rounded-lg border p-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Temuan / Observasi</p>
                        <p className="text-sm">{session.findings}</p>
                      </div>
                    )}
                    {session.recommendations && (
                      <div className="rounded-lg border p-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Rekomendasi</p>
                        <p className="text-sm">{session.recommendations}</p>
                      </div>
                    )}
                    {session.follow_up && (
                      <div className="rounded-lg border p-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Tindak Lanjut</p>
                        <p className="text-sm">{session.follow_up}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AdminBottomNav />
    </div>
  );
}
