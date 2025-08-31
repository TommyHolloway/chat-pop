import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicNavbar } from "@/components/Layout/PublicNavbar";
import { AuthenticatedNavbar } from "@/components/Layout/AuthenticatedNavbar";
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { WorkspaceLayout } from "@/components/Layout/WorkspaceLayout";
import { Footer } from "@/components/Layout/Footer";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

// Pages
import { Landing } from "./pages/Landing";
import { Contact } from "./pages/Contact";
import { TermsOfService } from "./pages/TermsOfService";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import Security from "./pages/Security";
import { Pricing } from "./pages/Pricing";
import { SecureLogin } from "./pages/auth/SecureLogin";
import { SecureSignup } from "./pages/auth/SecureSignup";
import { WorkspaceOverview } from "./pages/WorkspaceOverview";
import { Agents } from "./pages/Agents";
import { Billing } from "./pages/Billing";
import { Settings } from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AdminPortal from "./pages/AdminPortal";
import { AdminRoute } from "./components/AdminRoute";
import { AgentLayout } from "./pages/agents/AgentLayout";
import { PublicChat } from "./pages/agents/PublicChat";

const queryClient = new QueryClient();

// Layout component for authenticated pages
const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <SidebarInset className="flex flex-col flex-1">
        <AuthenticatedNavbar />
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </div>
  </SidebarProvider>
);

// Layout component for public pages
const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <PublicNavbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
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
              <Route path="/contact" element={
                <PublicLayout>
                  <Contact />
                </PublicLayout>
              } />
              <Route path="/terms" element={
                <PublicLayout>
                  <TermsOfService />
                </PublicLayout>
              } />
              <Route path="/privacy" element={
                <PublicLayout>
                  <PrivacyPolicy />
                </PublicLayout>
              } />
              <Route path="/security" element={
                <PublicLayout>
                  <Security />
                </PublicLayout>
              } />
              <Route path="/pricing" element={
                <PublicLayout>
                  <Pricing />
                </PublicLayout>
              } />
              
              {/* Public Agent Routes */}
              <Route path="/agents/:id/chat" element={<PublicChat />} />
              
              {/* Auth Routes */}
              <Route path="/auth/login" element={<SecureLogin />} />
              <Route path="/auth/signup" element={<SecureSignup />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <WorkspaceLayout>
                    <WorkspaceOverview />
                  </WorkspaceLayout>
                </ProtectedRoute>
              } />
              <Route path="/workspace/:workspaceId/agents/:id/*" element={
                <ProtectedRoute>
                  <WorkspaceLayout>
                    <AgentLayout />
                  </WorkspaceLayout>
                </ProtectedRoute>
              } />
              <Route path="/billing" element={
                <ProtectedRoute>
                  <WorkspaceLayout>
                    <Billing />
                  </WorkspaceLayout>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <WorkspaceLayout>
                    <Settings />
                  </WorkspaceLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <AdminRoute>
                  <WorkspaceLayout>
                    <AdminPortal />
                  </WorkspaceLayout>
                </AdminRoute>
              } />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
