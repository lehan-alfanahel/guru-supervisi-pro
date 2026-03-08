import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, BellOff, CheckCheck, ClipboardList, MessageSquare,
  BookOpen, Trash2, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminBottomNav } from "@/components/AdminBottomNav";
import { useNotifications } from "@/hooks/use-notifications";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function AdminNotifications() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [tab, setTab] = useState<"all" | "unread" | "read">("all");

  const filtered = notifications.filter((n) => {
    if (tab === "unread") return !n.is_read;
    if (tab === "read") return n.is_read;
    return true;
  });

  const getIcon = (type: string) => {
    if (type === "coaching") return <MessageSquare className="w-5 h-5 text-secondary" />;
    if (type === "administration" || type === "administration_update")
      return <BookOpen className="w-5 h-5 text-accent" />;
    return <ClipboardList className="w-5 h-5 text-primary" />;
  };

  const getIconBg = (type: string) => {
    if (type === "coaching") return "bg-secondary/10";
    if (type === "administration" || type === "administration_update") return "bg-accent/10";
    return "bg-primary/10";
  };

  const getTypeLabel = (type: string) => {
    if (type === "coaching") return "Coaching";
    if (type === "administration") return "Administrasi";
    if (type === "administration_update") return "Update Adm.";
    if (type === "observation") return "Observasi";
    if (type === "atp_supervision") return "ATP";
    if (type === "modul_ajar_supervision") return "Modul Ajar";
    return "Supervisi";
  };

  const getTypeBadgeClass = (type: string) => {
    if (type === "coaching") return "border-secondary/40 text-secondary";
    if (type === "administration" || type === "administration_update")
      return "border-accent/40 text-accent";
    return "border-primary/40 text-primary";
  };

  const getNavigationPath = (type: string) => {
    if (type === "coaching") return "/coaching";
    if (type === "administration" || type === "administration_update") return "/dashboard";
    if (type === "observation") return "/supervision-observation";
    if (type === "atp_supervision") return "/supervision-atp";
    if (type === "modul_ajar_supervision") return "/supervision-modul-ajar";
    return "/supervisions";
  };

  const handleClick = async (id: string, isRead: boolean, type: string) => {
    if (!isRead) await markAsRead(id);
    navigate(getNavigationPath(type));
  };

  const handleDelete = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    toast({ title: "Notifikasi dihapus" });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-primary text-primary-foreground border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-white/10"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-base font-bold">Notifikasi</h1>
            <p className="text-xs opacity-80">Riwayat pemberitahuan</p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 text-xs gap-1.5"
              onClick={markAllAsRead}
            >
              <CheckCheck className="w-4 h-4" />
              Tandai semua
            </Button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-[57px] z-20 bg-background border-b px-4 pt-3 pb-3 shadow-sm">
        <div className="max-w-2xl mx-auto">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "unread" | "read")}>
            <TabsList className="w-full h-9">
              <TabsTrigger value="all" className="flex-1 text-xs">
                Semua
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                  {notifications.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex-1 text-xs">
                Belum Dibaca
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="read" className="flex-1 text-xs">
                Sudah Dibaca
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              {tab === "unread"
                ? <CheckCheck className="w-7 h-7 text-muted-foreground/50" />
                : <BellOff className="w-7 h-7 text-muted-foreground/50" />}
            </div>
            <p className="font-medium text-foreground/70">
              {tab === "unread"
                ? "Semua notifikasi telah dibaca"
                : tab === "read"
                ? "Belum ada notifikasi yang dibaca"
                : "Belum ada notifikasi"}
            </p>
            <p className="text-sm text-muted-foreground">
              {tab === "unread"
                ? "Notifikasi baru akan muncul di sini."
                : "Pemberitahuan dari guru akan tampil di sini."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((notif) => (
              <li
                key={notif.id}
                className={`flex gap-3 px-4 py-4 transition-colors cursor-pointer hover:bg-muted/40 ${
                  !notif.is_read ? "bg-primary/5" : "bg-background"
                }`}
                onClick={() => handleClick(notif.id, notif.is_read, notif.type)}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${getIconBg(notif.type)}`}
                >
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm leading-tight ${!notif.is_read ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 h-5 ${getTypeBadgeClass(notif.type)}`}
                    >
                      {getTypeLabel(notif.type)}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: localeId })}
                    </span>
                    <span className="text-[11px] text-muted-foreground/60">
                      {format(new Date(notif.created_at), "dd MMM yyyy, HH:mm", { locale: localeId })}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AdminBottomNav />
    </div>
  );
}
