import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellRing, CheckCheck, ClipboardList, MessageSquare, BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen((v) => !v);

  const getNavigationPath = (type: string) => {
    if (type === "coaching") return "/coaching";
    if (type === "administration" || type === "administration_update") return "/dashboard";
    if (type === "observation") return "/supervision-observation";
    if (type === "atp_supervision") return "/supervision-atp";
    if (type === "modul_ajar_supervision") return "/supervision-modul-ajar";
    return "/supervisions";
  };

  const handleNotificationClick = async (notifId: string, isRead: boolean, type: string) => {
    if (!isRead) await markAsRead(notifId);
    setOpen(false);
    navigate(getNavigationPath(type));
  };

  const getIcon = (type: string) => {
    if (type === "coaching") return <MessageSquare className="w-4 h-4 text-primary" />;
    if (type === "administration" || type === "administration_update")
      return <BookOpen className="w-4 h-4 text-accent" />;
    return <ClipboardList className="w-4 h-4 text-secondary-foreground" />;
  };

  const getIconBg = (type: string) => {
    if (type === "coaching") return "bg-primary/10";
    if (type === "administration" || type === "administration_update") return "bg-accent/10";
    return "bg-secondary";
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative hover:bg-white/10 flex-shrink-0"
        onClick={handleOpen}
        aria-label="Notifikasi"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 animate-[ring_1s_ease-in-out]" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-12 w-80 max-h-[80vh] bg-popover border border-border rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm text-foreground">Notifikasi</span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                    onClick={markAllAsRead}
                  >
                    <CheckCheck className="w-3.5 h-3.5 mr-1" />
                    Tandai semua
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setOpen(false)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                  <Bell className="w-8 h-8 opacity-30" />
                  <p className="text-sm">Belum ada notifikasi</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {notifications.map((notif) => (
                    <li
                      key={notif.id}
                      className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-accent ${
                        !notif.is_read ? "bg-primary/5" : ""
                      }`}
                      onClick={() => handleNotificationClick(notif.id, notif.is_read, notif.type)}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${getIconBg(notif.type)}`} // design tokens used in helper fn
                      >
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-tight ${!notif.is_read ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[11px] text-muted-foreground/70 mt-1">
                          {formatDistanceToNow(new Date(notif.created_at), {
                            addSuffix: true,
                            locale: localeId,
                          })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Footer: Lihat Semua */}
            <div className="border-t px-4 py-2.5">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-primary hover:text-primary hover:bg-primary/5"
                onClick={() => { setOpen(false); navigate("/admin/notifications"); }}
              >
                Lihat semua notifikasi
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
