import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherBottomNav } from "@/components/TeacherBottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface TeacherInfo {
  id: string;
  name: string;
  rank: string;
  schoolId: string;
  schoolName: string;
  teacherAccountId: string;
}

interface AdministrationData {
  id: string;
  teaching_hours: string;
  semester_class: string;
  calendar_link: string;
  annual_program_link: string;
  assessment_use_link: string;
  learning_flow_link: string;
  teaching_module_link: string;
  teaching_material_link: string;
  schedule_link: string;
  assessment_program_link: string;
  grade_list_link: string;
  daily_agenda_link: string;
  attendance_link: string;
  created_at: string;
}

export default function TeacherSupervision() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [administrationRecords, setAdministrationRecords] = useState<AdministrationData[]>([]);

  const [formData, setFormData] = useState({
    teachingHours: "",
    semesterClass: "",
    calendarLink: "",
    annualProgramLink: "",
    assessmentUseLink: "",
    learningFlowLink: "",
    teachingModuleLink: "",
    teachingMaterialLink: "",
    scheduleLink: "",
    assessmentProgramLink: "",
    gradeListLink: "",
    dailyAgendaLink: "",
    attendanceLink: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const { data: teacherAccount, error: accountError } = await supabase
        .from("teacher_accounts")
        .select(`
          id,
          teachers (
            id,
            name,
            rank,
            school_id
          )
        `)
        .eq("user_id", user?.id)
        .single();

      if (accountError) throw accountError;

      if (teacherAccount && teacherAccount.teachers) {
        const teacher = Array.isArray(teacherAccount.teachers) 
          ? teacherAccount.teachers[0] 
          : teacherAccount.teachers;

        const { data: school, error: schoolError } = await supabase
          .from("schools")
          .select("name")
          .eq("id", teacher.school_id)
          .single();

        if (schoolError) throw schoolError;

        setTeacherInfo({
          id: teacher.id,
          name: teacher.name,
          rank: teacher.rank,
          schoolId: teacher.school_id,
          schoolName: school.name,
          teacherAccountId: teacherAccount.id,
        });

        // Load existing administration records
        const { data: records, error: recordsError } = await supabase
          .from("teaching_administration")
          .select("*")
          .eq("teacher_account_id", teacherAccount.id)
          .order("created_at", { ascending: false });

        if (recordsError) throw recordsError;
        setAdministrationRecords(records || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teacherInfo) return;

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("teaching_administration")
        .insert({
          school_id: teacherInfo.schoolId,
          teacher_id: teacherInfo.id,
          teacher_account_id: teacherInfo.teacherAccountId,
          teaching_hours: formData.teachingHours,
          semester_class: formData.semesterClass,
          calendar_link: formData.calendarLink,
          annual_program_link: formData.annualProgramLink,
          assessment_use_link: formData.assessmentUseLink,
          learning_flow_link: formData.learningFlowLink,
          teaching_module_link: formData.teachingModuleLink,
          teaching_material_link: formData.teachingMaterialLink,
          schedule_link: formData.scheduleLink,
          assessment_program_link: formData.assessmentProgramLink,
          grade_list_link: formData.gradeListLink,
          daily_agenda_link: formData.dailyAgendaLink,
          attendance_link: formData.attendanceLink,
        });

      if (error) throw error;

      toast({
        title: "✅ Data berhasil disimpan!",
        description: "Administrasi pembelajaran telah tersimpan.",
      });

      // Reset form
      setFormData({
        teachingHours: "",
        semesterClass: "",
        calendarLink: "",
        annualProgramLink: "",
        assessmentUseLink: "",
        learningFlowLink: "",
        teachingModuleLink: "",
        teachingMaterialLink: "",
        scheduleLink: "",
        assessmentProgramLink: "",
        gradeListLink: "",
        dailyAgendaLink: "",
        attendanceLink: "",
      });

      // Reload records
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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
          <CardHeader>
            <CardTitle>Data tidak ditemukan</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-primary text-primary-foreground p-6">
        <h1 className="text-xl md:text-2xl font-bold text-center">
          INSTRUMEN TELAAH ADMINISTRASI PEMBELAJARAN
        </h1>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Data Guru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Nama Sekolah</p>
              <p className="font-medium">{teacherInfo.schoolName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nama Guru</p>
              <p className="font-medium">{teacherInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pangkat/Golongan</p>
              <p className="font-medium">{teacherInfo.rank}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Administrasi Pembelajaran</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teachingHours">Jumlah Jam Tatap Muka</Label>
                <Input
                  id="teachingHours"
                  placeholder="Contoh: 24"
                  value={formData.teachingHours}
                  onChange={(e) => setFormData({ ...formData, teachingHours: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="semesterClass">Semester/Kelas</Label>
                <Input
                  id="semesterClass"
                  placeholder="Contoh: Semester 1 / Kelas 5"
                  value={formData.semesterClass}
                  onChange={(e) => setFormData({ ...formData, semesterClass: e.target.value })}
                  required
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Komponen Administrasi (Link Google Drive)</h3>
                
                <div className="space-y-4">
                  {[
                    { id: "calendarLink", label: "Kalender Pendidikan", key: "calendarLink" },
                    { id: "annualProgramLink", label: "Program Tahunan", key: "annualProgramLink" },
                    { id: "assessmentUseLink", label: "Pemanfaatan Hasil Asesmen Diagnostik/Asesmen Awal", key: "assessmentUseLink" },
                    { id: "learningFlowLink", label: "Alur Tujuan Pembelajaran", key: "learningFlowLink" },
                    { id: "teachingModuleLink", label: "Modul Ajar", key: "teachingModuleLink" },
                    { id: "teachingMaterialLink", label: "Bahan Ajar/Buku Guru dan Buku Siswa", key: "teachingMaterialLink" },
                    { id: "scheduleLink", label: "Jadwal Pelajaran", key: "scheduleLink" },
                    { id: "assessmentProgramLink", label: "Program Penilaian", key: "assessmentProgramLink" },
                    { id: "gradeListLink", label: "Daftar Nilai / Hasil Asesmen", key: "gradeListLink" },
                    { id: "dailyAgendaLink", label: "Agenda Harian", key: "dailyAgendaLink" },
                    { id: "attendanceLink", label: "Absensi Murid", key: "attendanceLink" },
                  ].map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id}>{field.label}</Label>
                      <Input
                        id={field.id}
                        type="url"
                        placeholder="Masukkan link Google Drive"
                        value={formData[field.key as keyof typeof formData]}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#FF7A18] hover:bg-[#FF7A18]/90"
                disabled={submitting}
              >
                {submitting ? "Menyimpan..." : "SIMPAN DATA"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {administrationRecords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Data Administrasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal Simpan</TableHead>
                      <TableHead>Semester/Kelas</TableHead>
                      <TableHead>Jam Mengajar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {administrationRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {format(new Date(record.created_at), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell>{record.semester_class}</TableCell>
                        <TableCell>{record.teaching_hours}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <TeacherBottomNav />
    </div>
  );
}
