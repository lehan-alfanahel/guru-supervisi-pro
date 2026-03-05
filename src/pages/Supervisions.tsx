import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSchool, getTeachers, getSupervisions, createSupervision, Teacher } from "@/lib/supabase";
import { getUserFriendlyError } from "@/lib/errorHandler";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, ClipboardList, Calendar, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AdminBottomNav } from "@/components/AdminBottomNav";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const supervisionSchema = z.object({
  teacher_id: z.string().min(1, "Pilih guru"),
  supervision_date: z.string().min(1, "Tanggal supervisi harus diisi"),
  lesson_plan: z.boolean().default(false),
  syllabus: z.boolean().default(false),
  assessment_tools: z.boolean().default(false),
  teaching_materials: z.boolean().default(false),
  student_attendance: z.boolean().default(false),
  notes: z.string().max(5000, "Catatan maksimal 5000 karakter").optional(),
});

export default function Supervisions() {
  const [supervisions, setSupervisions] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schoolId, setSchoolId] = useState<string>("");
  const [schoolName, setSchoolName] = useState<string>("");
  const [principalName, setPrincipalName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    reset,
    control,
    watch,
  } = useForm<z.infer<typeof supervisionSchema>>({
    resolver: zodResolver(supervisionSchema),
    defaultValues: {
      teacher_id: "",
      supervision_date: new Date().toISOString().split('T')[0],
      lesson_plan: false,
      syllabus: false,
      assessment_tools: false,
      teaching_materials: false,
      student_attendance: false,
      notes: "",
    },
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    if (!user) return;

    try {
      const school = await getSchool(user.id);
      if (!school) {
        navigate("/setup-school");
        return;
      }

      setSchoolId(school.id);
      setSchoolName(school.name);
      setPrincipalName(school.principal_name);
      const [teachersData, supervisionsData] = await Promise.all([
        getTeachers(school.id),
        getSupervisions(school.id),
      ]);

      setTeachers(teachersData);
      setSupervisions(supervisionsData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof supervisionSchema>) => {
    if (!user) return;

    setLoading(true);

    try {
      await createSupervision({
        teacher_id: data.teacher_id,
        supervision_date: data.supervision_date,
        lesson_plan: data.lesson_plan || false,
        syllabus: data.syllabus || false,
        assessment_tools: data.assessment_tools || false,
        teaching_materials: data.teaching_materials || false,
        student_attendance: data.student_attendance || false,
        notes: data.notes || "",
        school_id: schoolId,
        created_by: user.id,
      });

      toast({ title: "Berhasil!", description: "Supervisi berhasil disimpan" });
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    reset({
      teacher_id: "",
      supervision_date: new Date().toISOString().split('T')[0],
      lesson_plan: false,
      syllabus: false,
      assessment_tools: false,
      teaching_materials: false,
      student_attendance: false,
      notes: "",
    });
  };

  const calculateCompleteness = (supervision: any) => {
    const total = 5;
    const completed = [
      supervision.lesson_plan,
      supervision.syllabus,
      supervision.assessment_tools,
      supervision.teaching_materials,
      supervision.student_attendance,
    ].filter(Boolean).length;
    return Math.round((completed / total) * 100);
  };

  const handlePrintAll = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Laporan Supervisi - ${schoolName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { text-align: center; margin: 4px 0; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 16px; }
            .session { border: 1px solid #ccc; border-radius: 4px; padding: 12px; margin-bottom: 12px; page-break-inside: avoid; }
            .teacher { font-weight: bold; font-size: 15px; }
            .meta { color: #666; font-size: 12px; margin-bottom: 8px; }
            .items { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 12px; }
            .item-ok { color: green; }
            .item-no { color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN SUPERVISI PEMBELAJARAN</h1>
            <h2>${schoolName}</h2>
            <h2>Kepala Sekolah: ${principalName}</h2>
          </div>
          ${supervisions.map(s => {
            const c = calculateCompleteness(s);
            return `
              <div class="session">
                <div class="teacher">${s.teachers?.name}</div>
                <div class="meta">NIP: ${s.teachers?.nip} | Tanggal: ${new Date(s.supervision_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} | Kelengkapan: ${c}%</div>
                <div class="items">
                  <span class="${s.lesson_plan ? "item-ok" : "item-no"}">${s.lesson_plan ? "✓" : "✗"} RPP</span>
                  <span class="${s.syllabus ? "item-ok" : "item-no"}">${s.syllabus ? "✓" : "✗"} Silabus</span>
                  <span class="${s.assessment_tools ? "item-ok" : "item-no"}">${s.assessment_tools ? "✓" : "✗"} Penilaian</span>
                  <span class="${s.teaching_materials ? "item-ok" : "item-no"}">${s.teaching_materials ? "✓" : "✗"} Bahan Ajar</span>
                  <span class="${s.student_attendance ? "item-ok" : "item-no"}">${s.student_attendance ? "✓" : "✗"} Daftar Hadir</span>
                </div>
                ${s.notes ? `<div style="margin-top:8px;font-size:12px;color:#555;">Catatan: ${s.notes}</div>` : ""}
              </div>`;
          }).join("")}
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const handlePrintSingle = (supervision: any) => {
    const items = [
      { label: "RPP (Rencana Pelaksanaan Pembelajaran)", value: supervision.lesson_plan },
      { label: "Silabus", value: supervision.syllabus },
      { label: "Instrumen Penilaian", value: supervision.assessment_tools },
      { label: "Bahan Ajar", value: supervision.teaching_materials },
      { label: "Daftar Hadir Siswa", value: supervision.student_attendance },
    ];
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Instrumen Supervisi - ${supervision.teachers?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 30px; color: #333; }
            h1, h2 { text-align: center; margin: 4px 0; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
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
            <h2>${schoolName}</h2>
          </div>
          <table>
            <tr><td style="width:35%;background:#f5f5f5;font-weight:bold;">Nama Guru</td><td>${supervision.teachers?.name}</td></tr>
            <tr><td style="background:#f5f5f5;font-weight:bold;">NIP</td><td>${supervision.teachers?.nip}</td></tr>
            <tr><td style="background:#f5f5f5;font-weight:bold;">Tanggal Supervisi</td><td>${new Date(supervision.supervision_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</td></tr>
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
          ${supervision.notes ? `<div style="margin-top:16px;padding:10px;border:1px solid #ccc;"><strong>Catatan Observasi:</strong><br/>${supervision.notes}</div>` : ""}
          <div class="footer">
            <div class="sign-box">
              <p>Kepala Sekolah,</p>
              <div class="sign-line">${principalName}</div>
            </div>
            <div class="sign-box">
              <p>Guru,</p>
              <div class="sign-line">${supervision.teachers?.name || ""}</div>
            </div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  if (loading && supervisions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      {/* Header */}
      <header className="bg-primary text-primary-foreground border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="hover:bg-white/10 gap-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Supervisi</h1>
              <p className="text-sm opacity-90">{supervisions.length} supervisi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {supervisions.length > 0 && (
              <Button size="sm" variant="ghost" className="hover:bg-white/10 gap-1.5" onClick={handlePrintAll}>
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Cetak Semua</span>
              </Button>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-1.5">
                <Plus className="w-4 h-4" />
                Buat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Buat Supervisi Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teacher">Guru</Label>
                  <Controller
                    name="teacher_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih guru" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name} - {teacher.nip}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.teacher_id && (
                    <p className="text-sm text-destructive">{String(errors.teacher_id.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal Supervisi</Label>
                  <Input
                    id="date"
                    type="date"
                    {...register("supervision_date")}
                  />
                  {errors.supervision_date && (
                    <p className="text-sm text-destructive">{String(errors.supervision_date.message)}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Kelengkapan Perangkat Pembelajaran</Label>
                  
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="lesson_plan"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="lesson_plan"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <label htmlFor="lesson_plan" className="text-sm cursor-pointer">
                      RPP (Rencana Pelaksanaan Pembelajaran)
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name="syllabus"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="syllabus"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <label htmlFor="syllabus" className="text-sm cursor-pointer">
                      Silabus
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name="assessment_tools"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="assessment_tools"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <label htmlFor="assessment_tools" className="text-sm cursor-pointer">
                      Instrumen Penilaian
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name="teaching_materials"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="teaching_materials"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <label htmlFor="teaching_materials" className="text-sm cursor-pointer">
                      Bahan Ajar
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name="student_attendance"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="student_attendance"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <label htmlFor="student_attendance" className="text-sm cursor-pointer">
                      Daftar Hadir Siswa
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan Observasi (maks. 5000 karakter)</Label>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    placeholder="Tulis catatan hasil observasi, saran, atau rekomendasi..."
                    rows={4}
                  />
                  {errors.notes && (
                    <p className="text-sm text-destructive">{String(errors.notes.message)}</p>
                  )}
                </div>

                <div className="flex gap-1.5">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        {supervisions.length === 0 ? (
          <Card className="shadow-[var(--shadow-card)]">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Belum ada supervisi</p>
              <p className="text-sm text-muted-foreground mb-4">Buat supervisi pertama Anda</p>
              <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
                <Plus className="w-4 h-4" />
                Buat Supervisi
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {supervisions.map((supervision) => {
              const completeness = calculateCompleteness(supervision);
              return (
                <Card key={supervision.id} className="shadow-[var(--shadow-card)]">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{supervision.teachers?.name}</h3>
                          <p className="text-sm text-muted-foreground">NIP: {supervision.teachers?.nip}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(supervision.supervision_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Kelengkapan</span>
                          <span className="font-semibold">{completeness}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${completeness}%` }}
                          />
                        </div>
                      </div>

                      {/* Checklist Summary */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className={`flex items-center gap-1 ${supervision.lesson_plan ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${supervision.lesson_plan ? 'bg-green-600 border-green-600' : 'border-muted-foreground'}`}>
                            {supervision.lesson_plan && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span>RPP</span>
                        </div>
                        <div className={`flex items-center gap-1 ${supervision.syllabus ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${supervision.syllabus ? 'bg-green-600 border-green-600' : 'border-muted-foreground'}`}>
                            {supervision.syllabus && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span>Silabus</span>
                        </div>
                        <div className={`flex items-center gap-1 ${supervision.assessment_tools ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${supervision.assessment_tools ? 'bg-green-600 border-green-600' : 'border-muted-foreground'}`}>
                            {supervision.assessment_tools && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span>Penilaian</span>
                        </div>
                        <div className={`flex items-center gap-1 ${supervision.teaching_materials ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${supervision.teaching_materials ? 'bg-green-600 border-green-600' : 'border-muted-foreground'}`}>
                            {supervision.teaching_materials && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span>Bahan Ajar</span>
                        </div>
                        <div className={`flex items-center gap-1 ${supervision.student_attendance ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${supervision.student_attendance ? 'bg-green-600 border-green-600' : 'border-muted-foreground'}`}>
                            {supervision.student_attendance && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span>Daftar Hadir</span>
                        </div>
                      </div>

                      {supervision.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Catatan:</p>
                          <p className="text-sm">{supervision.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <AdminBottomNav />
    </div>
  );
}
