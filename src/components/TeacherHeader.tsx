import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { School, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface TeacherHeaderProps {
  teacherName?: string;
  schoolName?: string;
}

export function TeacherHeader({ teacherName = "", schoolName = "" }: TeacherHeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    loadEmail();
  }, [user]);

  const loadEmail = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from("teacher_accounts")
        .select("email")
        .eq("user_id", user.id)
        .single();
      
      if (data) setEmail(data.email);
    } catch (error) {
      console.error("Error loading email:", error);
    }
  };

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

  return (
    <>
      <header className="bg-primary text-primary-foreground sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          {/* Left side */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <School className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm md:text-base font-bold leading-tight">SUPERVISI DIGITAL GURU</h1>
              <p className="text-xs opacity-90 truncate">{schoolName || "Loading..."}</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium leading-tight">{teacherName}</p>
              <p className="text-xs opacity-80 truncate max-w-[150px]">{email}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="hover:bg-white/10 flex-shrink-0"
              onClick={() => setLogoutDialogOpen(true)}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

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
