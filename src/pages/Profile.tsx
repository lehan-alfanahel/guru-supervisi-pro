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

export default function Profile() {
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      setFormData({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;

    setSaving(true);
    try {
      await updateSchool(school.id, formData);
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
    <div className="min-h-screen bg-background pb-24 md:pb-4">
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
              <CardTitle>Informasi Sekolah</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Sekolah</Label>
                <Input
                  id="name"
                  placeholder="Contoh: SMP Negeri 1 Jakarta"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="npsn">NPSN</Label>
                <Input
                  id="npsn"
                  placeholder="Nomor Pokok Sekolah Nasional"
                  value={formData.npsn}
                  onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat Lengkap</Label>
                <Textarea
                  id="address"
                  placeholder="Jalan, Kelurahan, Kecamatan, Kota/Kabupaten"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="principal_name">Nama Kepala Sekolah</Label>
                <Input
                  id="principal_name"
                  placeholder="Nama lengkap kepala sekolah"
                  value={formData.principal_name}
                  onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="principal_nip">NIP Kepala Sekolah</Label>
                <Input
                  id="principal_nip"
                  placeholder="Nomor Induk Pegawai"
                  value={formData.principal_nip}
                  onChange={(e) => setFormData({ ...formData, principal_nip: e.target.value })}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={saving}
              >
                <Save className="w-4 h-4" />
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
