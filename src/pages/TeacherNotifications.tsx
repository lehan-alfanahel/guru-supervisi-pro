import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, BellOff, CheckCheck, ClipboardList, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNotifications } from "@/hooks/use-notifications";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function TeacherNotifications() {
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
    return <ClipboardList className="w-5 h-5 text-primary" />;
  };

  const getIconBg = (type: string) => {
    if (type === "coaching") return "bg-secondary/10";
    return "bg-primary/10";
  };

  const handleDelete = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    toast({ title: "Notifikasi dihapus" });
  };

  const handleClick = async (id: string, isRead: boolean) => {
    if (!isRead) await markAsRead(id);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-primary text-primary-foreground px-4 pt-10 pb-4 shadow-md">
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/10 -ml-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Notifikasi</h1>
            <p className="text-xs text-primary-foreground/70">Riwayat pemberitahuan</p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground/80 hover:bg-white/10 text-xs gap-1.5"
              onClick={markAllAsRead}
            >
              <CheckCheck className="w-4 h-4" />
              Tandai semua dibaca
            </Button>
          )}
        </div>

        {/* Tab filter */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "unread" | "read")}>
          <TabsList className="bg-white/10 w-full h-9">
            <TabsTrigger value="all" className="flex-1 text-xs text-primary-foreground data-[state=active]:bg-white data-[state=active]:text-primary">
              Semua
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 bg-white/20 text-primary-foreground">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1 text-xs text-primary-foreground data-[state=active]:bg-white data-[state=active]:text-primary">
              Belum Dibaca
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="read" className="flex-1 text-xs text-primary-foreground data-[state=active]:bg-white data-[state=active]:text-primary">
              Sudah Dibaca
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              {tab === "unread" ? (
                <CheckCheck className="w-7 h-7 text-muted-foreground/50" />
              ) : (
                <BellOff className="w-7 h-7 text-muted-foreground/50" />
              )}
            </div>
            <p className="font-medium text-foreground/70">
              {tab === "unread" ? "Semua notifikasi telah dibaca" : tab === "read" ? "Belum ada notifikasi yang dibaca" : "Belum ada notifikasi"}
            </p>
            <p className="text-sm text-muted-foreground">
              {tab === "unread" ? "Notifikasi baru akan muncul di sini." : "Pemberitahuan dari kepala sekolah akan tampil di sini."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((notif) => (
              <li
                key={notif.id}
                className={`flex gap-3 px-4 py-4 transition-colors ${!notif.is_read ? "bg-primary/5" : "bg-background"}`}
                onClick={() => handleClick(notif.id, notif.is_read)}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${getIconBg(notif.type)}`}>
                  {getIcon(notif.type)}
                </div>

                {/* Content */}
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
                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-3 mt-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 h-5 ${notif.type === "coaching" ? "border-secondary/40 text-secondary" : "border-primary/40 text-primary"}`}
                    >
                      {notif.type === "coaching" ? "Coaching" : "Supervisi"}
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
    </div>
  );
}
