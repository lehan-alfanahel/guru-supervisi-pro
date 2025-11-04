import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, ClipboardList, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TeacherBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="flex items-center justify-around px-2 py-2">
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
            isActive("/teacher/account")
              ? "bg-primary text-primary-foreground rounded-xl"
              : "text-muted-foreground"
          }`}
          onClick={() => navigate("/teacher/account")}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs font-medium">Keluar</span>
        </Button>
      </div>
    </nav>
  );
}
