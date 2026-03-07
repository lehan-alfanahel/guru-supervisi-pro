import { useNavigate, useLocation } from "react-router-dom";
import { Home, ClipboardList, User, History, MessageSquare, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";

export function TeacherBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="flex items-center justify-around px-1 py-2 max-w-lg mx-auto">
        <Button
          variant="ghost"
          className={`flex-col h-auto py-2 px-2 gap-1 ${
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
          className={`flex-col h-auto py-2 px-2 gap-1 ${
            isActive("/teacher/supervision")
              ? "bg-secondary text-secondary-foreground rounded-xl"
              : "text-muted-foreground"
          }`}
          onClick={() => navigate("/teacher/supervision")}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-xs font-medium">Supervisi</span>
        </Button>

        <Button
          variant="ghost"
          className={`flex-col h-auto py-2 px-2 gap-1 ${
            isActive("/teacher/coaching")
              ? "bg-primary text-primary-foreground rounded-xl"
              : "text-muted-foreground"
          }`}
          onClick={() => navigate("/teacher/coaching")}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-xs font-medium">Coaching</span>
        </Button>

        <Button
          variant="ghost"
          className={`flex-col h-auto py-2 px-2 gap-1 relative ${
            isActive("/teacher/notifications")
              ? "bg-primary text-primary-foreground rounded-xl"
              : "text-muted-foreground"
          }`}
          onClick={() => navigate("/teacher/notifications")}
        >
          <span className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>
          <span className="text-xs font-medium">Notifikasi</span>
        </Button>

        <Button
          variant="ghost"
          className={`flex-col h-auto py-2 px-2 gap-1 ${
            isActive("/teacher/profile")
              ? "bg-primary text-primary-foreground rounded-xl"
              : "text-muted-foreground"
          }`}
          onClick={() => navigate("/teacher/profile")}
        >
          <User className="w-5 h-5" />
          <span className="text-xs font-medium">Profil</span>
        </Button>
      </div>
    </nav>
  );
}
