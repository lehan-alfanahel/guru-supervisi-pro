import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap } from "lucide-react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getUserFriendlyError } from "@/lib/errorHandler";

const loginSchema = z.object({
  email: z.string().trim().email("Email tidak valid").max(255, "Email maksimal 255 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter").max(100, "Password maksimal 100 karakter"),
});

const signUpSchema = z.object({
  email: z.string().trim().email("Email tidak valid").max(255, "Email maksimal 255 karakter"),
  password: z.string()
    .min(12, "Password minimal 12 karakter")
    .max(100, "Password maksimal 100 karakter")
    .regex(/[A-Z]/, "Password harus mengandung huruf besar")
    .regex(/[a-z]/, "Password harus mengandung huruf kecil")
    .regex(/[0-9]/, "Password harus mengandung angka")
    .regex(/[^A-Za-z0-9]/, "Password harus mengandung karakter khusus"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak sama",
  path: ["confirmPassword"],
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { signUp, signIn, user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(isLogin ? loginSchema : signUpSchema),
    mode: "onSubmit",
  });

  useEffect(() => {
    const checkRole = async () => {
      if (!user) return;

      // If userRole is available, use it for navigation
      if (userRole) {
        if (userRole === 'teacher') {
          navigate("/teacher/dashboard");
        } else if (userRole === 'admin') {
          // Check if admin has school profile
          const { data: schoolData } = await supabase
            .from("schools")
            .select("id")
            .eq("owner_id", user.id)
            .maybeSingle();

          if (schoolData) {
            navigate("/dashboard");
          } else {
            navigate("/setup-school");
          }
        }
        return;
      }

      // Fallback: Check database if userRole is not yet loaded
      try {
        // Check if user is a teacher
        const { data: teacherAccount, error: teacherError } = await supabase
          .from("teacher_accounts")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (teacherError) throw teacherError;

        if (teacherAccount) {
          navigate("/teacher/dashboard");
          return;
        }

        // If not a teacher, check if they have a school profile (school admin)
        const { data: schoolData, error: schoolError } = await supabase
          .from("schools")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (schoolError) throw schoolError;

        if (schoolData) {
          navigate("/dashboard");
        } else {
          navigate("/setup-school");
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        navigate("/");
      }
    };

    if (user) {
      checkRole();
    }
  }, [user, userRole, navigate]);

  useEffect(() => {
    reset();
  }, [isLogin, reset]);

  const onSubmit = async (data: z.infer<typeof loginSchema> | z.infer<typeof signUpSchema>) => {
    setLoading(true);

    try {
      if (!isLogin) {
        const { error } = await signUp(data.email, data.password);
        if (error) throw error;

        toast({
          title: "Berhasil!",
          description: "Akun berhasil dibuat. Silakan login.",
        });
        setIsLogin(true);
      } else {
        const { error } = await signIn(data.email, data.password);
        if (error) throw error;

        // After successful login, check user role
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (currentUser) {
          // Check if user is a teacher
          const { data: teacherAccount } = await supabase
            .from("teacher_accounts")
            .select("id")
            .eq("user_id", currentUser.id)
            .maybeSingle();

          if (teacherAccount) {
            toast({
              title: "Berhasil!",
              description: "Login berhasil - Guru",
            });
            navigate("/teacher/dashboard");
          } else {
            // Check if user has a school (school owner/admin)
            const { data: schoolData } = await supabase
              .from("schools")
              .select("id")
              .eq("owner_id", currentUser.id)
              .maybeSingle();

            toast({
              title: "Berhasil!",
              description: "Login berhasil",
            });

            if (schoolData) {
              navigate("/dashboard");
            } else {
              navigate("/setup-school");
            }
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--gradient-primary)' }}>
      <Card className="w-full max-w-md shadow-[var(--shadow-elevated)]">
        <CardHeader className="space-y-3 text-center">
          <button 
            onClick={() => navigate("/")}
            className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <GraduationCap className="w-10 h-10 text-primary-foreground" />
          </button>
          <CardTitle className="text-2xl font-bold">SUPERVISI DIGITAL GURU</CardTitle>
          <CardDescription>
            {isLogin ? "Masuk ke akun Anda" : "Buat akun baru"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@sekolah.sch.id"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{String(errors.email.message)}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{String(errors.password.message)}</p>
              )}
            </div>
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Masukkan password lagi"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{String(errors.confirmPassword.message)}</p>
                )}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Memproses..." : isLogin ? "Masuk" : "Daftar"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
