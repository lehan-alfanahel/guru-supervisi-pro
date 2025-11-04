import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSchool, getTeachers, getTeacherAccounts, createTeacherAccount, deleteTeacherAccount, Teacher } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, UserCheck } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import BottomNav from "@/components/BottomNav";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getUserFriendlyError } from "@/lib/errorHandler";
import { useIsMobile } from "@/hooks/use-mobile";

const accountSchema = z.object({
  teacherId: z.string().min(1, "Pilih guru"),
  email: z.string().trim().email("Email tidak valid").max(255, "Email maksimal 255 karakter"),
  password: z.string().min(12, "Password minimal 12 karakter").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/, "Password harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus"),
  confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

type AccountFormValues = z.infer<typeof accountSchema>;

export default function TeacherAccounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schoolId, setSchoolId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
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
    watch,
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      teacherId: "",
      email: "",
      password: "",
      confirmPassword: "",
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
      const [teachersData, accountsData] = await Promise.all([
        getTeachers(school.id),
        getTeacherAccounts(school.id),
      ]);
      
      setTeachers(teachersData);
      setAccounts(accountsData || []);
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

  const onSubmit = async (data: AccountFormValues) => {
    setLoading(true);

    try {
      const result = await createTeacherAccount(data.teacherId, data.email, data.password);
      
      if (result?.temporaryPassword) {
        toast({
          title: "Berhasil!",
          description: `Akun guru berhasil dibuat dengan password: ${result.temporaryPassword}`,
          duration: 10000,
        });
      } else {
        toast({
          title: "Berhasil!",
          description: "Akun guru berhasil dibuat",
        });
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

  const handleDelete = async () => {
    if (!accountToDelete) return;

    try {
      await deleteTeacherAccount(accountToDelete);
      toast({ title: "Berhasil!", description: "Akun guru berhasil dihapus" });
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
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
      teacherId: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  // Filter teachers that don't have accounts yet
  const availableTeachers = teachers.filter(
    teacher => !accounts.some(account => account.teacher_id === teacher.id)
  );

  const formContent = (
    <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="teacherId">Nama Guru</Label>
        <Controller
          name="teacherId"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih guru" />
              </SelectTrigger>
              <SelectContent>
                {availableTeachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name} - {teacher.nip}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.teacherId && (
          <p className="text-sm text-destructive">{String(errors.teacherId.message)}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="email@contoh.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{String(errors.email.message)}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Min. 12 karakter"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{String(errors.password.message)}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Ulangi password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{String(errors.confirmPassword.message)}</p>
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

  if (loading && accounts.length === 0) {
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/teachers")} className="hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Akun Guru</h1>
              <p className="text-sm opacity-90">{accounts.length} akun terdaftar</p>
            </div>
          </div>
          
          {isMobile ? (
            <Drawer open={dialogOpen} onOpenChange={setDialogOpen}>
              <DrawerTrigger asChild>
                <Button size="sm" onClick={resetForm} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
                  <Plus className="w-4 h-4" />
                  Tambah
                </Button>
              </DrawerTrigger>
              <DrawerContent className="px-4 pb-8 rounded-none flex flex-col max-h-[95vh]">
                <DrawerHeader className="px-0 flex-shrink-0">
                  <DrawerTitle>Buat Akun Guru</DrawerTitle>
                </DrawerHeader>
                <div className="flex-1 overflow-y-auto px-1 py-2">
                  {formContent}
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
              <DialogContent className="max-w-md sm:max-w-lg rounded-none sm:rounded-lg max-h-[95vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Buat Akun Guru</DialogTitle>
                  <DialogDescription>
                    Buat akun login untuk guru yang sudah terdaftar
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-1 py-2">
                  {formContent}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid gap-4">
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Belum ada akun guru</h3>
              <p className="text-muted-foreground mb-4">Buat akun guru untuk memberikan akses login</p>
            </div>
          ) : (
            accounts.map((account) => (
              <div key={account.id} className="bg-card border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{account.teachers?.name}</h3>
                  <p className="text-sm text-muted-foreground">NIP: {account.teachers?.nip}</p>
                  <p className="text-sm text-muted-foreground">Email: {account.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setAccountToDelete(account.id);
                    setDeleteDialogOpen(true);
                  }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Akun Guru</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus akun guru ini? Tindakan ini tidak dapat dibatalkan.
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
