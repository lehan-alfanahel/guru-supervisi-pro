import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, ClipboardList, MessageSquare, BookOpen, Eye, ChevronUp, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export function AdminBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { unreadCount } = useNotifications();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [supervisiMenuOpen, setSupervisiMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Berhasil keluar",
        description: "Anda telah keluar dari aplikasi",
      });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal keluar dari aplikasi",
        variant: "destructive",
      });
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const isSupervisiActive = isActive("/supervisions") || isActive("/supervision-observation") || isActive("/supervision-atp") || isActive("/supervision-modul-ajar");

  const handleSupervisiClick = () => {
    setSupervisiMenuOpen((prev) => !prev);
  };

  const handleSupervisiNav = (path: string) => {
    setSupervisiMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Supervisi Sub-menu Popup */}
      {supervisiMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setSupervisiMenuOpen(false)}
          />
          {/* Sub-menu panel */}
          <div className="fixed bottom-[68px] left-1/2 -translate-x-1/2 z-50 bg-popover border rounded-2xl shadow-xl overflow-hidden w-72">
            <div className="px-4 pt-3 pb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Supervisi</p>
            </div>
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent ${
                isActive("/supervisions") ? "bg-primary/10 text-primary" : "text-foreground"
              }`}
              onClick={() => handleSupervisiNav("/supervisions")}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              Supervisi Administrasi
            </button>
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent border-t ${
                isActive("/supervision-observation") ? "bg-primary/10 text-primary" : "text-foreground"
              }`}
              onClick={() => handleSupervisiNav("/supervision-observation")}
            >
              <Eye className="w-4 h-4 shrink-0" />
              Supervisi Pelaksanaan
            </button>
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent border-t ${
                isActive("/supervision-atp") ? "bg-primary/10 text-primary" : "text-foreground"
              }`}
              onClick={() => handleSupervisiNav("/supervision-atp")}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              Supervisi ATP
            </button>
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent border-t ${
                isActive("/supervision-modul-ajar") ? "bg-primary/10 text-primary" : "text-foreground"
              }`}
              onClick={() => handleSupervisiNav("/supervision-modul-ajar")}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              Telaah Modul Ajar
            </button>
          </div>
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="flex items-center justify-around px-2 py-2">
          <Button
            variant="ghost"
            className={`flex-col h-auto py-2 px-3 gap-1 ${
              isActive("/dashboard")
                ? "bg-primary text-primary-foreground rounded-xl"
                : "text-muted-foreground"
            }`}
            onClick={() => navigate("/dashboard")}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Beranda</span>
          </Button>

          <Button
            variant="ghost"
            className={`flex-col h-auto py-2 px-3 gap-1 ${
              isActive("/teachers")
                ? "bg-primary text-primary-foreground rounded-xl"
                : "text-muted-foreground"
            }`}
            onClick={() => navigate("/teachers")}
          >
            <Users className="w-5 h-5" />
            <span className="text-xs font-medium">Guru</span>
          </Button>

          <Button
            variant="ghost"
            className={`flex-col h-auto py-2 px-3 gap-1 relative ${
              isSupervisiActive || supervisiMenuOpen
                ? "bg-[#FF7A18] text-white rounded-xl"
                : "text-muted-foreground"
            }`}
            onClick={handleSupervisiClick}
          >
            {supervisiMenuOpen ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ClipboardList className="w-5 h-5" />
            )}
            <span className="text-xs font-medium">Supervisi</span>
          </Button>

          <Button
            variant="ghost"
            className={`flex-col h-auto py-2 px-3 gap-1 ${
              isActive("/coaching")
                ? "bg-primary text-primary-foreground rounded-xl"
                : "text-muted-foreground"
            }`}
            onClick={() => navigate("/coaching")}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs font-medium">Coaching</span>
          </Button>

          <Button
            variant="ghost"
            className={`flex-col h-auto py-2 px-3 gap-1 relative ${
              isActive("/admin/notifications")
                ? "bg-primary text-primary-foreground rounded-xl"
                : "text-muted-foreground"
            }`}
            onClick={() => navigate("/admin/notifications")}
          >
            <div className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">Notifikasi</span>
          </Button>



        </div>
      </nav>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari Aplikasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan keluar dari akun Anda. Pastikan semua data sudah tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut}>Keluar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default AdminBottomNav;
