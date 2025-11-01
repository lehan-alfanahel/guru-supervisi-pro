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
import { School2 } from "lucide-react";

export default function SetupSchool() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    npsn: "",
    address: "",
    phone: "",
    principal_name: "",
    principal_nip: "",
  });
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await createSchool({
        ...formData,
        owner_id: user.id,
      });

      toast({
        title: "Berhasil!",
        description: "Profil sekolah berhasil disimpan",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan data sekolah",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Sekolah *</Label>
                <Input
                  id="name"
                  placeholder="Contoh: SMP Negeri 1 Jakarta"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="npsn">NPSN</Label>
                <Input
                  id="npsn"
                  placeholder="Nomor Pokok Sekolah Nasional"
                  value={formData.npsn}
                  onChange={(e) => handleChange("npsn", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat Lengkap</Label>
                <Textarea
                  id="address"
                  placeholder="Jalan, Kelurahan, Kecamatan, Kota/Kabupaten"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="021-12345678"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="principal_name">Nama Kepala Sekolah *</Label>
                <Input
                  id="principal_name"
                  placeholder="Nama lengkap kepala sekolah"
                  value={formData.principal_name}
                  onChange={(e) => handleChange("principal_name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="principal_nip">NIP Kepala Sekolah *</Label>
                <Input
                  id="principal_nip"
                  placeholder="Nomor Induk Pegawai"
                  value={formData.principal_nip}
                  onChange={(e) => handleChange("principal_nip", e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-6"
                disabled={loading}
                size="lg"
              >
                {loading ? "Menyimpan..." : "Simpan & Lanjutkan"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
