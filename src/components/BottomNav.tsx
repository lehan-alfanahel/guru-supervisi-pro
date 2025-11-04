import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { School2, Users, ClipboardList, User, LogOut } from "lucide-react";
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

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Berhasil keluar",
      description: "Anda telah keluar dari aplikasi",
    });
    navigate("/auth");
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t safe-area-bottom z-50">
        <div className="flex items-center justify-around p-2">
          <Button 
            variant={location.pathname === "/dashboard" ? "default" : "ghost"} 
            size="sm" 
            onClick={() => navigate("/dashboard")}
            className="flex-col h-auto py-2 px-3 gap-0.5"
          >
            <School2 className="w-5 h-5" />
            <span className="text-xs">Beranda</span>
          </Button>
          <Button 
            variant={location.pathname === "/teachers" ? "default" : "ghost"} 
            size="sm" 
            onClick={() => navigate("/teachers")}
            className="flex-col h-auto py-2 px-3 gap-0.5"
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">Guru</span>
          </Button>
          <Button 
            variant={location.pathname === "/supervisions" ? "default" : "ghost"} 
            size="sm" 
            onClick={() => navigate("/supervisions")}
            className="flex-col h-auto py-2 px-3 gap-0.5"
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-xs">Supervisi</span>
          </Button>
          <Button 
            variant={location.pathname === "/profile" ? "default" : "ghost"} 
            size="sm" 
            onClick={() => navigate("/profile")}
            className="flex-col h-auto py-2 px-3 gap-0.5"
          >
            <User className="w-5 h-5" />
            <span className="text-xs">Profil</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLogoutDialogOpen(true)}
            className="flex-col h-auto py-2 px-3 gap-0.5"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs">Keluar</span>
          </Button>
        </div>
      </div>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar dari aplikasi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut}>
              Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
