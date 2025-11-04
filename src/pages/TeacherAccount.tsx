import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherBottomNav } from "@/components/TeacherBottomNav";
import { Mail, Key } from "lucide-react";

interface AccountInfo {
  email: string;
  userId: string;
}

export default function TeacherAccount() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    loadAccountInfo();
  }, [user, navigate]);

  const loadAccountInfo = async () => {
    try {
      const { data: teacherAccount, error } = await supabase
        .from("teacher_accounts")
        .select("email")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      setAccountInfo({
        email: teacherAccount.email,
        userId: user?.id || "",
      });
    } catch (error) {
      console.error("Error loading account info:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!accountInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Data tidak ditemukan</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-primary text-primary-foreground p-6">
        <h1 className="text-2xl font-bold">Akun</h1>
        <p className="text-sm opacity-90">Informasi akun Anda</p>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Akun</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Email Login</p>
                <p className="font-medium">{accountInfo.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-medium text-xs break-all">{accountInfo.userId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Keamanan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Untuk mengubah password atau informasi akun lainnya, silakan hubungi administrator sekolah.
            </p>
          </CardContent>
        </Card>
      </div>

      <TeacherBottomNav />
    </div>
  );
}
