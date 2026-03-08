import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SetupSchool from "./pages/SetupSchool";
import Dashboard from "./pages/Dashboard";
import Teachers from "./pages/Teachers";
import TeacherAccounts from "./pages/TeacherAccounts";
import Supervisions from "./pages/Supervisions";
import SupervisionObservation from "./pages/SupervisionObservation";
import SupervisionATP from "./pages/SupervisionATP";
import Coaching from "./pages/Coaching";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherProfile from "./pages/TeacherProfile";
import TeacherAccount from "./pages/TeacherAccount";
import TeacherSupervision from "./pages/TeacherSupervision";
import TeacherHistory from "./pages/TeacherHistory";
import TeacherCoaching from "./pages/TeacherCoaching";
import TeacherNotifications from "./pages/TeacherNotifications";
import SupervisionModulAjar from "./pages/SupervisionModulAjar";
import AdminNotifications from "./pages/AdminNotifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: ('admin' | 'teacher')[] }) {
  const { user, userRole, loading } = useAuth();

  // Show spinner only while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check role-based access only after role is resolved
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    if (userRole === 'admin') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/teacher/dashboard" replace />;
    }
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/setup-school" element={<ProtectedRoute allowedRoles={['admin']}><SetupSchool /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
            <Route path="/teachers" element={<ProtectedRoute allowedRoles={['admin']}><Teachers /></ProtectedRoute>} />
            <Route path="/teacher-accounts" element={<ProtectedRoute allowedRoles={['admin']}><TeacherAccounts /></ProtectedRoute>} />
            <Route path="/supervisions" element={<ProtectedRoute allowedRoles={['admin']}><Supervisions /></ProtectedRoute>} />
            <Route path="/supervision-observation" element={<ProtectedRoute allowedRoles={['admin']}><SupervisionObservation /></ProtectedRoute>} />
            <Route path="/supervision-atp" element={<ProtectedRoute allowedRoles={['admin']}><SupervisionATP /></ProtectedRoute>} />
            <Route path="/supervision-modul-ajar" element={<ProtectedRoute allowedRoles={['admin']}><SupervisionModulAjar /></ProtectedRoute>} />
            <Route path="/coaching" element={<ProtectedRoute allowedRoles={['admin']}><Coaching /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute allowedRoles={['admin']}><Profile /></ProtectedRoute>} />
            <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/profile" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherProfile /></ProtectedRoute>} />
            <Route path="/teacher/supervision" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherSupervision /></ProtectedRoute>} />
            <Route path="/teacher/account" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherAccount /></ProtectedRoute>} />
            <Route path="/teacher/history" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherHistory /></ProtectedRoute>} />
            <Route path="/teacher/coaching" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherCoaching /></ProtectedRoute>} />
            <Route path="/teacher/notifications" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherNotifications /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
