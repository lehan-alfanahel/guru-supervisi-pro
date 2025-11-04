import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, ClipboardList, User, LogOut } from "lucide-react";
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

export function TeacherBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Berhasil",
        description: "Anda telah keluar dari akun",
      });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal keluar dari akun",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        <Button
          variant="ghost"
          className={`flex-col h-auto py-2 px-3 gap-1 ${
            isActive("/teacher/dashboard")
              ? "bg-primary text-primary-foreground rounded-xl"
              : "text-muted-foreground"
          }`}
          onClick={() => navigate("/teacher/dashboard")}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs font-medium">Beranda</span>
        </Button>

        <Button
          variant="ghost"
          className={`flex-col h-auto py-2 px-3 gap-1 ${
            isActive("/teacher/profile")
              ? "bg-primary text-primary-foreground rounded-xl"
              : "text-muted-foreground"
          }`}
          onClick={() => navigate("/teacher/profile")}
        >
          <User className="w-5 h-5" />
          <span className="text-xs font-medium">Profil</span>
        </Button>

        <Button
          variant="ghost"
          className={`flex-col h-auto py-2 px-3 gap-1 ${
            isActive("/teacher/supervision")
              ? "bg-[#FF7A18] text-white rounded-xl"
              : "text-muted-foreground"
          }`}
          onClick={() => navigate("/teacher/supervision")}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-xs font-medium">Supervisi</span>
        </Button>

        <Button
          variant="ghost"
          className={`flex-col h-auto py-2 px-3 gap-1 ${
            isActive("/teacher/account")
              ? "bg-primary text-primary-foreground rounded-xl"
              : "text-muted-foreground"
          }`}
          onClick={() => navigate("/teacher/account")}
        >
          <User className="w-5 h-5" />
          <span className="text-xs font-medium">Account</span>
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

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari Akun?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan keluar dari akun guru. Anda perlu login kembali untuk mengakses aplikasi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
}
