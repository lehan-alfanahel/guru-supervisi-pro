import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSchool, getTeachers, createTeacher, updateTeacher, deleteTeacher, Teacher, TeacherRank, EmploymentType } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2, Users } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import BottomNav from "@/components/BottomNav";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { getUserFriendlyError } from "@/lib/errorHandler";

const teacherSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter").max(100, "Nama maksimal 100 karakter"),
  nip: z.string().trim().regex(/^[0-9]{18}$/, "NIP harus 18 digit angka"),
  email: z.string().trim().email("Email tidak valid").max(255, "Email maksimal 255 karakter"),
  rank: z.enum(["Tidak Ada", "III.A", "III.B", "III.C", "III.D", "IV.A", "IV.B", "IV.C", "IV.D", "IX"] as const, {
    errorMap: () => ({ message: "Pilih golongan" }),
  }),
  employment_type: z.enum(["PNS", "PPPK", "Guru Honorer"] as const, {
    errorMap: () => ({ message: "Pilih jenis kepegawaian" }),
  }),
});

const RANKS: TeacherRank[] = ['Tidak Ada', 'III.A', 'III.B', 'III.C', 'III.D', 'IV.A', 'IV.B', 'IV.C', 'IV.D', 'IX'];
const EMPLOYMENT_TYPES: EmploymentType[] = ['PNS', 'PPPK', 'Guru Honorer'];

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schoolId, setSchoolId] = useState<string>("");
  const [schoolNpsn, setSchoolNpsn] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<z.infer<typeof teacherSchema>>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: "",
      nip: "",
      email: "",
      rank: undefined,
      employment_type: undefined,
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
      setSchoolNpsn(school.npsn || "");
      const teachersData = await getTeachers(school.id);
      setTeachers(teachersData);
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

  const onSubmit = async (data: z.infer<typeof teacherSchema>) => {
    if (!schoolId) return;
    setLoading(true);

    try {
      if (editingTeacher) {
        await updateTeacher(editingTeacher.id, data);
        toast({ title: "Berhasil!", description: "Data guru berhasil diperbarui" });
      } else {
        await createTeacher({
          name: data.name,
          nip: data.nip,
          email: data.email,
          rank: data.rank,
          employment_type: data.employment_type,
          school_id: schoolId,
        });

        // Create teacher account via edge function
        const { data: accountData, error: accountError } = await supabase.functions.invoke("create-teacher-account", {
          body: {
            email: data.email,
            npsn: schoolNpsn,
          },
        });

        if (accountError) {
          toast({
            title: "Warning",
            description: "Guru berhasil ditambahkan, tetapi gagal membuat akun login",
            variant: "default",
          });
        } else if (accountData?.temporaryPassword) {
          toast({
            title: "Berhasil!",
            description: `Akun login dibuat. Password: ${accountData.temporaryPassword}`,
            duration: 10000,
          });
        } else {
          toast({
            title: "Berhasil!",
            description: "Guru berhasil ditambahkan dan akun login telah dibuat",
          });
        }
      }

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

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    reset({
      name: teacher.name,
      nip: teacher.nip,
      email: teacher.email,
      rank: teacher.rank,
      employment_type: teacher.employment_type,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!teacherToDelete) return;

    try {
      await deleteTeacher(teacherToDelete);
      toast({ title: "Berhasil!", description: "Guru berhasil dihapus" });
      setDeleteDialogOpen(false);
      setTeacherToDelete(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    reset({
      name: "",
      nip: "",
      email: "",
      rank: undefined,
      employment_type: undefined,
    });
    setEditingTeacher(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  if (loading && teachers.length === 0) {
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
              <h1 className="text-lg font-bold">Data Guru</h1>
              <p className="text-sm opacity-90">{teachers.length} guru terdaftar</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
                <Plus className="w-4 h-4" />
                Tambah
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingTeacher ? "Edit Guru" : "Tambah Guru"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Guru</Label>
                  <Input
                    id="name"
                    placeholder="Masukkan nama lengkap guru"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{String(errors.name.message)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nip">NIP (18 digit)</Label>
                  <Input
                    id="nip"
                    placeholder="123456789012345678"
                    {...register("nip")}
                  />
                  {errors.nip && (
                    <p className="text-sm text-destructive">{String(errors.nip.message)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@contoh.com"
                    {...register("email")}
                    disabled={!!editingTeacher}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{String(errors.email.message)}</p>
                  )}
                  {!editingTeacher && (
                    <p className="text-xs text-muted-foreground">
                      Password otomatis menggunakan NPSN sekolah
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rank">Pangkat</Label>
                  <Controller
                    name="rank"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih pangkat" />
                        </SelectTrigger>
                        <SelectContent>
                          {RANKS.map((rank) => (
                            <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.rank && (
                    <p className="text-sm text-destructive">{String(errors.rank.message)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employment_type">Jenis Kepegawaian</Label>
                  <Controller
                    name="employment_type"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis" />
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYMENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.employment_type && (
                    <p className="text-sm text-destructive">{String(errors.employment_type.message)}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose} className="flex-1">
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
        {teachers.length === 0 ? (
          <Card className="shadow-[var(--shadow-card)]">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Belum ada data guru</p>
              <p className="text-sm text-muted-foreground mb-4">Tambahkan guru pertama Anda</p>
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Tambah Guru
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {teachers.map((teacher) => (
              <Card key={teacher.id} className="shadow-[var(--shadow-card)]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{teacher.name}</h3>
                      <p className="text-sm text-muted-foreground">NIP: {teacher.nip}</p>
                      <p className="text-sm text-muted-foreground">{teacher.email}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                          {teacher.rank}
                        </span>
                        <span className="px-2 py-1 rounded-md bg-secondary/10 text-secondary text-xs font-medium">
                          {teacher.employment_type}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(teacher)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setTeacherToDelete(teacher.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Guru</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus guru ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
