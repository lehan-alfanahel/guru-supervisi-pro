import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TeacherBottomNav } from "@/components/TeacherBottomNav";
import { TeacherHeader } from "@/components/TeacherHeader";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Building2, Hash, Award, Briefcase, Pencil } from "lucide-react";

interface TeacherProfileData {
  name: string;
  nip: string;
  email: string;
  rank: string;
  employment_type: string;
  gender?: string;
  address?: string;
  schoolName: string;
  teacherId: string;
}

export default function TeacherProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<TeacherProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", gender: "", address: "" });

  useEffect(() => {
    if (!user?.id) {
      navigate("/auth");
      return;
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadProfile = async () => {
    try {
      const { data: teacherAccount, error: accountError } = await supabase
        .from("teacher_accounts")
        .select(`
          email,
          teachers (
            id,
            name,
            nip,
            rank,
            employment_type,
            gender,
            address,
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

        setProfile({
          name: teacher.name,
          nip: teacher.nip,
          email: teacherAccount.email,
          rank: teacher.rank,
          employment_type: teacher.employment_type,
          gender: teacher.gender,
          address: teacher.address,
          schoolName: school.name,
          teacherId: teacher.id,
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = () => {
    if (!profile) return;
    setEditForm({
      name: profile.name,
      gender: profile.gender || "",
      address: profile.address || "",
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("teachers")
        .update({
          name: editForm.name.trim(),
          gender: editForm.gender || null,
          address: editForm.address.trim() || null,
        })
        .eq("id", profile.teacherId);

      if (error) throw error;

      setProfile(prev => prev ? {
        ...prev,
        name: editForm.name.trim(),
        gender: editForm.gender || undefined,
        address: editForm.address.trim() || undefined,
      } : null);

      setEditOpen(false);
      toast({ title: "Berhasil!", description: "Profil berhasil diperbarui" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Gagal menyimpan profil", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
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
      <TeacherHeader
        teacherName={profile.name}
        schoolName={profile.schoolName}
      />

      <main className="max-w-5xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Profil Saya</h2>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={openEdit}>
            <Pencil className="w-3.5 h-3.5" /> Edit Profil
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pribadi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProfileField icon={<User className="w-5 h-5" />} label="Nama Lengkap" value={profile.name} />
              <ProfileField icon={<Hash className="w-5 h-5" />} label="NIP" value={profile.nip} />
              <ProfileField icon={<Mail className="w-5 h-5" />} label="Email" value={profile.email} />
              {profile.gender && <ProfileField icon={<User className="w-5 h-5" />} label="Jenis Kelamin" value={profile.gender} />}
              {profile.address && <ProfileField icon={<Building2 className="w-5 h-5" />} label="Alamat" value={profile.address} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informasi Kepegawaian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProfileField icon={<Building2 className="w-5 h-5" />} label="Sekolah" value={profile.schoolName} />
              <ProfileField icon={<Award className="w-5 h-5" />} label="Pangkat/Golongan" value={profile.rank} />
              <ProfileField icon={<Briefcase className="w-5 h-5" />} label="Status Kepegawaian" value={profile.employment_type} />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama Lengkap</Label>
              <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-gender">Jenis Kelamin</Label>
              <Select value={editForm.gender} onValueChange={(v) => setEditForm(p => ({ ...p, gender: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                  <SelectItem value="Perempuan">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Alamat</Label>
              <Textarea id="edit-address" rows={3} value={editForm.address} onChange={(e) => setEditForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>Batal</Button>
              <Button className="flex-1" disabled={saving || !editForm.name.trim()} onClick={handleSave}>
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TeacherBottomNav />
    </div>
  );
}

function ProfileField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
