import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, ClipboardList, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

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

  return (
    <>
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
            className={`flex-col h-auto py-2 px-3 gap-1 ${
              isActive("/supervisions")
                ? "bg-[#FF7A18] text-white rounded-xl"
                : "text-muted-foreground"
            }`}
            onClick={() => navigate("/supervisions")}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-xs font-medium">Supervisi</span>
          </Button>

          <Button
            variant="ghost"
            className={`flex-col h-auto py-2 px-3 gap-1 ${
              isActive("/profile")
                ? "bg-primary text-primary-foreground rounded-xl"
                : "text-muted-foreground"
            }`}
            onClick={() => navigate("/profile")}
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">Profil</span>
          </Button>

          <Button
            variant="ghost"
            className="flex-col h-auto py-2 px-3 gap-1 text-muted-foreground"
            onClick={() => setLogoutDialogOpen(true)}
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs font-medium">Keluar</span>
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
