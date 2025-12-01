import React, { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HelmetProvider } from 'react-helmet-async';
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicNavbar } from "@/components/Layout/PublicNavbar";
import { AuthenticatedNavbar } from "@/components/Layout/AuthenticatedNavbar";
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { WorkspaceLayout } from "@/components/Layout/WorkspaceLayout";
import { Footer } from "@/components/Layout/Footer";
import { LoadingSpinner } from "@/components/LoadingSpinner";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

// Critical pages (loaded immediately)
import Landing from "./pages/Landing";
import { SecureLogin } from "./pages/auth/SecureLogin";
import { SecureSignup } from "./pages/auth/SecureSignup";
import { PublicChat } from "./pages/agents/PublicChat";

// Non-critical pages (lazy loaded for better performance)
const Contact = lazy(() => import("./pages/Contact").then(m => ({ default: m.Contact })));
const TermsOfService = lazy(() => import("./pages/TermsOfService").then(m => ({ default: m.TermsOfService })));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy").then(m => ({ default: m.PrivacyPolicy })));
const Pricing = lazy(() => import("./pages/Pricing").then(m => ({ default: m.Pricing })));
const Features = lazy(() => import("./pages/Features").then(m => ({ default: m.Features })));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword").then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword").then(m => ({ default: m.ResetPassword })));
const WorkspaceOverview = lazy(() => import("./pages/WorkspaceOverview").then(m => ({ default: m.WorkspaceOverview })));
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const Agents = lazy(() => import("./pages/Agents").then(m => ({ default: m.Agents })));
const Billing = lazy(() => import("./pages/Billing").then(m => ({ default: m.Billing })));
const Settings = lazy(() => import("./pages/Settings").then(m => ({ default: m.Settings })));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminPortal = lazy(() => import("./pages/AdminPortal"));
const AdminRoute = lazy(() => import("./components/AdminRoute").then(m => ({ default: m.AdminRoute })));
const AgentLayout = lazy(() => import("./pages/agents/AgentLayout").then(m => ({ default: m.AgentLayout })));
const AgentOnboardingWizard = lazy(() => import("./components/onboarding/AgentOnboardingWizard").then(m => ({ default: m.AgentOnboardingWizard })));
const ShopifyOnboarding = lazy(() => import("./pages/ShopifyOnboarding").then(m => ({ default: m.ShopifyOnboarding })));
const ShopifyAdminLayout = lazy(() => import("./pages/shopify-admin/ShopifyAdminLayout").then(m => ({ default: m.ShopifyAdminLayout })));

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
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
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
              <Route path="/features" element={
                <PublicLayout>
                  <Features />
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
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              
              {/* Onboarding Routes */}
              <Route path="/agents/onboarding" element={
                <ProtectedRoute>
                  <AgentOnboardingWizard />
                </ProtectedRoute>
              } />
              <Route path="/shopify-onboarding" element={
                <ProtectedRoute>
                  <ShopifyOnboarding />
                </ProtectedRoute>
              } />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <WorkspaceLayout>
                    <Dashboard />
                  </WorkspaceLayout>
                </ProtectedRoute>
              } />
              <Route path="/agents" element={
                <ProtectedRoute>
                  <WorkspaceLayout>
                    <Agents />
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
              
              {/* Shopify Embedded App Routes */}
              <Route path="/shopify-admin/*" element={
                <ProtectedRoute>
                  <ShopifyAdminLayout />
                </ProtectedRoute>
              } />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
