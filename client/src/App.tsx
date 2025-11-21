import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch, Redirect } from "wouter";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Diario from "./pages/Diario";
import Propostas from "./pages/Propostas";
import TestSchema from "./pages/TestSchema";
import MainLayout from "@/components/MainLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-primary">Carregando...</div></div>;
  if (!user) return <Redirect to="/auth" />;
  
  return <MainLayout>{children}</MainLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <AuthProvider>
          <Switch>
            <Route path="/auth" component={Auth} />
            <Route path="/">
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            </Route>
            <Route path="/diario">
              <ProtectedRoute><Diario /></ProtectedRoute>
            </Route>
            <Route path="/propostas">
              <ProtectedRoute><Propostas /></ProtectedRoute>
            </Route>
            <Route path="/historico">
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            </Route>
            <Route path="/recebiveis">
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            </Route>
            <Route path="/test-schema">
              <ProtectedRoute><TestSchema /></ProtectedRoute>
            </Route>
            <Route component={NotFound} />
          </Switch>
        </AuthProvider>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
