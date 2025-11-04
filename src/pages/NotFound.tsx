import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center p-8">
        <div className="inline-block mb-6 p-4 rounded-2xl bg-destructive/10">
          <AlertCircle className="w-16 h-16 text-destructive" />
        </div>
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <p className="mb-2 text-2xl font-semibold">Halaman Tidak Ditemukan</p>
        <p className="mb-8 text-muted-foreground max-w-md">
          Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan.
        </p>
        <Button onClick={() => navigate("/")} size="lg" className="gap-1.5">
          <Home className="w-5 h-5" />
          Kembali ke Beranda
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
