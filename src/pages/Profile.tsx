import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSchool, updateSchool, School } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, School2, Save } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schoolSchema = z.object({
  name: z.string().trim().min(3, "Nama sekolah minimal 3 karakter").max(200, "Nama sekolah maksimal 200 karakter"),
  npsn: z.string().trim().regex(/^[0-9]{8}$/, "NPSN harus 8 digit angka").optional().or(z.literal("")),
  address: z.string().trim().max(500, "Alamat maksimal 500 karakter").optional(),
  phone: z.string().trim().regex(/^[0-9\-+() ]{7,20}$/, "Format nomor telepon tidak valid").optional().or(z.literal("")),
  principal_name: z.string().trim().min(3, "Nama kepala sekolah minimal 3 karakter").max(100, "Nama kepala sekolah maksimal 100 karakter"),
  principal_nip: z.string().trim().regex(/^[0-9]{18}$/, "NIP harus 18 digit angka"),
});

export default function Profile() {
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    reset,
  } = useForm<z.infer<typeof schoolSchema>>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: "",
      npsn: "",
      address: "",
      phone: "",
      principal_name: "",
      principal_nip: "",
    },
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadSchool();
  }, [user, navigate]);

  const loadSchool = async () => {
    if (!user) return;

    try {
      const schoolData = await getSchool(user.id);
      if (!schoolData) {
        navigate("/setup-school");
        return;
      }

      setSchool(schoolData);
      reset({
        name: schoolData.name,
        npsn: schoolData.npsn || "",
        address: schoolData.address || "",
        phone: schoolData.phone || "",
        principal_name: schoolData.principal_name,
        principal_nip: schoolData.principal_nip,
      });
    } catch (error) {
      console.error("Error loading school:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data sekolah",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof schoolSchema>) => {
    if (!school) return;

    setSaving(true);
    try {
      await updateSchool(school.id, {
        name: data.name,
        npsn: data.npsn || "",
        address: data.address || "",
        phone: data.phone || "",
        principal_name: data.principal_name,
        principal_nip: data.principal_nip,
      });
      toast({
        title: "Berhasil!",
        description: "Profil sekolah berhasil diperbarui",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui profil sekolah",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="bg-primary text-primary-foreground border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/dashboard")} 
            className="hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Profil Sekolah</h1>
            <p className="text-sm opacity-90">Kelola informasi sekolah</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto p-4">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <School2 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle>Informasi Sekolah</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Level Akses: Admin/Kepala Sekolah</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Sekolah *</Label>
                <Input
                  id="name"
                  placeholder="Contoh: SMP Negeri 1 Jakarta"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{String(errors.name.message)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="npsn">NPSN (8 digit)</Label>
                <Input
                  id="npsn"
                  placeholder="12345678"
                  {...register("npsn")}
                />
                {errors.npsn && (
                  <p className="text-sm text-destructive">{String(errors.npsn.message)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat Lengkap</Label>
                <Textarea
                  id="address"
                  placeholder="Jalan, Kelurahan, Kecamatan, Kota/Kabupaten"
                  {...register("address")}
                  rows={3}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{String(errors.address.message)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="021-12345678"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{String(errors.phone.message)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="principal_name">Nama Kepala Sekolah *</Label>
                <Input
                  id="principal_name"
                  placeholder="Nama lengkap kepala sekolah"
                  {...register("principal_name")}
                />
                {errors.principal_name && (
                  <p className="text-sm text-destructive">{String(errors.principal_name.message)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="principal_nip">NIP Kepala Sekolah * (18 digit)</Label>
                <Input
                  id="principal_nip"
                  placeholder="123456789012345678"
                  {...register("principal_nip")}
                />
                {errors.principal_nip && (
                  <p className="text-sm text-destructive">{String(errors.principal_nip.message)}</p>
                )}
              </div>

              {/* Account Information */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3">Informasi Akun</h3>
                <div className="space-y-3 bg-muted/50 p-3 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="font-mono text-sm">{user?.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Level Akses</p>
                    <p className="font-medium">Administrator</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => navigate("/dashboard")}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gap-1.5"
                  disabled={saving}
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
