import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createSchool } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { getUserFriendlyError } from "@/lib/errorHandler";
import { School2 } from "lucide-react";
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

export default function SetupSchool() {
  const [loading, setLoading] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
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

  const onSubmit = async (data: z.infer<typeof schoolSchema>) => {
    if (!user) return;

    setLoading(true);
    try {
      await createSchool({
        name: data.name,
        npsn: data.npsn || "",
        address: data.address || "",
        phone: data.phone || "",
        principal_name: data.principal_name,
        principal_nip: data.principal_nip,
        owner_id: user.id,
      });

      // Create admin role for the user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'admin'
        });

      if (roleError) {
        console.error("Error creating admin role:", roleError);
        // Continue even if role creation fails
      }

      toast({
        title: "Berhasil!",
        description: "Profil sekolah berhasil disimpan",
      });
      navigate("/dashboard");
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

  const handleCancel = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-2xl mx-auto pt-8">
        <Card className="shadow-[var(--shadow-elevated)]">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <School2 className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Setup Profil Sekolah</CardTitle>
                <CardDescription>Lengkapi data sekolah Anda</CardDescription>
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

              <div className="flex gap-1.5 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancel}
                  disabled={loading}
                  size="lg"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? "Menyimpan..." : "Simpan & Lanjutkan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
