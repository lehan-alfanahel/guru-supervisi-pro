import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, ShieldCheck, User } from "lucide-react";
import { useForm } from "react-hook-form";
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

type UserType = "admin" | "teacher";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<UserType>("teacher");
  const { signUp, signIn, user, userRole, loading: authLoading } = useAuth();
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

  // Redirect berdasarkan userRole dari AuthContext — tanpa DB query tambahan
  useEffect(() => {
    if (authLoading || !user || !userRole) return;

    if (userRole === "teacher") {
      navigate("/teacher/dashboard", { replace: true });
    } else if (userRole === "admin") {
      navigate("/dashboard", { replace: true });
    }
  }, [user?.id, userRole, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    reset();
  }, [isLogin, userType, reset]);

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
        // Redirect ditangani oleh useEffect di atas setelah user state terupdate
        toast({ title: "Selamat datang!", description: "Login berhasil" });
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--gradient-primary)" }}>
      <div className="w-full max-w-md space-y-4">
        {/* Logo & Title */}
        <div className="text-center space-y-2">
          <button
            onClick={() => navigate("/")}
            className="mx-auto w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/30"
          >
            <GraduationCap className="w-10 h-10 text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white tracking-wide">SUPERVISI DIGITAL GURU</h1>
          <p className="text-white/80 text-sm">Platform supervisi modern untuk sekolah Indonesia</p>
        </div>

        {/* User Type Selector */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-1 flex gap-1 border border-white/20">
          <button
            type="button"
            onClick={() => { setUserType("teacher"); setIsLogin(true); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              userType === "teacher"
                ? "bg-white text-primary shadow-md"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
          >
            <User className="w-4 h-4" />
            Login Guru
          </button>
          <button
            type="button"
            onClick={() => { setUserType("admin"); setIsLogin(true); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              userType === "admin"
                ? "bg-white text-primary shadow-md"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Kepala Sekolah
          </button>
        </div>

        {/* Auth Card */}
        <Card className="shadow-[var(--shadow-elevated)] border-0">
          <CardHeader className="space-y-1 pb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${userType === "teacher" ? "bg-primary/10" : "bg-orange-100"}`}>
              {userType === "teacher"
                ? <User className="w-5 h-5 text-primary" />
                : <ShieldCheck className="w-5 h-5 text-orange-500" />}
            </div>
            <CardTitle className="text-xl">
              {userType === "teacher" ? "Login Guru" : "Login Kepala Sekolah"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? userType === "teacher"
                  ? "Masukkan email dan password akun guru Anda"
                  : "Masukkan email dan password akun kepala sekolah"
                : "Buat akun kepala sekolah baru"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={userType === "teacher" ? "email.guru@sekolah.sch.id" : "kepala@sekolah.sch.id"}
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Memproses..." : isLogin ? "Masuk" : "Daftar"}
              </Button>
            </form>

            {userType === "admin" && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isLogin ? "Belum punya akun? Daftar sebagai Kepala Sekolah" : "Sudah punya akun? Masuk"}
                </button>
              </div>
            )}

            {userType === "teacher" && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">
                  Akun guru dibuat oleh kepala sekolah.<br />
                  Hubungi kepala sekolah jika belum memiliki akun.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
