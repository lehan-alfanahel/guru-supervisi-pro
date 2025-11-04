import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Home, User, ClipboardList, UserCircle, LogOut } from "lucide-react";
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

export function TeacherBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

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
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto">
          <Button
            variant="ghost"
            className={`flex flex-col items-center gap-0.5 h-full flex-1 rounded-none ${
              isActive("/teacher/dashboard") ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={() => navigate("/teacher/dashboard")}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Beranda</span>
          </Button>

          <Button
            variant="ghost"
            className={`flex flex-col items-center gap-0.5 h-full flex-1 rounded-none ${
              isActive("/teacher/profile") ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={() => navigate("/teacher/profile")}
          >
            <User className="w-5 h-5" />
            <span className="text-xs">Profil</span>
          </Button>

          <Button
            variant="ghost"
            className={`flex flex-col items-center gap-0.5 h-full flex-1 rounded-none ${
              isActive("/teacher/supervision") ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={() => navigate("/teacher/supervision")}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-xs">Supervisi</span>
          </Button>

          <Button
            variant="ghost"
            className={`flex flex-col items-center gap-0.5 h-full flex-1 rounded-none ${
              isActive("/teacher/account") ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={() => navigate("/teacher/account")}
          >
            <UserCircle className="w-5 h-5" />
            <span className="text-xs">Account</span>
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center gap-0.5 h-full flex-1 rounded-none text-muted-foreground"
            onClick={() => setShowLogoutDialog(true)}
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs">Keluar</span>
          </Button>
        </div>
      </div>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar dari aplikasi?
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
