import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { School2, Users, ClipboardList } from "lucide-react";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t md:hidden safe-area-bottom z-50">
      <div className="flex items-center justify-around p-2">
        <Button 
          variant={location.pathname === "/dashboard" ? "default" : "ghost"} 
          size="sm" 
          onClick={() => navigate("/dashboard")}
          className="flex-col h-auto py-2 px-3 gap-1"
        >
          <School2 className="w-5 h-5" />
          <span className="text-xs">Dashboard</span>
        </Button>
        <Button 
          variant={location.pathname === "/teachers" ? "default" : "ghost"} 
          size="sm" 
          onClick={() => navigate("/teachers")}
          className="flex-col h-auto py-2 px-3 gap-1"
        >
          <Users className="w-5 h-5" />
          <span className="text-xs">Guru</span>
        </Button>
        <Button 
          variant={location.pathname === "/supervisions" ? "default" : "ghost"} 
          size="sm" 
          onClick={() => navigate("/supervisions")}
          className="flex-col h-auto py-2 px-3 gap-1"
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-xs">Supervisi</span>
        </Button>
      </div>
    </div>
  );
}
