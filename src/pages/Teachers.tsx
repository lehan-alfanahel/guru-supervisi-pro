import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSchool, getTeachers, createTeacher, updateTeacher, deleteTeacher, Teacher, TeacherRank, EmploymentType, Gender } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2, UserCheck } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import BottomNav from "@/components/BottomNav";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getUserFriendlyError } from "@/lib/errorHandler";

const teacherSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter").max(100, "Nama maksimal 100 karakter"),
  nip: z.string().trim().regex(/^[0-9]{18}$/, "NIP harus 18 digit angka"),
  gender: z.enum(["Laki-Laki", "Perempuan"] as const, {
    errorMap: () => ({ message: "Pilih jenis kelamin" }),
  }),
  rank: z.enum(["Tidak Ada", "III.A", "III.B", "III.C", "III.D", "IV.A", "IV.B", "IV.C", "IV.D", "IX"] as const, {
    errorMap: () => ({ message: "Pilih golongan" }),
  }),
  employment_type: z.enum(["PNS", "PPPK", "Guru Honorer"] as const, {
    errorMap: () => ({ message: "Pilih jenis kepegawaian" }),
  }),
});

const RANKS: TeacherRank[] = ['Tidak Ada', 'III.A', 'III.B', 'III.C', 'III.D', 'IV.A', 'IV.B', 'IV.C', 'IV.D', 'IX'];
const EMPLOYMENT_TYPES: EmploymentType[] = ['PNS', 'PPPK', 'Guru Honorer'];
const GENDERS: Gender[] = ['Laki-Laki', 'Perempuan'];

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schoolId, setSchoolId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
      gender: "Laki-Laki",
      rank: "Tidak Ada",
      employment_type: "PNS",
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
          gender: data.gender,
          rank: data.rank,
          employment_type: data.employment_type,
          school_id: schoolId,
        });
        toast({ title: "Berhasil!", description: "Guru berhasil ditambahkan" });
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
      gender: teacher.gender || "Laki-Laki",
      rank: teacher.rank || "Tidak Ada",
      employment_type: teacher.employment_type || "PNS",
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
      gender: "Laki-Laki",
      rank: "Tidak Ada",
      employment_type: "PNS",
    });
    setEditingTeacher(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  const formContent = (
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
        <Label htmlFor="gender">Jenis Kelamin</Label>
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis kelamin" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((gender) => (
                  <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.gender && (
          <p className="text-sm text-destructive">{String(errors.gender.message)}</p>
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
      
      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={handleDialogClose} className="flex-1">
          Batal
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );

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
      <header className="bg-primary text-primary-foreground border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Data Guru</h1>
              <p className="text-sm opacity-90">{teachers.length} guru terdaftar</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={() => navigate("/teacher-accounts")}
              className="gap-2"
            >
              <UserCheck className="w-4 h-4" />
              {!isMobile && "Akun Guru"}
            </Button>
            
            {isMobile ? (
              <Drawer open={dialogOpen} onOpenChange={setDialogOpen}>
                <DrawerTrigger asChild>
                  <Button size="sm" onClick={resetForm} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
                    <Plus className="w-4 h-4" />
                    Tambah
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-full rounded-none">
                  <div className="flex flex-col h-full px-4 pb-8">
                    <DrawerHeader className="px-0">
                      <DrawerTitle>{editingTeacher ? "Edit Guru" : "Tambah Guru"}</DrawerTitle>
                    </DrawerHeader>
                    <div className="flex-1 flex items-center justify-center overflow-y-auto">
                      <div className="w-full max-w-md py-4">
                        {formContent}
                      </div>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            ) : (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={resetForm} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
                    <Plus className="w-4 h-4" />
                    Tambah
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md sm:max-w-lg rounded-none max-h-screen overflow-hidden flex flex-col">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle>{editingTeacher ? "Edit Guru" : "Tambah Guru"}</DialogTitle>
                    <DialogDescription>
                      {editingTeacher ? "Edit data guru yang sudah ada" : "Tambahkan data guru baru ke sistem"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto px-1">
                    {formContent}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid gap-4">
          {teachers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Pencil className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Belum ada data guru</h3>
              <p className="text-muted-foreground mb-4">Tambahkan guru untuk memulai</p>
            </div>
          ) : (
            teachers.map((teacher) => (
              <div key={teacher.id} className="bg-card border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{teacher.name}</h3>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p>NIP: {teacher.nip}</p>
                      <p>Jenis Kelamin: {teacher.gender}</p>
                      <p>Pangkat: {teacher.rank}</p>
                      <p>Jenis Kepegawaian: {teacher.employment_type}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(teacher)}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setTeacherToDelete(teacher.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}
