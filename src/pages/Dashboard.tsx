import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSchool, getTeachers, getSupervisions, School, Teacher } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { School2, Users, ClipboardList, LogOut } from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function Dashboard() {
  const [school, setSchool] = useState<School | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [supervisions, setSupervisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
      const schoolData = await getSchool(user.id);
      
      if (!schoolData) {
        navigate("/setup-school");
        return;
      }

      setSchool(schoolData);
      const [teachersData, supervisionsData] = await Promise.all([
        getTeachers(schoolData.id),
        getSupervisions(schoolData.id),
      ]);

      setTeachers(teachersData);
      setSupervisions(supervisionsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <School2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">SUPERVISI DIGITAL GURU</h1>
              <p className="text-sm opacity-90">{school?.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="hover:bg-white/10">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 pb-24 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Guru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{teachers.length}</p>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Total Supervisi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-secondary">{supervisions.length}</p>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <School2 className="w-4 h-4" />
                Bulan Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-accent">
                {supervisions.filter(s => {
                  const date = new Date(s.supervision_date);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Menu Utama</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => navigate("/teachers")}
              className="h-auto py-6 justify-start gap-4"
              variant="outline"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Data Guru</p>
                <p className="text-sm text-muted-foreground">Kelola data guru</p>
              </div>
            </Button>

            <Button
              onClick={() => navigate("/supervisions")}
              className="h-auto py-6 justify-start gap-4"
              variant="outline"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Supervisi</p>
                <p className="text-sm text-muted-foreground">Buat & lihat supervisi</p>
              </div>
            </Button>

            <Button
              onClick={() => navigate("/school-profile")}
              className="h-auto py-6 justify-start gap-4"
              variant="outline"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <School2 className="w-6 h-6 text-accent" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Profil Sekolah</p>
                <p className="text-sm text-muted-foreground">Lihat & edit profil</p>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Supervisions */}
        {supervisions.length > 0 && (
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Supervisi Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supervisions.slice(0, 5).map((supervision) => (
                  <div key={supervision.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{supervision.teachers?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(supervision.supervision_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/supervisions`)}>
                      Lihat
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
