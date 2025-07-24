import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Navbar } from "@/components/Layout/Navbar";
import { Footer } from "@/components/Layout/Footer";

// Pages
import { Landing } from "./pages/Landing";
import { Login } from "./pages/auth/Login";
import { Signup } from "./pages/auth/Signup";
import { Dashboard } from "./pages/Dashboard";
import { AgentForm } from "./pages/agents/AgentForm";
import { Playground } from "./pages/agents/Playground";
import { Deploy } from "./pages/agents/Deploy";
import { Billing } from "./pages/Billing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Layout component for authenticated pages
const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
  </div>
);

// Layout component for public pages
const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              <PublicLayout>
                <Landing />
              </PublicLayout>
            } />
            
            {/* Auth Routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            
            {/* Authenticated Routes - TODO: Add auth protection */}
            <Route path="/dashboard" element={
              <AuthenticatedLayout>
                <Dashboard />
              </AuthenticatedLayout>
            } />
            <Route path="/agents/new" element={
              <AuthenticatedLayout>
                <AgentForm />
              </AuthenticatedLayout>
            } />
            <Route path="/agents/:id/edit" element={
              <AuthenticatedLayout>
                <AgentForm />
              </AuthenticatedLayout>
            } />
            <Route path="/agents/:id/playground" element={
              <AuthenticatedLayout>
                <Playground />
              </AuthenticatedLayout>
            } />
            <Route path="/agents/:id/deploy" element={
              <AuthenticatedLayout>
                <Deploy />
              </AuthenticatedLayout>
            } />
            <Route path="/billing" element={
              <AuthenticatedLayout>
                <Billing />
              </AuthenticatedLayout>
            } />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
