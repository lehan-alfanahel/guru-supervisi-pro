import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { GraduationCap, School2, ClipboardList, TrendingUp, Menu } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo & App Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="font-bold text-base md:text-xl">SUPERVISI DIGITAL GURU</span>
            </div>
            
            {/* Desktop Auth Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="text-primary-foreground hover:bg-white/10"
              >
                Masuk
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                className="gap-2"
              >
                Daftar
              </Button>
            </div>

            {/* Mobile Menu */}
            <div className="sm:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col gap-4 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate("/auth");
                      }}
                      className="w-full"
                    >
                      Masuk
                    </Button>
                    <Button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate("/auth");
                      }}
                      className="w-full gap-2"
                    >
                      Daftar
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="py-16 md:py-24" style={{ background: 'var(--gradient-primary)' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white px-4">
          <div className="inline-block mb-6 p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
            <GraduationCap className="w-16 h-16" />
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6">
            SUPERVISI DIGITAL GURU
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-8 text-white/90">
            Platform modern untuk supervisi kinerja guru secara digital, efisien, dan terstruktur
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-white text-primary hover:bg-white/90 shadow-lg text-base md:text-lg px-6 md:px-8 w-full sm:w-auto gap-2"
            >
              Mulai Sekarang
            </Button>
          </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Fitur Utama</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-card p-8 rounded-2xl shadow-[var(--shadow-card)] border border-border">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <School2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Manajemen Sekolah</h3>
              <p className="text-muted-foreground">
                Kelola profil sekolah dan data kepala sekolah dengan mudah dalam satu platform terpadu
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl shadow-[var(--shadow-card)] border border-border">
              <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                <ClipboardList className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Supervisi Digital</h3>
              <p className="text-muted-foreground">
                Lakukan supervisi kelengkapan perangkat pembelajaran dan penilaian secara digital dan terstruktur
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl shadow-[var(--shadow-card)] border border-border">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Laporan Lengkap</h3>
              <p className="text-muted-foreground">
                Dapatkan laporan supervisi yang komprehensif dan mudah dipahami untuk evaluasi kinerja guru
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 md:py-24" style={{ background: 'var(--gradient-secondary)' }}>
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Siap Meningkatkan Kualitas Supervisi?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Bergabunglah dengan kepala sekolah lainnya yang telah menggunakan platform digital untuk supervisi yang lebih efektif
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-white text-secondary hover:bg-white/90 shadow-lg text-lg px-8 gap-2"
          >
            Daftar Gratis
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Supervisi Digital Guru. Platform supervisi modern untuk sekolah Indonesia.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
