import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-background">Carregando...</div>;
  }

  if (!session) {
    // Se não houver sessão, manda para o login (/)
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};